#!/usr/bin/env node
// Script to download Google Maps reviews for each restaurant using SerpApi and save them in the database (reviews_google)
// This script fetches reviews for each restaurant in the database (restaurants_google)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const database = require('../api/utils/database');
const { logger } = require('../api/utils/logger');
// Create a child logger with module context if supported by the project's logger
const log = (logger && typeof logger.child === 'function')
  ? logger.child({ module: 'scripts/download_google_reviews' })
  : logger;

const API_KEY = process.env.SERPAPI_KEY;
if (!API_KEY) {
  log.error('You must define SERPAPI_KEY in your .env file');
  process.exit(1);
}

const REVIEWS_COLL = 'reviews_google';

const DB_NAME = 'tattlerdb';
const RESTAURANTS_COLL = 'restaurants_google';

let serpApiRequestCount = 0;
const SERPAPI_REQUEST_LIMIT = parseInt(process.env.SERPAPI_REQUEST_LIMIT || '20', 10);
// Normaliza una review para MongoDB
function extractImagesFromReview(raw) {
  const imgs = [];
  if (!raw) return imgs;
  if (Array.isArray(raw.photos) && raw.photos.length) {
    for (const p of raw.photos) {
      if (!p) continue;
      if (typeof p === 'string') imgs.push(p);
      else if (p.url) imgs.push(p.url);
      else if (p.source) imgs.push(p.source);
    }
  }
  // fallback to images or images array
  if (Array.isArray(raw.images) && raw.images.length && imgs.length === 0) {
    for (const p of raw.images) {
      if (!p) continue;
      if (typeof p === 'string') imgs.push(p);
      else if (p.url) imgs.push(p.url);
      else if (p.source) imgs.push(p.source);
    }
  }
  return imgs;
}

// Normaliza una review para MongoDB (estructura final mínima usada por frontend)
function normalizeReview(review, data_id, google_place_id) {
  const authorName = review && review.user && review.user.name ? review.user.name : (review && review.author ? (typeof review.author === 'string' ? review.author : review.author.name) : null);
  const text = review && (review.text || review.snippet || (review.extracted_snippet && review.extracted_snippet.snippet)) ? (review.text || review.snippet || review.extracted_snippet.snippet) : null;
  const images = extractImagesFromReview(review);
  const isoDate = review && (review.iso_date || review.iso_date_of_last_edit) ? (review.iso_date || review.iso_date_of_last_edit) : null;
  return {
    review_id: (review && (review.review_id || review.id)) || null,
    data_id: data_id || null,
    google_place_id: google_place_id || null,
    author: authorName || null,
    rating: review && review.rating != null ? review.rating : null,
    text: text || null,
    date: isoDate || (review && review.date) || null,
    images: images,
    source: (review && review.source) || 'Google',
    raw_google_review: review,
    normalized_at: new Date()
  };
}

// Descarga y sube a MongoDB solo la primera página de reviews (máx 2 por restaurante)
async function fetchAndInsertFirstPageReviews(db, dataId, google_place_id, restaurantName, reviewsPerRestaurant = 2) {
  const reviewsColl = db.collection(REVIEWS_COLL);
  // If we already have enough reviews in the DB for this data_id, skip calling SerpApi
  try {
    const existingCount = await reviewsColl.countDocuments({ data_id: dataId });
    if (existingCount >= reviewsPerRestaurant) {
      log.debug(`Skipping fetch for ${restaurantName} (${dataId}) — already have ${existingCount} reviews`);
      return { upserts: 0, requested: false };
    }
  } catch (err) {
    log.warn(`Could not check existing reviews for ${dataId}: ${err.message}`);
  }

  if (serpApiRequestCount >= SERPAPI_REQUEST_LIMIT) {
    log.warn('SerpApi request limit reached, skipping further requests.');
    return { upserts: 0, requested: false };
  }
  const url = `https://serpapi.com/search.json`;
  const params = {
    engine: 'google_maps_reviews',
    data_id: dataId,
    hl: 'es',
    api_key: API_KEY
  };
  try {
    serpApiRequestCount++;
    const { data } = await axios.get(url, { params, timeout: 20000 });
    if (data.reviews && data.reviews.length > 0) {
      log.info(`Fetched ${data.reviews.length} reviews (first page) for ${restaurantName} (${dataId})`);
      const reviewsToInsert = data.reviews.slice(0, reviewsPerRestaurant).map(r => normalizeReview(r, dataId, google_place_id));
      const reviewsColl = db.collection(REVIEWS_COLL);
      let upserts = 0;
      for (const reviewDoc of reviewsToInsert) {
        const result = await reviewsColl.updateOne(
          { review_id: reviewDoc.review_id, data_id: reviewDoc.data_id },
          { $set: reviewDoc },
          { upsert: true }
        );
        if (result.upsertedCount > 0 || result.modifiedCount > 0) upserts++;
      }
      log.info(`Upserted ${upserts} reviews for ${restaurantName} (${dataId})`);
      return { upserts, requested: true };
    } else {
      log.warn(`No reviews found for ${restaurantName} (${dataId}) on first page`);
      return { upserts: 0, requested: true };
    }
  } catch (err) {
    log.error(`Error fetching reviews for ${restaurantName} (${dataId}) on first page: ${err.message}`);
    return { upserts: 0, requested: true };
  }
}

