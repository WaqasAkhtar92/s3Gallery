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
/**
 * @openapi
 * /register:
 *   post:
 *       tag:
 *       - Auth
 *       description: Responds if the app is up and running
 *       responses:
 *         200:
 *           description: App is Up and Running
 */
router.route('/register').post(controller.register);
/**
 * @openapi
 * /login:
 *   post:
 *       tag:
 *       - Auth
 *       description: Responds if the app is up and running
 *       responses:
 *         200:
 *           description: App is Up and Running
 */

router.route('/login').post(controller.login);

/**
 * @openapi
 * /refresh-token:
 *   post:
 *       tag:
 *       - Auth
 *       description: Responds if the app is up and running
 *       responses:
 *         200:
 *           description: App is Up and Running
 */

router.route('/refresh-token').post(controller.refresh);

/**
 * @openapi
 * /send-password-reset:
 *   post:
 *       tag:
 *       - Auth
 *       description: Responds if the app is up and running
 *       responses:
 *         200:
 *           description: App is Up and Running
 */

router.route('/send-password-reset').post(controller.sendPasswordReset);

/**
 * @openapi
 * /reset-password:
 *   post:
 *       tag:
 *       - Auth
 *       description: Responds if the app is up and running
 *       responses:
 *         200:
 *           description: App is Up and Running
 */

router.route('/reset-password').post(controller.resetPassword);

router.route('/facebook').post(oAuthLogin('facebook'), controller.oAuth); //validate(oAuth),

router.route('/google').post(oAuthLogin('google'), controller.oAuth); //validate(oAuth),

module.exports = router;
