const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { omitBy, isNil } = require('lodash');
const httpStatus = require('http-status');
const APIError = require('../errors/api-error');

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Resource',
    },
    isFile: {
      type: Boolean,
      required: true,
    },
    parentList: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    Parentkey: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.statics = {
  /**
   * Get folder
   *
   * @param {ObjectId} id - The objectId of folder.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    let resource;

    if (mongoose.Types.ObjectId.isValid(id)) {
      resource = await this.findById(id);
    }
    if (resource) {
      return resource;
    }

    throw new APIError({
      message: 'Resource does not exist',
      status: httpStatus.NOT_FOUND,
    });
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   *
   */
  CheckDuplicateError(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [
          {
            field: 'email',
            location: 'body',
            messages: ['"email" already exists'],
          },
        ],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },
};

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
