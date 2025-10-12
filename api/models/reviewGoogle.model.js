// JSON-like model description for reviews_google
module.exports = {
  required: [ 'review_id', 'data_id' ],
  properties: {
    review_id: { type: 'string' },
    data_id: { type: 'string' },
    google_place_id: { type: 'string' },
    author: { type: 'string' },
    rating: { type: 'number' },
    text: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    images: { type: 'array' },
    source: { type: 'string' },
    raw_google_review: { type: 'object' },
    normalized_at: { type: 'string', format: 'date-time' }
  }
};
