const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const imageExtList = ['jpeg', 'jpg', 'png', 'gif', 'svg', 'tiff', 'bmp'];
  const filename = file.originalname;

  if (filename.length < 1 || !filename.includes('.')) {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'), false);
  }

  const extSplit = filename.split('.');

  if (extSplit.length <= 1) {
    return false;
  }

  const ext = extSplit[extSplit.length - 1];

  //   return imageExtList.includes(ext.toLowerCase());

  if (imageExtList.includes(ext.toLowerCase())) {
    cb(null, true);
  }

  //   if (file.mimetype.split('/')[0] === 'image') {
  //     cb(null, true);
  //   } else {
  //     cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'), false);
  //   }
};

// ["image", "jpeg"]

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1000000000, files: 2 }
});

module.exports = upload;
