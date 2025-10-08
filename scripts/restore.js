require('dotenv').config();
const fs = require('fs');
const { MongoClient } = require('mongodb');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;
const collectionName = process.env.MONGODB_COLLECTION;

async function restoreFromBackup() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Read backup file
    const backupPath = path.join(__dirname, '../backup/restaurants_backup.json');
    const restaurants = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Drop existing collection if exists
    await collection.drop().catch(() => console.log('Collection does not exist yet'));

    // Create collection with schema validation
    const schema = require('../db/schema/restaurant.schema');
    await db.createCollection(collectionName, schema);

    // Create indexes
    await collection.createIndex({ ubicacion: "2dsphere" });
    await collection.createIndex({ nombre: "text" });
    await collection.createIndex({ codigo_postal: 1 });
    await collection.createIndex({ clase_actividad: 1 });

    // Insert documents
    const result = await collection.insertMany(restaurants);
    console.log(`${result.insertedCount} restaurants restored successfully`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

restoreFromBackup().catch(console.error);