async function main() {
  const BATCH_RESTAURANTS = parseInt(process.env.REV_BATCH_RESTAURANTS || '10', 10);
  const REVIEWS_PER_RESTAURANT = parseInt(process.env.REV_PER_RESTAURANT || '6', 10);
  const REV_FETCH_COOLDOWN_HOURS = parseInt(process.env.REV_FETCH_COOLDOWN_HOURS || '24', 10);
  const cooldownDate = new Date(Date.now() - REV_FETCH_COOLDOWN_HOURS * 3600 * 1000);
  log.info(`Starting Google Reviews download and import script (batch restaurants: ${BATCH_RESTAURANTS}, reviews per restaurant: ${REVIEWS_PER_RESTAURANT})`);
  await database.withConnection(async (db) => {
    const restaurantsColl = db.collection(RESTAURANTS_COLL);
    const reviewsColl = db.collection(REVIEWS_COLL);
    // Ensure unique index for review_id + data_id
    await reviewsColl.createIndex({ review_id: 1, data_id: 1 }, { unique: true });
    // Determine batch sizes from env vars (defaults: 10 restaurants, 2 reviews each)
  const BATCH_RESTAURANTS = parseInt(process.env.REV_BATCH_RESTAURANTS || '10', 10);
  const REVIEWS_PER_RESTAURANT = parseInt(process.env.REV_PER_RESTAURANT || '6', 10);

    // First, try to find restaurants that don't have any reviews in reviews_google
    const restaurantsWithoutReviews = await restaurantsColl.aggregate([
      { $match: { data_id: { $exists: true, $ne: null }, google_place_id: { $exists: true, $ne: null }, $or: [ { last_reviews_fetched_at: { $exists: false } }, { last_reviews_fetched_at: { $lte: cooldownDate } } ] } },
      { $lookup: {
          from: REVIEWS_COLL,
          let: { dataId: '$data_id' },
          pipeline: [ { $match: { $expr: { $eq: ['$data_id', '$$dataId'] } } }, { $limit: 1 } ],
          as: 'hasReview'
      }},
      { $match: { hasReview: { $size: 0 } } },
      { $project: { google_place_id: 1, nombre: 1, data_id: 1 } },
      { $limit: BATCH_RESTAURANTS }
    ]).toArray();

    let restaurants = restaurantsWithoutReviews;
    // If not enough restaurants without reviews, fill with restaurants that have reviews (to refresh)
    if (restaurants.length < BATCH_RESTAURANTS) {
      const need = BATCH_RESTAURANTS - restaurants.length;
      const fallback = await restaurantsColl.find({ data_id: { $exists: true, $ne: null }, google_place_id: { $exists: true, $ne: null } }, { projection: { google_place_id: 1, nombre: 1, data_id: 1 } }).limit(need).toArray();
      restaurants = restaurants.concat(fallback);
    }
    log.info(`Selected ${restaurants.length} restaurants for review download/import.`);
    let totalReviews = 0;
    let totalRequestsMade = 0;
    for (const rest of restaurants) {
      if (!rest.google_place_id || !rest.data_id) {
        log.warn(`Skipping restaurant without google_place_id or data_id: ${rest.nombre}`);
        continue;
      }
      log.info(`Fetching reviews for ${rest.nombre} (data_id: ${rest.data_id})`);
      const res = await fetchAndInsertFirstPageReviews(db, rest.data_id, rest.google_place_id, rest.nombre || 'restaurant', REVIEWS_PER_RESTAURANT);
      const upserts = res && res.upserts ? res.upserts : 0;
      const requested = res && res.requested ? true : false;
      totalReviews += upserts;
      if (requested) {
        totalRequestsMade++;
        // update restaurant document with last fetched timestamp
        try {
          await restaurantsColl.updateOne({ _id: rest._id }, { $set: { last_reviews_fetched_at: new Date() } });
        } catch (err) {
          log.warn(`Could not update last_reviews_fetched_at for ${rest._id}: ${err.message}`);
        }
      }
      if (serpApiRequestCount >= SERPAPI_REQUEST_LIMIT) {
        log.warn('SerpApi request limit reached, stopping further processing.');
        break;
      }
    }
    log.info(`Finished. Total reviews upserted: ${totalReviews}. Total SerpApi requests made: ${totalRequestsMade}/${SERPAPI_REQUEST_LIMIT}`);
  });
}

main();
