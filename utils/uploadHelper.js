const { S3 } = require('aws-sdk');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const APIError = require('../errors/api-error');

exports.s3Uploadv2 = async (files, key, userId) => {
  try {
    const s3 = new S3();

    const params = files.map((file) => ({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${key}${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      MetaData: {
        Type: 'UserDefined',
        owner: userId,
        // parentKey: parentKey,
        size: file.size,
      },
    }));

    const uploads = await Promise.all(
      params.map(async (param) => await s3.upload(param).promise())
    );

    const results = uploads.map((upload, index) => ({
      url: upload.Location,
      key: params[index].Key,
      size: files[index].size,
      fileName: files[index].originalname,
    }));
    console.log(results);
    return results;
  } catch (error) {
    return error;
  }
};

exports.uploadFolder = async (key) => {
  try {
    const s3Client = new S3Client();
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${key}/`,
    };
    // const checkResult = await s3Client.send(new HeadObjectCommand(params));
    // // console.log(checkResult);
    // if (checkResult.Metadata.httpStatusCode === 200) {
    //   console.log(checkResult, ' is s3 outputobject');
    //   throw new APIError({
    //     message: 'a folder with that name already exists',
    //   });
    // }
    return await s3Client.send(new PutObjectCommand(params));
  } catch (error) {
    return error;
  }
};
exports.s3Uploadv3 = async (files, key, userId) => {
  try {
    const s3client = new S3Client();

    const params = files.map((file) => ({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${key}/${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      MetaData: {
        Type: 'UserDefined',
        owner: userId,
        // parentKey: parentKey,
        size: file.size,
      },
    }));

    const results = await Promise.all(
      params.map(
        async (param) => await s3client.send(new PutObjectCommand(param))
      )
    );

    console.log(results);
    return results;
  } catch (error) {
    return error;
  }
};

exports.s3Delete3 = async (keys) => {
  try {
    const s3client = new S3Client();

    const params = keys.map((key) => ({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));

    const results = await Promise.all(
      params.map(
        async (param) => await s3client.send(new DeleteObjectCommand(param))
      )
    );

    return results;
  } catch (error) {
    return error;
  }
};

/////////////////// rewrite functions with check so as to prevent putting object with duplicate key on s3

// exports.s3Delete3 = async (keys) => { // check first then uplaod to s3
//   try {
//     const s3client = new S3Client();

//     const params = keys.map((key) => ({
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//     }));

//     s3client.send(new HeadObjectCommand(param))
//     const results = await Promise.all(
//       params.map(
//         async (param) => await s3client.send(new DeleteObjectCommand(param))
//       )
//     );
//     const checkResults = await Promise.all(params.map(async(param) => {
//         const check = await s3Client.send(new HeadObjectCommand(param));
//       return check
//       })

//     console.log(checkResults)

//     return results;
//   } catch (error) {
//     return error;
//   }
// };
