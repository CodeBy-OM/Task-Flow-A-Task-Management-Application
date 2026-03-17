const { verifyAccessToken } = require('../utils/tokenUtils');
const { get } = require('../config/database');
const { errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    // Extract token from HTTP-only cookie first, fallback to Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. Please log in.', 401);
    }

    // Verify JWT
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 'Access token expired. Please refresh your session.', 401);
      }
      if (jwtErr.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Invalid access token.', 401);
      }
      throw jwtErr;
    }

    // Fetch user from DB (ensures user still exists and is active)
    const user = await get(
      'SELECT id, username, email, full_name, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return errorResponse(res, 'User associated with this token no longer exists.', 401);
    }

    if (!user.is_active) {
      return errorResponse(res, 'Your account has been deactivated.', 403);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    logger.error('Authentication middleware error:', err);
    return errorResponse(res, 'Authentication failed.', 500);
  }
};

module.exports = { authenticate };
