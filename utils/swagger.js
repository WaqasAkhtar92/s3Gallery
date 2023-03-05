const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { version } = require('../package.json');

const router = express.Router();
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Natours Api Docs',
      version,
    },
    components: {
      securitySchemas: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['routes/*.routes.js'],
};

const swaggerSpec = swaggerJsDoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

router.get('docs.json', (req, res) => {
  console.log('here');
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

module.exports = router;
