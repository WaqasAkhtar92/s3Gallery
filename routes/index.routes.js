const express = require('express');
const userRoutes = require('./user.routes');
const authRoutes = require('./auth.routes');
const resourceRoutes = require('./resource.routes');
// const YAML = require('yamljs');
// const swaggerJsDocs = YAML.load('../openapi.yaml');
const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/users', userRoutes);
router.use('/resource', resourceRoutes);
router.use('/auth', authRoutes);

module.exports = router;
