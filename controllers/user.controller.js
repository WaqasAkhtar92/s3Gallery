const User = require('../models/user.model');
const mongoose = require('mongoose');
// const s3 = require('../utils/S3Helper');

exports.createUser = async (req, res) => {
  try {
    const data = req.body;

    // const {user, accessToken, refreshToken} = await UserProvider.create(req.body);
    const newUser = await User.create(data);
    const { accessToken, refreshToken } = await user.generateAuthToken(uuid);
    const storage_prefix_user_key = encodeURIComponent(newUser._id) + '/';
    console.log(storage_prefix_user_key);

    // const params = {
    //     Bucket: bucket
    // }
    // s3.headObject({ Key: storage_prefix_user_key }, (err, data) => {
    //   if (err === null) {
    //     res.status(400).send('Album already exists.');
    //   }
    //   if (err.code !== 'NotFound') {
    //     return res.status(404).send({
    //       message: `There was an error creating your album: ${err.message}`,
    //     });
    //   }
    //   s3.putObject({ Key: storage_prefix_user_key }, (err, data) => {
    //     if (err) {
    //       return res.status(400).send({
    //         message: `There was an error creating your album: ${err.message}`,
    //       });
    //     }
    //     console.log(data);
    //   });
    // });

    // createLoginCookie(res, accessToken, refreshToken);

    res.status(201).send({
      status: 'success',
      data: newUser,
    });
  } catch (e) {
    console.log('\nCreate User Route Error:', e.message);
    const code = !e.code ? 500 : e.code >= 400 && e.code <= 599 ? e.code : 500;
    res.status(code).json({
      status: ' failed',
      error: e.message,
    });
  }
};

// exports.getUserDetailed = async (req, res) => {
//   try {
//     const { user } = req;
//     const { folderId } = req.query;

//     const queryObject = { ...req.query, owner: user._id };
//     const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     excludedFields.forEach((el) => delete queryObject[el]);

//     // advanced filtering
//     let queryStr = JSON.stringify(queryObject);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//     console.log('====================================');
//     console.log(JSON.parse(queryStr));
//     console.log('====================================');

//     // let query = File.find(JSON.parse(queryStr));

//     // console.log(userId, ' is userId');
//     let query = { parent: user._id };

//     if (folderId) {
//       query = { parent: folderId };
//     }

//     const rootFolders = await Folder.find(query);
//     const rootFiles = await File.find(query);

//     // const filesCheck = await File.aggregate([   //// working
//     //   { $match: { 'metadata.parent': user._id } },
//     // ]);

//     // aggregation;
//     const results = await User.aggregate([
//       {
//         $match: {
//           _id: mongoose.Types.ObjectId(user._id), //pass the user id
//         },
//       },
//       {
//         $lookup: {
//           from: 'folders', //your schema name from mongoDB
//           localField: '_id', //user_id from user(main) model
//           foreignField: 'parent', //user_id from user(sub) model
//           pipeline: [
//             {
//               $project: {
//                 //use to select the fileds you want to select
//                 name: 1, //:1 will select the field
//                 parent: 1,
//                 _id: 1, //:0 will not select the field
//               },
//             },
//           ],
//           as: 'folders', //result var name
//         },
//       },
//       {
//         $lookup: {
//           from: 'files', //your schema name from mongoDB
//           localField: '_id', //user_id from user(main) model
//           foreignField: 'parent', //user_id from user(sub) model
//           pipeline: [
//             {
//               $project: {
//                 //use to select the fileds you want to select
//                 metadata: 1, //:1 will select the field
//                 _id: 0, //:0 will not select the field
//               },
//             },
//           ],
//           as: 'files', //result var name
//         },
//       },
//       {
//         $project: {
//           //use to select the fileds you want to select
//           _id: 1, //:1 will select the field
//           email: 1,
//           storage: 1,
//         },
//       },
//     ]);

//     res.status(200).send({
//       status: 'success',
//       data: {
//         // results: results,
//         files: rootFiles,
//         Folders: rootFolders,
//         storage: user.storage,
//         aggregateResults: results,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       status: 'fail',
//       message: error.message,
//     });
//   }
// };
