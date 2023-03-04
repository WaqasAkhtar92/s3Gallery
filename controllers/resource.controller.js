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

exports.loadResource = async (req, res, next, id) => {
  try {
    const resource = await Resource.get(id);
    req.LoadedResource = resource;
    if (req.method === 'DELETE') {
      if (!resource.isFile) {
        const checkResourceSize = await Resource.aggregate([
          { $match: { parentList: Types.ObjectId(id), isFile: true } },
          { $group: { _id: null, sum_val: { $sum: '$size' } } },
        ]);
        const deleteSize = checkResourceSize[0].sum_val;

        const resourcesToBeDeleted = await Resource.aggregate([
          { $match: { parentList: Types.ObjectId(id) } },
        ]);

        const keysForS3 = resourcesToBeDeleted.map((re) => re.key);
        keysForS3.push(resource.key);
        keysForS3.sort((a, b) => b.length - a.length);
        req.deleteSize = deleteSize;
        req.keysForS3 = keysForS3;
        return next();
      }
      req.keysForS3 = [...resource.key];
      req.deleteSize = resource.size;
      return next();
    }
    return next();
  } catch (error) {
    next(error);
  }
};

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
      newParentList.push(folderId);
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

        const newChildren = newFiles.map((file) => file._id);
        newChildrenList.push(...newChildren);
        console.log(newChildrenList, 'this is newChildrenList');

        const updatedParentFolder = await Resource.findByIdAndUpdate(parent, {
          $set: {
            children: newChildrenList,
          },
        });
        console.log(updatedParentFolder, 'is updated Children');

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
          size: 0,
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

exports.Delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user, LoadedResource, deleteSize, keysForS3 } = req;
    const { totalStorage, consumedStorage } = user.storage.freeStorage;
    /**
     *  Delete Children plus current Resource from S3. key for current is
     *  pushed into keysForS3 in param middleware
     */
    const deleteFile = await s3Delete3(keysForS3);
    console.log(LoadedResource.children);
    if (LoadedResource.children.length) {
      // Delete Children From Database
      const deleteChildrenFromDatabase = await Resource.deleteMany({
        parentList: Types.ObjectId(id),
      });
    }
    /**
     * Delete the resource itself
     */
    const deleteResource = await Resource.findByIdAndDelete();

    /**
     * Calculate Updated Storage For user
     */
    const newConsumed = consumedStorage - deleteSize;
    const newAvailable = totalStorage - newConsumed;
    const updatedStorage = {
      freeStorage: {
        totalStorage: totalStorage,
        consumedStorage: newConsumed,
        availableStorage: newAvailable,
      },
    };

    /**
     * Update User Storage
     */

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
    next(error);
  }
};

exports.renameResource = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(req.params);
    const { newName } = req.body;

    // if (!resource.isFile) {
    //   if (resource.children.length > 1) {
    //     // const updatedChildren = await Promise.all();
    //   }
    // }

    const resource = await Resource.findByIdAndUpdate(id, {
      $set: { name: newName },
    });
    res.status(200).json({
      status: 'success',
      data: {
        resource: resource,
      },
    });
  } catch (error) {
    next(error);
  }
};
