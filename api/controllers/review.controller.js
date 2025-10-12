const path = require('path');
const { ObjectId } = require('mongodb');
const database = require(path.join(__dirname, '../utils/database.js'));
const ApiError = require(path.join(__dirname, '../utils/apiError.js'));
const { logger } = require(path.join(__dirname, '../utils/logger.js'));

const COLLECTION = 'reviews_google';

const reviewController = {
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const result = await database.withConnection(async (db) => {
        const coll = db.collection(COLLECTION);
        const [docs, total] = await Promise.all([
          coll.find({}).skip(skip).limit(limit).toArray(),
          coll.countDocuments()
        ]);
        return { docs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
      });

      logger.info(`Listed ${result.docs.length} reviews`);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      logger.error(`Error listing reviews: ${err.message}`);
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const doc = await database.withConnection(async (db) => {
        const coll = db.collection(COLLECTION);
        // Try to find by review_id first, fallback to _id
        let d = await coll.findOne({ review_id: id });
        if (!d) d = await coll.findOne({ _id: ObjectId.isValid(id) ? new ObjectId(id) : id });
        return d;
      });
      if (!doc) throw ApiError.notFound('Review not found');
      res.status(200).json({ success: true, data: doc });
    } catch (err) {
      logger.error(`Error getting review by id: ${err.message}`);
      next(err);
    }
  },

  // Update a review by review_id
  async updateReview(req, res, next) {
    try {
      const { review_id } = req.params;
      const updates = req.body || {};
      const updated = await database.withConnection(async (db) => {
        const coll = db.collection(COLLECTION);
        const existing = await coll.findOne({ review_id });
        if (!existing) throw ApiError.notFound('Review not found');
        await coll.updateOne({ review_id }, { $set: updates });
        return await coll.findOne({ review_id });
      });
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      logger.error(`Error updating review: ${err.message}`);
      next(err);
    }
  },

  // Soft-delete a review by review_id
  async deleteReview(req, res, next) {
    try {
      const { review_id } = req.params;
      const result = await database.withConnection(async (db) => {
        const coll = db.collection(COLLECTION);
        const existing = await coll.findOne({ review_id });
        if (!existing) throw ApiError.notFound('Review not found');
        await coll.updateOne({ review_id }, { $set: { deleted: true, deleted_at: new Date() } });
        return { review_id };
      });
      res.status(200).json({ success: true, data: { message: 'Soft deleted', review_id: result.review_id } });
    } catch (err) {
      logger.error(`Error deleting review: ${err.message}`);
      next(err);
    }
  },

  async getByDataId(req, res, next) {
    try {
      const { data_id } = req.params;
      const docs = await database.withConnection(async (db) => {
        const coll = db.collection(COLLECTION);
        return await coll.find({ data_id }).toArray();
      });
      res.status(200).json({ success: true, data: docs });
    } catch (err) {
      logger.error(`Error getting reviews by data_id: ${err.message}`);
      next(err);
    }
  },

  async createReview(req, res, next) {
    try {
      const payload = req.body;
      if (!payload || !payload.review_id || !payload.data_id) {
        throw ApiError.badRequest('review_id and data_id are required');
      }
      const inserted = await database.withConnection(async (db) => {
        const coll = db.collection(COLLECTION);
        const result = await coll.updateOne({ review_id: payload.review_id, data_id: payload.data_id }, { $set: payload }, { upsert: true });
        if (result.upsertedId) payload._id = result.upsertedId;
        return payload;
      });
      res.status(201).json({ success: true, data: inserted });
    } catch (err) {
      logger.error(`Error creating review: ${err.message}`);
      next(err);
    }
  },

  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      const result = await database.withConnection(async (db) => {
        const coll = db.collection(COLLECTION);
        return await coll.deleteOne({ _id: ObjectId.isValid(id) ? new ObjectId(id) : id });
      });
      res.status(200).json({ success: true, data: { deletedCount: result.deletedCount } });
    } catch (err) {
      logger.error(`Error deleting review: ${err.message}`);
      next(err);
    }
  }
};

module.exports = reviewController;
