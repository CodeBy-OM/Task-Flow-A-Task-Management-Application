const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, logoutAll, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  validate,
} = require('../middleware/validation');

// Public routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, getMe);

module.exports = router;
