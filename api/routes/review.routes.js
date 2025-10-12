const express = require('express');
const reviewController = require('../controllers/review.controller');
const { body, param, query, validationResult } = require('express-validator');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// GET /api/reviews - list
router.get('/', [ query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 200 }).toInt() ], validate, reviewController.list);

// GET /api/reviews/:review_id - get by review_id or _id
router.get('/:review_id', [ param('review_id').notEmpty().withMessage('review_id required') ], validate, reviewController.getById);

// GET /api/reviews/data/:data_id
router.get('/data/:data_id', [ param('data_id').notEmpty().withMessage('data_id required') ], validate, reviewController.getByDataId);

// POST /api/reviews - create or upsert
router.post('/', [ body('review_id').notEmpty(), body('data_id').notEmpty() ], validate, reviewController.createReview);

// PUT /api/reviews/:review_id - update
router.put('/:review_id', [ param('review_id').notEmpty() ], validate, reviewController.updateReview);

// DELETE /api/reviews/:review_id - soft-delete
router.delete('/:review_id', [ param('review_id').notEmpty() ], validate, reviewController.deleteReview);

module.exports = router;
