const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../config/database');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  isRefreshTokenValid,
} = require('../utils/tokenUtils');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
};

const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth/refresh',
};

// POST /api/auth/register
const register = async (req, res) => {
  const { username, email, password, full_name } = req.body;

  // Check uniqueness
  const existingEmail = await get('SELECT id FROM users WHERE email = ?', [email]);
  if (existingEmail) {
    return errorResponse(res, 'An account with this email already exists.', 409);
  }

  const existingUsername = await get('SELECT id FROM users WHERE username = ?', [username]);
  if (existingUsername) {
    return errorResponse(res, 'Username is already taken.', 409);
  }

  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 12);

  await run(
    'INSERT INTO users (id, username, email, password, full_name) VALUES (?, ?, ?, ?, ?)',
    [id, username, email, hashedPassword, full_name || null]
  );

  const tokenPayload = { userId: id, username, email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  await saveRefreshToken(id, refreshToken);

  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  logger.info(`New user registered: ${email}`);

  return successResponse(
    res,
    {
      user: { id, username, email, full_name: full_name || null },
      accessToken, // Also return in body for non-cookie clients
    },
    'Registration successful',
    201
  );
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await get(
    'SELECT id, username, email, password, full_name, is_active FROM users WHERE email = ?',
    [email]
  );

  if (!user) {
    // Timing-safe: still hash to prevent timing attacks
    await bcrypt.hash(password, 12);
    return errorResponse(res, 'Invalid email or password.', 401);
  }

  if (!user.is_active) {
    return errorResponse(res, 'Your account has been deactivated. Contact support.', 403);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return errorResponse(res, 'Invalid email or password.', 401);
  }

  // Update last login
  await run('UPDATE users SET last_login = datetime("now") WHERE id = ?', [user.id]);

  const tokenPayload = { userId: user.id, username: user.username, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  await saveRefreshToken(user.id, refreshToken);

  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  logger.info(`User logged in: ${email}`);

  return successResponse(res, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
    },
    accessToken,
  }, 'Login successful');
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return errorResponse(res, 'Refresh token not provided.', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    res.clearCookie('refreshToken');
    return errorResponse(res, 'Invalid or expired refresh token.', 401);
  }

  const isValid = await isRefreshTokenValid(token);
  if (!isValid) {
    res.clearCookie('refreshToken');
    return errorResponse(res, 'Refresh token is invalid or has been revoked.', 401);
  }

  // Rotate refresh token
  await revokeRefreshToken(token);

  const user = await get(
    'SELECT id, username, email, is_active FROM users WHERE id = ?',
    [decoded.userId]
  );

  if (!user || !user.is_active) {
    return errorResponse(res, 'User not found or inactive.', 401);
  }

  const tokenPayload = { userId: user.id, username: user.username, email: user.email };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);
  await saveRefreshToken(user.id, newRefreshToken);

  res.cookie('accessToken', newAccessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

  return successResponse(res, { accessToken: newAccessToken }, 'Token refreshed');
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (token) {
    await revokeRefreshToken(token);
  }

  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

  return successResponse(res, null, 'Logged out successfully');
};

// POST /api/auth/logout-all
const logoutAll = async (req, res) => {
  await revokeAllUserTokens(req.user.id);
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

  return successResponse(res, null, 'Logged out from all devices');
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await get(
    'SELECT id, username, email, full_name, created_at, last_login FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!user) return errorResponse(res, 'User not found.', 404);

  return successResponse(res, { user }, 'User profile retrieved');
};

module.exports = { register, login, refreshToken, logout, logoutAll, getMe };
