const CryptoJS = require('crypto-js');
const logger = require('./logger');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 16) {
  logger.warn('ENCRYPTION_KEY is weak or missing. Set a strong 32-char key in .env');
}

/**
 * Encrypt a string value using AES-256
 * @param {string} value - plaintext to encrypt
 * @returns {string} encrypted ciphertext
 */
const encrypt = (value) => {
  if (value === null || value === undefined) return value;
  try {
    const ciphertext = CryptoJS.AES.encrypt(String(value), ENCRYPTION_KEY).toString();
    return ciphertext;
  } catch (err) {
    logger.error('Encryption failed:', err.message);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt an AES-encrypted string
 * @param {string} ciphertext - encrypted value
 * @returns {string} decrypted plaintext
 */
const decrypt = (ciphertext) => {
  if (ciphertext === null || ciphertext === undefined) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(String(ciphertext), ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption returned empty string');
    return decrypted;
  } catch (err) {
    logger.error('Decryption failed:', err.message);
    throw new Error('Decryption failed');
  }
};

/**
 * Encrypt selected fields in an object
 * @param {object} obj - target object
 * @param {string[]} fields - field names to encrypt
 * @returns {object} new object with encrypted fields
 */
const encryptFields = (obj, fields) => {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encrypt(String(result[field]));
    }
  }
  return result;
};

/**
 * Decrypt selected fields in an object
 * @param {object} obj - target object
 * @param {string[]} fields - field names to decrypt
 * @returns {object} new object with decrypted fields
 */
const decryptFields = (obj, fields) => {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = decrypt(String(result[field]));
    }
  }
  return result;
};

module.exports = { encrypt, decrypt, encryptFields, decryptFields };
