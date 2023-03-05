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
  /**
   * @openapi
   * /resource:
   *   get:
   *       tags:
   *       - Resource
   *       description: Responds if the app is up and running
   *       responses:
   *         200:
   *           description: App is Up and Running
   */
  .get(authorize(), resourceController.getFileList)
  /**
   * @openapi
   * /resource:
   *   post:
   *       tags:
   *       - Resource
   *       description: Responds if the app is up and running
   *       responses:
   *         200:
   *           description: App is Up and Running
   */
  .post(authorize(), upload.array('myFile'), resourceController.newUpload)
  /**
   * @openapi
   * /resource/:id:
   *   patch:
   *       tags:
   *       - Resource
   *       description: Responds if the app is up and running
   *       responses:
   *         200:
   *           description: App is Up and Running
   */
  .patch(authorize(), resourceController.renameResource)
  /**
   * @openapi
   * /resource/:id:
   *   delete:
   *       tags:
   *       - Resource
   *       description: Responds if the app is up and running
   *       responses:
   *         200:
   *           description: App is Up and Running
   */
  .delete(authorize(), resourceController.Delete);

// router
//   .route('/:id')
//   //
//   .get(folderController.getFolderById)
//   //
//   .delete(folderController.deleteFolder);

module.exports = router;
