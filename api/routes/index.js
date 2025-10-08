const express = require('express');
const restaurantRoutes = require('./restaurant.routes');
const healthRoutes = require('./health.routes');
const { logger } = require('../../utils/logger');

const router = express.Router();

// Log API requests
router.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl} [IP: ${req.ip}]`);
  next();
});

// Mount routes
router.use('/restaurants', restaurantRoutes);
router.use('/health', healthRoutes);

// API information endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'TattlerDB API',
    version: '1.0.0',
    description: 'RESTful API for Tattler restaurant directory',
    endpoints: {
      restaurants: '/api/restaurants',
      health: '/api/health'
    }
  });
});

module.exports = router;