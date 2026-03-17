const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/responseHelper');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// General API limiter
const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  'Too many requests from this IP. Please try again later.'
);

// Strict limiter for auth endpoints
const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,              // 10 attempts
  'Too many authentication attempts. Please wait 15 minutes before trying again.'
);

module.exports = { apiLimiter, authLimiter };
