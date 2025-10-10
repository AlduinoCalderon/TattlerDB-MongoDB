const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

const inputPath = path.join(__dirname, '../backup/restaurants_backup.json');
const outputPath = path.join(__dirname, '../backup/restaurants_backup_migrated.json');

function getDateFromObjectId(id) {
  try {
    return new Date(ObjectId(id).getTimestamp());
  } catch {
    return new Date();
  }
}

function migrate() {
  const raw = fs.readFileSync(inputPath, 'utf-8');
  let data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    data = [data];
  }

  const migrated = data.map((doc) => {
    // Determinar fecha de creación
    let createdAt = doc.createdAt;
    if (!createdAt) {
      if (doc._id) {
        createdAt = getDateFromObjectId(doc._id);
      } else {
        createdAt = new Date();
      }
    }
    // Normalizar formato ISO
    createdAt = new Date(createdAt).toISOString();

    // updatedAt igual a createdAt si no existe
    let updatedAt = doc.updatedAt ? new Date(doc.updatedAt).toISOString() : createdAt;

    // deletedAt y deleted
    let deletedAt = doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null;
    let deleted = doc.deleted === true;

    return {
      ...doc,
      createdAt,
      updatedAt,
      deletedAt,
      deleted
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(migrated, null, 2), 'utf-8');
  console.log(`Migración completada. Guardado en ${outputPath}`);
}

migrate();
