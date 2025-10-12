// Script to update all restaurants in MongoDB to have a top-level data_id field from raw_google_data.data_id
require('dotenv').config();
const database = require('../api/utils/database');
const { logger } = require('../api/utils/logger');

const DB_NAME = 'tattlerdb';
const RESTAURANTS_COLL = 'restaurants_google';

async function main() {
  logger.info('Starting data_id update script for restaurants_google...');
  await database.withConnection(async (db) => {
    const restaurantsColl = db.collection(RESTAURANTS_COLL);
    const cursor = restaurantsColl.find({ 'raw_google_data.data_id': { $exists: true, $ne: null } });
    let updated = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const dataId = doc.raw_google_data && doc.raw_google_data.data_id;
      if (dataId && doc.data_id !== dataId) {
        await restaurantsColl.updateOne(
          { _id: doc._id },
          { $set: { data_id: dataId } }
        );
        logger.info(`Updated data_id for ${doc.nombre || doc._id}: ${dataId}`);
        updated++;
      }
    }
    logger.info(`Finished. Updated data_id for ${updated} restaurants.`);
  });
}

main();
