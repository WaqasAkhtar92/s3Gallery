const express = require('express');
const userController = require('../controllers/user.controller');
const { authorize, ADMIN, LOGGED_USER } = require('../middlewares/auth');

const router = express.Router();

// router.get('/user-service/user', userController.getUser);

// router.patch(
//   '/user-service/refresh-storage-size',
//   auth,
//   userController.refreshStorageSize
// );
// this is not working dont user this route. for future development only
router
  .route('/user-detailed/:userId')
  //
  .get(authorize(), userController.getUserDetailed);

// router.patch('/add-name', userController.addName);

module.exports = router;
