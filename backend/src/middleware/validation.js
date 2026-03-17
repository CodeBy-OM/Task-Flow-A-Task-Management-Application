const { body, param, query, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseHelper');

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return errorResponse(res, 'Validation failed', 422, formatted);
  }
  next();
};

// Auth validators
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email too long'),

  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8-72 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase, lowercase, and digit'),

  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name too long')
    .escape(),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Task validators
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be 1-200 characters')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description too long (max 2000 chars)')
    .escape(),

  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be: pending, in_progress, completed, or cancelled'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be: low, medium, or high'),

  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('due_date must be a valid ISO 8601 date')
    .toDate(),
];

const updateTaskValidation = [
  param('id').isUUID().withMessage('Invalid task ID format'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be 1-200 characters')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description too long')
    .escape(),

  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority value'),

  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('due_date must be a valid ISO 8601 date')
    .toDate(),
];

const taskIdValidation = [
  param('id').isUUID().withMessage('Invalid task ID format'),
];

const taskQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status filter'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority filter'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term too long')
    .escape(),

  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'due_date', 'title', 'priority'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  taskQueryValidation,
};
