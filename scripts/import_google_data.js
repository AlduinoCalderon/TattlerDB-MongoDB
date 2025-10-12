
// Load environment variables from .env
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const database = require('../api/utils/database');
const { logger } = require('../api/utils/logger');

const RAW_DIR = path.join(__dirname, '../data/raw_google');
const DB_NAME = 'tattlerdb';
const RESTAURANTS_COLL = 'restaurants_google';

// This script only imports restaurants. Reviews will be imported with a specialized script.
// IDEA: This script and the reviews script should be automated in a GitHub Actions workflow to run daily.
// The workflow will look for new reviews for existing restaurants and, if none are found, will search for new restaurants in batches and upload them to the database.

function parseRestaurant(place) {
  return {
    google_place_id: place.place_id,
    nombre: place.title,
    direccion: place.address,
    coordenadas: place.gps_coordinates
      ? { lat: place.gps_coordinates.latitude, lng: place.gps_coordinates.longitude }
      : null,
    telefono: place.phone || null,
    rating: place.rating || null,
    reviews_count: place.reviews || null,
    tipo: place.type || null,
    categorias: place.types || null,
    horario: place.hours || null,
    imagenes: place.photos || [],
    thumbnail: place.thumbnail || null,
    deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    raw_google_data: place,
    data_id: place.data_id || (place.raw_google_data && place.raw_google_data.data_id) || null
  };
}

async function main() {
  logger.info('Starting Google Places import script...');
  try {
    await database.withConnection(async (db) => {
      const restaurantsColl = db.collection(RESTAURANTS_COLL);

      const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));
      logger.info(`Found ${files.length} JSON files in ${RAW_DIR}`);
      let restaurantCount = 0;
      let upsertedCount = 0;
      let skippedCount = 0;

      for (const file of files) {
        logger.info(`Processing file: ${file}`);
        let raw;
        try {
          raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf8'));
        } catch (err) {
          logger.error(`Failed to parse ${file}: ${err.message}`);
          continue;
        }
        const places = raw.local_results || raw.results || [];
        logger.info(`Found ${places.length} places in file ${file}`);
        for (const place of places) {
          if (!place.place_id) {
            logger.warn(`Skipping entry without place_id in file ${file}`);
            skippedCount++;
            continue;
          }
          const restaurantDoc = parseRestaurant(place);
          const result = await restaurantsColl.updateOne(
            { google_place_id: restaurantDoc.google_place_id },
            { $set: restaurantDoc },
            { upsert: true }
          );
          if (result.upsertedCount > 0 || result.modifiedCount > 0) {
            upsertedCount++;
            logger.info(`Upserted restaurant: ${restaurantDoc.nombre} (${restaurantDoc.google_place_id})`);
          } else {
            logger.info(`No changes for restaurant: ${restaurantDoc.nombre} (${restaurantDoc.google_place_id})`);
          }
          restaurantCount++;
        }
      }

      logger.info(`Total processed: ${restaurantCount}`);
      logger.info(`Upserted/modified: ${upsertedCount}`);
      logger.info(`Skipped: ${skippedCount}`);
    });
  } catch (err) {
    logger.error('Fatal error during import:', err);
    process.exit(1);
  }
}

main();
