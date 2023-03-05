const express = require('express');
const userRoutes = require('./user.routes');
const authRoutes = require('./auth.routes');
const resourceRoutes = require('./resource.routes');
const docsRouter = require('../utils/swagger');
// const YAML = require('yamljs');
// const swaggerJsDocs = YAML.load('../openapi.yaml');
const router = express.Router();

/**
 * @openapi
 * /status:
 *   get:
 *       tags:
 *       - Healthcheck
 *       description: Responds if the app is up and running
 *       responses:
 *         200:
 *           description: App is Up and Running
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/users', userRoutes);
router.use('/resource', resourceRoutes);
router.use('/auth', authRoutes);
router.use('/docs', docsRouter);

module.exports = router;
