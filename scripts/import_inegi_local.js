// Script for importing local INEGI CSV data into MongoDB
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');
const path = require('path');

const uri = process.env.MONGODB_URI;
const dbName = 'tattler'; // MongoDB Atlas database name
const collectionName = 'restaurants_inegi'; // Collection for local INEGI data

async function importInegiLocalCSV() {
  const client = new MongoClient(uri);
  const restaurants = [];

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Read the INEGI CSV and transform each row into a restaurant object
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../data/INEGI_DENUE_07102025.csv'), { encoding: 'latin1' })
        .pipe(csv())
        .on('data', (row) => {
          // Create base object with required fields
          const restaurant = {
            id: row['ID'],
            ubicacion: {
              type: "Point",
              coordinates: [parseFloat(row['Longitud']), parseFloat(row['Latitud'])]
            }
          };

          // Map optional fields from CSV to MongoDB document
          const fieldsMap = {
            'Nombre de la Unidad Económica': 'nombre',
            'Razón social': 'razon_social',
            'Nombre de clase de la actividad': 'clase_actividad',
            'Tipo de vialidad': 'tipo_vialidad',
            'Nombre de la vialidad': 'calle',
            'Número exterior o kilómetro': 'numero_exterior',
            'Número interior': 'numero_interior',
            'Nombre de asentamiento humano': 'colonia',
            'Código Postal': 'codigo_postal',
            'Número de teléfono': 'telefono',
            'Correo electrónico': 'correo_electronico',
            'Sitio en Internet': 'sitio_internet',
            'Tipo de establecimiento': 'tipo'
          };

          // Add each optional field only if it has a value
          Object.entries(fieldsMap).forEach(([csvKey, mongoKey]) => {
            if (row[csvKey] && row[csvKey].trim() !== '') {
              restaurant[mongoKey] = row[csvKey].trim();
            }
          });

          // Add coordinates only if they are valid numbers
          const lat = parseFloat(row['Latitud']);
          const lng = parseFloat(row['Longitud']);
          if (!isNaN(lat) && !isNaN(lng)) {
            restaurant.latitud = lat;
            restaurant.longitud = lng;
          }

          restaurants.push(restaurant);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Create backup directory if it does not exist
    if (!fs.existsSync(path.join(__dirname, '../backup'))) {
      fs.mkdirSync(path.join(__dirname, '../backup'));
    }

    // Save a backup of the imported data
    const backupPath = path.join(__dirname, '../backup/restaurants_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(restaurants, null, 2));
    console.log(`Backup file created at ${backupPath}`);

    // Insert documents into MongoDB
    if (restaurants.length > 0) {
      // Drop the existing collection if it exists
      try {
        await collection.drop();
        console.log('Existing collection dropped');
      } catch (e) {
        console.log('Collection does not exist yet');
      }

      // Insert all restaurant documents
      const result = await collection.insertMany(restaurants);
      console.log(`${result.insertedCount} restaurants imported successfully`);

      // Create indexes for geospatial and text search
      console.log('Creating indexes...');
      await collection.createIndex({ ubicacion: "2dsphere" });
      await collection.createIndex({ nombre: "text" });
      await collection.createIndex({ codigo_postal: 1 });
      await collection.createIndex({ clase_actividad: 1 });
      console.log('Indexes created successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the import for local INEGI data
importInegiLocalCSV().catch(console.error);
