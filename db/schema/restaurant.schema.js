const restaurantSchema = {
  name: "restaurants_inegi",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "ubicacion"],
      properties: {
        id: {
          bsonType: "string",
          description: "Unique identifier from INEGI"
        },
        nombre: {
          bsonType: "string",
          description: "Business name"
        },
        razon_social: {
          bsonType: "string",
          description: "Legal business name"
        },
        clase_actividad: {
          bsonType: "string",
          description: "Business activity classification"
        },
        tipo_vialidad: {
          bsonType: "string",
          description: "Street type"
        },
        calle: {
          bsonType: "string",
          description: "Street name"
        },
        numero_exterior: {
          bsonType: "string",
          description: "External building number"
        },
        numero_interior: {
          bsonType: ["string", "null"],
          description: "Internal unit number"
        },
        colonia: {
          bsonType: "string",
          description: "Neighborhood"
        },
        codigo_postal: {
          bsonType: "string",
          description: "Postal code"
        },
        ubicacion: {
          bsonType: "object",
          description: "GeoJSON location object",
          required: ["type", "coordinates"],
          properties: {
            type: {
              bsonType: "string",
              enum: ["Point"]
            },
            coordinates: {
              bsonType: "array",
              minItems: 2,
              maxItems: 2,
              items: {
                bsonType: "double"
              }
            }
          }
        },
        telefono: {
          bsonType: ["string", "null"],
          description: "Contact phone number"
        },
        correo_electronico: {
          bsonType: ["string", "null"],
          description: "Contact email"
        },
        sitio_internet: {
          bsonType: ["string", "null"],
          description: "Website URL"
        },
        tipo: {
          bsonType: "string",
          description: "Business type"
        },
        longitud: {
          bsonType: "double",
          description: "Longitude coordinate"
        },
        latitud: {
          bsonType: "double",
          description: "Latitude coordinate"
        }
      }
    }
  }
}

module.exports = restaurantSchema;