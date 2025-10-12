// Script to refactor existing documents in reviews_google to a normalized shape
require('dotenv').config();
const database = require('../api/utils/database');
const { logger } = require('../api/utils/logger');

const REVIEWS_COLL = 'reviews_google';

function extractImages(raw) {
  const imgs = [];
  if (!raw) return imgs;
  // Common fields where images can appear
  const candidates = [raw.photos, raw.images, raw.photos_urls, raw.image, raw.images_array];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      for (const it of c) {
        if (!it) continue;
        if (typeof it === 'string') imgs.push(it);
        else if (it.url) imgs.push(it.url);
        else if (it.source) imgs.push(it.source);
        else if (it.image) imgs.push(it.image);
      }
      if (imgs.length) return imgs;
    }
  }
  // Fallback: sometimes images are nested under raw.photo or raw.image
  if (raw.photo && typeof raw.photo === 'string') imgs.push(raw.photo);
  return imgs;
}

function normalizeFromRaw(raw, data_id, google_place_id) {
  if (!raw) return null;
  const authorName = raw.user && raw.user.name ? raw.user.name : (raw.author ? (typeof raw.author === 'string' ? raw.author : raw.author.name) : null);
  const text = raw.text || raw.snippet || (raw.extracted_snippet && raw.extracted_snippet.snippet) || null;
  const images = extractImages(raw);
  const isoDate = raw.iso_date || raw.iso_date_of_last_edit || raw.iso_date_string || null;
  return {
    review_id: raw.review_id || raw.id || null,
    data_id: data_id || null,
    google_place_id: google_place_id || null,
    author: authorName,
    rating: raw.rating != null ? raw.rating : null,
    text: text,
    date: isoDate || raw.date || null,
    images: images,
    source: raw.source || 'Google',
    raw_google_review: raw,
    normalized_at: new Date()
  };
}

async function main() {
  logger.info('Starting refactor of reviews_google to normalized shape...');
  await database.withConnection(async (db) => {
    const reviewsColl = db.collection(REVIEWS_COLL);
    const cursor = reviewsColl.find({});
    let processed = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const raw = doc.raw_google_review || doc.raw || null;
      const dataId = doc.data_id || doc.dataId || (doc.restaurant && doc.restaurant.data_id) || null;
      const googlePlaceId = doc.google_place_id || doc.place_id || null;
      const normalized = normalizeFromRaw(raw, dataId, googlePlaceId);
      if (!normalized) {
        logger.warn(`Skipping ${doc._id} - no raw review to normalize`);
        continue;
      }
      await reviewsColl.updateOne({ _id: doc._id }, { $set: normalized });
      processed++;
      if (processed % 100 === 0) logger.info(`Processed ${processed} reviews...`);
    }
    logger.info(`Finished refactor. Total processed: ${processed}`);
  });
}

main().catch(err => {
  logger.error(`Refactor script failed: ${err.message}`);
  process.exit(1);
});
