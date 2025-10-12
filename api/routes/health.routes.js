const express = require('express');
const healthController = require('../controllers/health.controller.js');

const router = express.Router();

// GET /api/health - Get detailed health status
router.get('/', healthController.getHealth);

// GET /api/health/ping - Simple ping endpoint
router.get('/ping', healthController.ping);

module.exports = router;