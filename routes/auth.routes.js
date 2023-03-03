const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/auth.controller');
const oAuthLogin = require('../middlewares/auth').oAuth;
const {
  login,
  register,
  oAuth,
  refresh,
  sendPasswordReset,
  passwordReset,
} = require('../validations/auth.validation');

const router = express.Router();

router.route('/register').post(controller.register);

router.route('/login').post(controller.login);

router.route('/refresh-token').post(controller.refresh);

router.route('/send-password-reset').post(controller.sendPasswordReset);

router.route('/reset-password').post(controller.resetPassword);

router.route('/facebook').post(oAuthLogin('facebook'), controller.oAuth); //validate(oAuth),

router.route('/google').post(oAuthLogin('google'), controller.oAuth); //validate(oAuth),

module.exports = router;
