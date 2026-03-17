const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseHelper');

const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route ${req.method} ${req.path} not found`, 404);
};

const globalErrorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return errorResponse(res, 'Validation error', 422, err.errors);
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    if (err.message.includes('UNIQUE constraint failed')) {
      const field = err.message.split('.')[1] || 'field';
      return errorResponse(res, `${field} already exists`, 409);
    }
    return errorResponse(res, 'Database constraint violation', 409);
  }

  if (err.code === 'SQLITE_ERROR') {
    return errorResponse(res, 'Database error occurred', 500);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return errorResponse(res, message, statusCode);
};

module.exports = { notFoundHandler, globalErrorHandler };
