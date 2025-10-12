const { MongoClient } = require('mongodb');
const { logger } = require('./logger');

/**
 * MongoDB database connection handler
 * Creates a new connection for each operation and closes it afterward
 * No connection pool is maintained
 */
class Database {
  constructor() {
    this.uri = process.env.MONGODB_URI;
    this.dbName = 'tattler';
    this.client = null;
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<MongoClient>}
   */
  async connect() {
    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      logger.info(`Connected to MongoDB database: ${this.dbName}`);
      return this.client;
    } catch (error) {
      logger.error(`MongoDB connection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get database instance
   * @returns {Db}
   */
  getDb() {
    if (!this.client) {
      throw new Error('MongoDB client not connected');
    }
    return this.client.db(this.dbName);
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      logger.info('MongoDB connection closed');
      this.client = null;
    }
  }

  /**
   * Execute a database operation with a fresh connection
   * @param {Function} operation - Function that takes a db instance and performs operations
   * @returns {Promise<any>} - Result of the operation
   */
  async withConnection(operation) {
    try {
      await this.connect();
      const result = await operation(this.getDb());
      return result;
    } finally {
      await this.close();
    }
  }

  /**
   * Get MongoDB server status information
   * @returns {Promise<Object>} - Server status
   */
  async getStatus() {
    return this.withConnection(async (db) => {
      try {
        const adminDb = db.admin();
        const serverStatus = await adminDb.serverStatus();
        
        return {
          uptime: serverStatus.uptime,
          connections: serverStatus.connections,
          version: serverStatus.version,
          ok: serverStatus.ok
        };
      } catch (error) {
        logger.error(`Error getting MongoDB status: ${error.message}`);
        return {
          error: error.message,
          ok: 0
        };
      }
    });
  }
}

module.exports = new Database();