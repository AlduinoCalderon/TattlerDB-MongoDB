const { ObjectId } = require('mongodb');
const path = require('path');
const database = require(path.join(__dirname, '../utils/database.js'));
const ApiError = require(path.join(__dirname, '../utils/apiError.js'));
const { logger } = require(path.join(__dirname, '../utils/logger.js'));

// Collection name - use Google restaurants collection and data_id as primary key
const COLLECTION = 'restaurants_google';

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

      // Exclude logically deleted restaurants
      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        const filter = { deleted: { $ne: true } };
        const [restaurants, totalCount] = await Promise.all([
          collection.find(filter)
            .skip(skip)
            .limit(limit)
            .toArray(),
          collection.countDocuments(filter)
        ]);
        return {
          restaurants,
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
  // Get a restaurant by data_id (primary identifier from Google)
  async getRestaurantById(req, res, next) {
    try {
      const { data_id } = req.params;

      // Exclude logically deleted restaurants
      const restaurant = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        return await collection.findOne({ data_id, deleted: { $ne: true } });
      });
      if (!restaurant) {
        throw ApiError.notFound(`Restaurant with data_id ${data_id} not found`);
      }
      logger.info(`Retrieved restaurant with data_id: ${data_id}`);
      res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
      logger.error(`Error fetching restaurant: ${error.message}`);
      next(error);
    }
  },

  /**
   * Create a new restaurant
   */
  // Create or upsert a restaurant. Prefer provided data_id (from Google). If none, generate an internal id.
  async createRestaurant(req, res, next) {
    try {
      const restaurantData = req.body || {};

      // Use provided data_id if present. Otherwise generate a unique internal id.
      if (!restaurantData.data_id) {
        restaurantData.data_id = new ObjectId().toString();
      }

      // Format geospatial data if present
      if (restaurantData.ubicacion && restaurantData.ubicacion.coordinates) {
        restaurantData.ubicacion = {
          type: 'Point',
          coordinates: [
            parseFloat(restaurantData.ubicacion.coordinates[0]),
            parseFloat(restaurantData.ubicacion.coordinates[1])
          ]
        };
      }

      // On create, ensure deleted is not set
      restaurantData.deleted = false;
      restaurantData.deleted_at = null;
      restaurantData.modified_at = new Date();
      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        // Upsert by data_id to avoid duplicates
        await collection.updateOne({ data_id: restaurantData.data_id }, { $set: restaurantData }, { upsert: true });
        return await collection.findOne({ data_id: restaurantData.data_id });
      });
      logger.info(`Created/updated restaurant with data_id: ${result.data_id}`);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error(`Error creating restaurant: ${error.message}`);
      next(error);
    }
  },

  /**
   * Update a restaurant
   */
  // Update restaurant identified by data_id (partial updates supported)
  async updateRestaurant(req, res, next) {
    try {
      const { data_id } = req.params;
      const updates = req.body || {};
      
      // Remove _id from updates if present
      delete updates._id;
      
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
        // Only update if not deleted
        const restaurant = await collection.findOne({ data_id, deleted: { $ne: true } });
        if (!restaurant) throw ApiError.notFound(`Restaurant with data_id ${data_id} not found`);
        updates.modified_at = new Date();
        await collection.updateOne({ data_id }, { $set: updates });
        return await collection.findOne({ data_id });
      });
      logger.info(`Updated restaurant with data_id: ${data_id}`);
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
  // Soft-delete a restaurant by data_id (mark deleted=true)
  async deleteRestaurant(req, res, next) {
    try {
      const { data_id } = req.params;
      const result = await database.withConnection(async (db) => {
        const collection = db.collection(COLLECTION);
        // just delete 
        const restaurant = await collection.findOne({ data_id });
        if (!restaurant) throw ApiError.notFound(`Restaurant with data_id ${data_id} not found`);
        const now = new Date();
        await collection.updateOne(
          { data_id },
          { $set: { deleted: true, deleted_at: now, modified_at: now } }
        );
        return { data_id };
      });
      logger.info(`Soft-deleted restaurant with data_id: ${data_id}`);
      res.status(200).json({ success: true, data: { message: 'Soft deleted', data_id: result.data_id } });
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
        
        return await collection.find({
          ubicacion: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: coords
              },
              $maxDistance: maxDistance
            }
          }
        }).toArray();
      });
      
      logger.info(`Found ${result.length} restaurants near [${coords}] within ${maxDistance}m`);
      res.status(200).json({
        success: true,
        data: {
          count: result.length,
          restaurants: result
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
        
        return await collection.find({
          $text: { $search: q }
        }).toArray();
      });
      
      logger.info(`Found ${result.length} restaurants matching text search: "${q}"`);
      res.status(200).json({
        success: true,
        data: {
          count: result.length,
          restaurants: result
        }
      });
    } catch (error) {
      logger.error(`Error searching restaurants by text: ${error.message}`);
      next(error);
    }
  }
};

module.exports = restaurantController;