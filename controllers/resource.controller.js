const httpStatus = require('http-status');
const { Types } = require('mongoose');
const User = require('../models/user.model');
const Resource = require('../models/resource.model');
const ApiError = require('../errors/api-error');
const {
  s3Uploadv2,
  s3Uploadv3,
  s3Delete3,
  uploadFolder,
} = require('../utils/uploadHelper');

/// responses to be all converted to jsonp

exports.newUpload = async (req, res) => {
  try {
    const { user } = req;
    const { isFile, folderId, folderName } = req.body;
    let parentKey = `${user._id}/`;
    let parent = user._id || folderId;
    let data = {};
    let newChildrenList = [];
    let newParentList = [];
    /////////////////////// if more depth folders required change key and parent key to let and uncomment below code
    ///////////////////////////////////////////////////////////////////////////////////////////
    if (folderId) {
      //check if folder present
      const folderCheck = await Resource.findById(folderId);
      if (!folderCheck) {
        // throw new ApiError('no folder with that id', 404, 1);
        return new ApiError({
          message: 'Validation Error',
          errors: [
            {
              field: 'folderId',
              location: 'body',
              messages: ['"folder" does not exists'],
            },
          ],
          status: httpStatus.CONFLICT,
          isPublic: true,
        });
      }

      const { parentList, children } = folderCheck;
      newParentList = parentList;
      newChildrenList = children;
      newParentList.push({
        parentId: folderId,
        parentName: folderCheck.name,
      });
      console.log(parentList, ' new parent list');
      parentKey = `${folderCheck.key}`;
      parent = folderId;
    }

    if (isFile * 1) {
      // take storage details Object // to be taken to validations section
      const totalStorage = user.storage.freeStorage.total;
      const consumedStorage = user.storage.freeStorage.consumed;
      const availableStorage = user.storage.freeStorage.available;

      //calculate total images size in a request // to be handled in middlewares
      const imagesSize = req.files.reduce((acc, file) => acc + file.size, 0);

      if (availableStorage < imagesSize) {
        return new ApiError({
          message: 'Free Storage Exhausted',
          errors: [
            {
              field: null,
              location: 'req.files',
              messages: ['Free Storage Exhausted'],
            },
          ],
          status: httpStatus[429],
          isPublic: true,
        });
      }

      const newConsumed = consumedStorage + imagesSize;
      const newAvailable = totalStorage - newConsumed;

      const uploads = await s3Uploadv2(req.files, parentKey, user._id);
      if (uploads) {
        const results = uploads.map((upload) => ({
          name: upload.fileName,
          owner: user._id,
          parent: parent,
          parentList: newParentList,
          isFile: true,
          size: upload.size,
          key: upload.key,
          url: upload.url,
          folderId: folderId,
        }));

        const newFiles = await Resource.insertMany(results);

        // newChildrenList.push(...newFiles.map((file) => file._id));
        // console.log(newChildrenList, 'this is newChildrenList');

        // const updatedParentFolder = await Resource.findByIdAndUpdate(parent, {
        //   $set: {
        //     children: newChildrenList,
        //   },
        // });
        // console.log(updatedParentFolder, 'is updated Children');

        // update the user Storage

        const updatedStorage = {
          freeStorage: {
            total: totalStorage,
            consumed: newConsumed,
            available: newAvailable,
          },
        };
        const updateUser = await User.findByIdAndUpdate(user._id, {
          $set: {
            storage: updatedStorage,
          },
        });

        res.status(201).json({
          status: 'success',
          data: { newFiles },
          storage: updatedStorage,
        });
      }
      ////////////////////////////////////////
    } else {
      const newFolderKey = `${parentKey}${req.body.folderName}`;
      console.log(newParentList, ' new parent List');
      // console.log(key);
      const results = await uploadFolder(newFolderKey);
      if (results.$metadata.httpStatusCode !== 404) {
        data = {
          name: req.body.folderName,
          parent: parent,
          parentList: newParentList,
          owner: user._id,
          isFile: false,
          key: `${newFolderKey}/`,
          parentKey: parentKey,
        };
        //key to be added in model and will be required

        const newResource = await Resource.create(data);

        newChildrenList.push(newResource._id);
        console.log(newChildrenList, 'this is newChildrenList');

        const updatedParentFolder = await Resource.findByIdAndUpdate(parent, {
          $set: {
            children: newChildrenList,
          },
        });
        console.log(updatedParentFolder, 'is updated Children');
        res.status(201).send({
          status: 'success',
          data: newResource,
        });
      }
    }
  } catch (e) {
    res.status(400).json({
      status: 'fail',
      message: e.message,
    });
  }
  //if file/s'
};

exports.getFileList = async (req, res) => {
  try {
    const { user } = req;
    const queryObject = { ...req.query, owner: user._id };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObject[el]);

    // advanced filtering
    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log('====================================');
    console.log(JSON.parse(queryStr));
    console.log('====================================');

    let query = Resource.find(JSON.parse(queryStr));

    // sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numFolders = await query.countDocuments();
      console.log(numFolders);
      if (skip >= numFolders) {
        throw new Error('this page doesnt exist');
      }
    }
    // const query = { owner: userId };

    const resources = await query;
    res.status(200).json({
      status: 'success',
      data: { resources },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.Delete = async (req, res) => {
  try {
    const { user } = req;
    const totalStorage = user.storage.freeStorage.total;
    const consumedStorage = user.storage.freeStorage.consumed;
    const availableStorage = user.storage.freeStorage.available;

    const resource = await Resource.findById(req.params.id);
    // console.log(resource);
    const { key, size } = resource;
    console.log(key);
    const deleteFile = await s3Delete3([key]);
    console.log(deleteFile);

    const newConsumed = consumedStorage - size;
    const newAvailable = totalStorage - newConsumed;
    const updatedStorage = {
      freeStorage: {
        total: totalStorage,
        consumed: newConsumed,
        available: newAvailable,
      },
    };

    // update user Storage
    const updateUser = await User.findByIdAndUpdate(user._id, {
      $set: {
        storage: updatedStorage,
      },
    });
    res.status(204).json({
      status: 'success',
      requestTime: req.requestTime,
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      requestTime: req.requestTime,
      message: error,
    });
  }
};

exports.renameResource = async (req, res, next) => {
  try {
    const userId = '63ff396233da897ead559a7b';
    const { id } = req.params;

    console.log(req.params);
    const newName = req.body.fileName;
    const queryChildren = { parent: id };
    const resource = await Resource.findById(id).populate('children');

    const childrenToBeUpdated = Resource.find();

    // if (!resource.isFile) {
    //   if (resource.children.length > 1) {
    //     // const updatedChildren = await Promise.all();
    //   }
    // }

    // const folder = await File.findByIdAndUpdate(query, {
    //   $set: { name: newName },
    // });
    res.status(200).json({
      status: 'success',
      data: {
        resource: resource,
        childrenToBeUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};
