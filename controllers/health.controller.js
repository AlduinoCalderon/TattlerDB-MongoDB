const path = require('path');
const database = require(path.join(__dirname, '../utils/database'));
const { logger } = require(path.join(__dirname, '../utils/logger'));
const os = require('os');

/**
 * Health Controller for application monitoring
 */
const healthController = {
  /**
   * Get basic health status
   */
  async getHealth(req, res, next) {
    try {
      const startTime = process.hrtime();
      
      // Get database status
      const dbStatus = await database.getStatus();
      
      // Calculate response time
      const hrtime = process.hrtime(startTime);
      const responseTimeMs = (hrtime[0] * 1000 + hrtime[1] / 1000000).toFixed(2);
      
      const healthData = {
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: dbStatus.ok === 1 ? 'connected' : 'error',
          version: dbStatus.version || 'unknown',
          ...dbStatus
        },
        responseTime: `${responseTimeMs}ms`,
        memory: {
          free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
          total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
          usage: `${Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100)}%`
        }
      };
      
      logger.info('Health check performed');
      res.status(200).json({
        success: true,
        data: healthData
      });
    } catch (error) {
      logger.error(`Health check error: ${error.message}`);
      
      // Still return a response even on error
      res.status(500).json({
        success: false,
        data: {
          status: 'error',
          timestamp: new Date(),
          error: error.message
        }
      });
    }
  },
  
  /**
   * Simple ping endpoint
   */
  ping(req, res) {
    res.status(200).json({ message: 'pong' });
  }
};

module.exports = healthController;