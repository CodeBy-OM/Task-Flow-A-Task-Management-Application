const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { run, get, query } = require('../config/database');
const logger = require('./logger');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'taskapp-api',
    audience: 'taskapp-client',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'taskapp-api',
    audience: 'taskapp-client',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'taskapp-api',
    audience: 'taskapp-client',
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'taskapp-api',
    audience: 'taskapp-client',
  });
};

const saveRefreshToken = async (userId, token) => {
  const id = uuidv4();
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();

  await run(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, token, expiresAt]
  );
  return id;
};

const revokeRefreshToken = async (token) => {
  await run('UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?', [token]);
};

const revokeAllUserTokens = async (userId) => {
  await run('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?', [userId]);
};

const isRefreshTokenValid = async (token) => {
  const record = await get(
    'SELECT * FROM refresh_tokens WHERE token = ? AND is_revoked = 0 AND expires_at > datetime("now")',
    [token]
  );
  return !!record;
};

const cleanExpiredTokens = async () => {
  const result = await run(
    'DELETE FROM refresh_tokens WHERE expires_at < datetime("now") OR is_revoked = 1'
  );
  logger.info(`Cleaned ${result.changes} expired/revoked refresh tokens`);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  isRefreshTokenValid,
  cleanExpiredTokens,
};
