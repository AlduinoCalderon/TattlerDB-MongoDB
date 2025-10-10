const { ObjectId } = require('mongodb');
const path = require('path');
const database = require(path.join(__dirname, '../utils/database.js'));
const ApiError = require(path.join(__dirname, '../utils/apiError'));
const { logger } = require(path.join(__dirname, '../utils/logger'));

// Collection name
const COLLECTION = 'restaurants_inegi';

/**
 * Restaurant Controller
 */
const restaurantController = {
  /**
   * Get all restaurants with pagination
   */
  async getAllRestaurants(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        
        // Solo restaurantes no eliminados (o sin el campo)
        const filter = { $or: [ { deleted: false }, { deleted: { $exists: false } } ] };
        const [restaurants, totalCount] = await Promise.all([
          collection.find(filter)
            .skip(skip)
            .limit(limit)
            .toArray(),
          collection.countDocuments(filter)
        ]);

        // Mapear para exponer solo 'id'
        const mapped = restaurants.map(r => {
          const { _id, ...rest } = r;
          return rest;
        });

        return {
          restaurants: mapped,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
          }
        };
      });

      logger.info(`Retrieved ${result.restaurants.length} restaurants (page ${page})`);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error fetching restaurants: ${error.message}`);
      next(error);
    }
  },

  /**
   * Get restaurant by ID
   */
  async getRestaurantById(req, res, next) {
    try {
      const { id } = req.params;
      
      const restaurant = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        // Solo si no está eliminado
        return await collection.findOne({ id, $or: [ { deleted: false }, { deleted: { $exists: false } } ] });
      });

      if (!restaurant) {
        throw ApiError.notFound(`Restaurant with ID ${id} not found`);
      }

      // Exponer solo 'id'
      const { _id, ...rest } = restaurant;
      logger.info(`Retrieved restaurant with ID: ${id}`);
      res.status(200).json({
        success: true,
        data: rest
      });
    } catch (error) {
      logger.error(`Error fetching restaurant: ${error.message}`);
      next(error);
    }
  },

  /**
   * Create a new restaurant
   */
  async createRestaurant(req, res, next) {
    try {
      const restaurantData = req.body;
      
      // Ensure id is present and unique
      if (!restaurantData.id) {
        restaurantData.id = new ObjectId().toString();
      }
      // Timestamps y borrado lógico
      const now = new Date().toISOString();
      restaurantData.createdAt = now;
      restaurantData.updatedAt = now;
      restaurantData.deleted = false;
      restaurantData.deletedAt = null;
      
      // Ensure geospatial data is properly formatted
      if (restaurantData.ubicacion) {
        restaurantData.ubicacion = {
          type: "Point",
          coordinates: [
            parseFloat(restaurantData.ubicacion.coordinates[0]),
            parseFloat(restaurantData.ubicacion.coordinates[1])
          ]
        };
      }
      
      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        // Check if restaurant with same ID already exists
        const existing = await collection.findOne({ id: restaurantData.id });
        if (existing) {
          throw ApiError.badRequest(`Restaurant with ID ${restaurantData.id} already exists`);
        }
        const insertResult = await collection.insertOne(restaurantData);
        // Exponer solo 'id' y datos relevantes
        const { _id, ...rest } = restaurantData;
        return rest;
      });
      logger.info(`Created new restaurant with ID: ${result.id}`);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error creating restaurant: ${error.message}`);
      next(error);
    }
  },

  /**
   * Update a restaurant
   */
  async updateRestaurant(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Remove _id from updates if present
      delete updates._id;
      // Actualizar updatedAt
      updates.updatedAt = new Date().toISOString();
      // Format geospatial data if present
      if (updates.ubicacion) {
        updates.ubicacion = {
          type: "Point",
          coordinates: [
            parseFloat(updates.ubicacion.coordinates[0]),
            parseFloat(updates.ubicacion.coordinates[1])
          ]
        };
      }

      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        // Check if restaurant exists y no esté eliminado
        const restaurant = await collection.findOne({ id, $or: [ { deleted: false }, { deleted: { $exists: false } } ] });
        if (!restaurant) {
          throw ApiError.notFound(`Restaurant with ID ${id} not found`);
        }
        const updateResult = await collection.updateOne(
          { id },
          { $set: updates }
        );
        if (updateResult.modifiedCount === 0) {
          return { message: 'No changes made' };
        }
        // Get updated restaurant
        const updated = await collection.findOne({ id });
        const { _id, ...rest } = updated;
        return rest;
      });
      logger.info(`Updated restaurant with ID: ${id}`);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error updating restaurant: ${error.message}`);
      next(error);
    }
  },

  /**
   * Delete a restaurant
   */
  async deleteRestaurant(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        // Check if restaurant exists y no esté eliminado
        const restaurant = await collection.findOne({ id, $or: [ { deleted: false }, { deleted: { $exists: false } } ] });
        if (!restaurant) {
          throw ApiError.notFound(`Restaurant with ID ${id} not found`);
        }
        // Borrado lógico
        const now = new Date().toISOString();
        const updateResult = await collection.updateOne(
          { id },
          { $set: { deleted: true, deletedAt: now, updatedAt: now } }
        );
        return { message: `Restaurant with ID ${id} marked as deleted`, deleted: true, deletedAt: now };
      });
      logger.info(`Deleted restaurant with ID: ${id}`);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error deleting restaurant: ${error.message}`);
      next(error);
    }
  },

  /**
   * Search restaurants by location
   */
  async searchByLocation(req, res, next) {
    try {
      const { longitude, latitude, distance } = req.query;
      
      // Validate parameters
      if (!longitude || !latitude) {
        throw ApiError.badRequest('Longitude and latitude are required');
      }
      
      // Convert to numbers
      const coords = [parseFloat(longitude), parseFloat(latitude)];
      const maxDistance = parseInt(distance) || 1000; // Default 1km
      
      if (isNaN(coords[0]) || isNaN(coords[1])) {
        throw ApiError.badRequest('Invalid coordinates');
      }
      
      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        // Solo no eliminados
        return await collection.find({
          ubicacion: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: coords
              },
              $maxDistance: maxDistance
            }
          },
          $or: [ { deleted: false }, { deleted: { $exists: false } } ]
        }).toArray();
      });
      // Mapear solo 'id'
      const mapped = result.map(r => { const { _id, ...rest } = r; return rest; });
      logger.info(`Found ${mapped.length} restaurants near [${coords}] within ${maxDistance}m`);
      res.status(200).json({
        success: true,
        data: {
          count: mapped.length,
          restaurants: mapped
        }
      });
    } catch (error) {
      logger.error(`Error searching restaurants by location: ${error.message}`);
      next(error);
    }
  },
  
  /**
   * Text search for restaurants
   */
  async searchByText(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim() === '') {
        throw ApiError.badRequest('Search query is required');
      }
      
      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        // Solo no eliminados
        return await collection.find({
          $text: { $search: q },
          $or: [ { deleted: false }, { deleted: { $exists: false } } ]
        }).toArray();
      });
      // Mapear solo 'id'
      const mapped = result.map(r => { const { _id, ...rest } = r; return rest; });
      logger.info(`Found ${mapped.length} restaurants matching text search: "${q}"`);
      res.status(200).json({
        success: true,
        data: {
          count: mapped.length,
          restaurants: mapped
        }
      });
    } catch (error) {
      logger.error(`Error searching restaurants by text: ${error.message}`);
      next(error);
    }
  }
};

module.exports = restaurantController;