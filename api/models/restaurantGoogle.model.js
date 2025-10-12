// Modelo flexible para restaurantes Google (solo para referencia y validación opcional)
// Si se usa Mongoose, aquí iría el esquema. Si no, se puede usar para validación manual.

module.exports = {
  required: [
    // No hay campos estrictamente obligatorios, pero estos son recomendados:
    // 'title', 'place_id', 'gps_coordinates', 'address'
  ],
  properties: {
    title: { type: 'string' },
    place_id: { type: 'string' },
    data_id: { type: 'string' },
    data_cid: { type: 'string' },
    gps_coordinates: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' }
      }
    },
    address: { type: 'string' },
    phone: { type: 'string' },
    rating: { type: 'number' },
    reviews: { type: 'number' },
    type: { type: 'string' },
    types: { type: 'array' },
    operating_hours: { type: 'object' },
    photos_link: { type: 'string' },
    reviews_link: { type: 'string' },
    thumbnail: { type: 'string' },
    deleted: { type: 'boolean', default: false },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    matched_inegi_id: { type: 'string' },
    categorias_normalizadas: { type: 'array' }
  }
};
