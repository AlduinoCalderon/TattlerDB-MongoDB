// Script for restoring local INEGI restaurant data from backup JSON to MongoDB
require('dotenv').config();
const fs = require('fs');
const { MongoClient } = require('mongodb');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'tattler'; // MongoDB Atlas database name
const collectionName = 'restaurants_inegi'; // Collection for local INEGI data

async function restoreInegiLocalFromBackup() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Read the backup JSON file containing restaurant data
    const backupPath = path.join(__dirname, '../backup/restaurants_backup.json');
    const restaurants = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Drop the existing collection if it exists
    await collection.drop().catch(() => console.log('Collection does not exist yet'));

    // Insert all restaurant documents from backup
    const result = await collection.insertMany(restaurants);
    console.log(`${result.insertedCount} restaurants restored successfully`);

    // Create indexes for geospatial and text search
    console.log('Creating indexes...');
    await collection.createIndex({ ubicacion: "2dsphere" });
    await collection.createIndex({ nombre: "text" });
    await collection.createIndex({ codigo_postal: 1 });
    await collection.createIndex({ clase_actividad: 1 });
    console.log('Indexes created successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the restore for local INEGI data
restoreInegiLocalFromBackup().catch(console.error);
