require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { apiReference } = require('@scalar/express-api-reference');
const { logger } = require('./api/utils/logger');
const routes = require('./api/routes');

// Create Express app
const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Custom morgan token for logging request body
morgan.token('body', (req) => JSON.stringify(req.body));

// Request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body', {
  stream: { 
    write: (message) => logger.http(message.trim())
  }
}));

// Load OpenAPI spec
const openApiSpec = require('./docs/openapi.json');

// Serve API documentation with Scalar
app.use('/docs', apiReference({
  spec: {
    content: openApiSpec,
  },
  theme: 'purple',
  layout: 'sidebar',
}));

// Serve OpenAPI spec as JSON endpoint
app.get('/docs/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TattlerDB API is running',
    version: '1.0.0',
    documentation: '/docs',
    endpoints: {
      health: '/api/health',
      restaurants: '/api/restaurants'
    }
  });
});

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});