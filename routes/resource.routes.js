const express = require(`express`);
const upload = require('../middlewares/multer');

const resourceController = require('../controllers/resource.controller');
const { authorize, ADMIN, LOGGED_USER } = require('../middlewares/auth');
// const validate = require('../validations/tour.validate');

const router = express.Router();

//load resource when  api is called
router.param('id', resourceController.loadResource);
router
  //
  .route('/:id?')
  .get(authorize(), resourceController.getFileList)
  .post(authorize(), upload.array('myFile'), resourceController.newUpload)
  .patch(authorize(), resourceController.renameResource)
  .delete(authorize(), resourceController.Delete);

// router
//   .route('/:id')
//   //
//   .get(folderController.getFolderById)
//   //
//   .delete(folderController.deleteFolder);

module.exports = router;
