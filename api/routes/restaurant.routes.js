const express = require('express');
const restaurantController = require('../../controllers/restaurant.controller');
const { body, param, query, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to validate request
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// GET /api/restaurants - Get all restaurants with pagination
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ], 
  validate,
  restaurantController.getAllRestaurants
);

// GET /api/restaurants/search/location - Search restaurants by location
router.get('/search/location',
  [
    query('longitude').isNumeric().withMessage('Longitude must be a number'),
    query('latitude').isNumeric().withMessage('Latitude must be a number'),
    query('distance').optional().isInt({ min: 1 }).toInt()
  ],
  validate,
  restaurantController.searchByLocation
);

// GET /api/restaurants/search/text - Text search for restaurants
router.get('/search/text',
  [
    query('q').notEmpty().withMessage('Search query is required')
  ],
  validate,
  restaurantController.searchByText
);

// GET /api/restaurants/:id - Get restaurant by ID
router.get('/:id', 
  [
    param('id').notEmpty().withMessage('Restaurant ID is required')
  ],
  validate,
  restaurantController.getRestaurantById
);

// POST /api/restaurants - Create a new restaurant
router.post('/',
  [
    body('nombre').optional().isString(),
    body('razon_social').optional().isString(),
    body('tipo_vialidad').optional().isString(),
    body('calle').optional().isString(),
    body('colonia').optional().isString(),
    body('codigo_postal').optional().isString(),
    body('ubicacion').optional().isObject(),
    body('ubicacion.coordinates').optional().isArray().isLength({ min: 2, max: 2 })
  ],
  validate,
  restaurantController.createRestaurant
);

// PUT /api/restaurants/:id - Update a restaurant
router.put('/:id',
  [
    param('id').notEmpty().withMessage('Restaurant ID is required'),
    body('nombre').optional().isString(),
    body('razon_social').optional().isString(),
    body('tipo_vialidad').optional().isString(),
    body('calle').optional().isString(),
    body('colonia').optional().isString(),
    body('codigo_postal').optional().isString(),
    body('ubicacion').optional().isObject()
  ],
  validate,
  restaurantController.updateRestaurant
);

// DELETE /api/restaurants/:id - Delete a restaurant
router.delete('/:id',
  [
    param('id').notEmpty().withMessage('Restaurant ID is required')
  ],
  validate,
  restaurantController.deleteRestaurant
);

module.exports = router;