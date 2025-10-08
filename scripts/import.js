require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;
const collectionName = process.env.MONGODB_COLLECTION;

async function importCSVToMongo() {
  const client = new MongoClient(uri);
  const restaurants = [];

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Read CSV and transform data
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../data/INEGI_DENUE_07102025.csv'))
        .pipe(csv())
        .on('data', (row) => {
          const restaurant = {
            id: row.id,
            nombre: row.nombre,
            razon_social: row.razon_social,
            clase_actividad: row.clase_actividad,
            tipo_vialidad: row.tipo_vialidad,
            calle: row.calle,
            numero_exterior: row.numero_exterior,
            numero_interior: row.numero_interior || null,
            colonia: row.colonia,
            codigo_postal: row.codigo_postal,
            ubicacion: {
              type: "Point",
              coordinates: [parseFloat(row.longitud), parseFloat(row.latitud)]
            },
            telefono: row.telefono || null,
            correo_electronico: row.correo_electronico || null,
            sitio_internet: row.sitio_internet || null,
            tipo: row.tipo,
            longitud: parseFloat(row.longitud),
            latitud: parseFloat(row.latitud)
          };
          restaurants.push(restaurant);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '../backup'))) {
      fs.mkdirSync(path.join(__dirname, '../backup'));
    }

    // Save as backup file
    const backupPath = path.join(__dirname, '../backup/restaurants_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(restaurants, null, 2));
    console.log(`Backup file created at ${backupPath}`);

    // Insert into MongoDB
    if (restaurants.length > 0) {
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
      console.log(`${result.insertedCount} restaurants imported successfully`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

importCSVToMongo().catch(console.error);