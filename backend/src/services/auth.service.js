/**
 * AUTH SERVICE — Core authentication business logic
 * Handles password operations, JWT generation, token management
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Hash password with bcrypt
 * @param {string} password - Plain password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hash
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate Access Token (JWT)
 * Expires in 2 hours
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-super-secret-key',
    { expiresIn: '2h' }
  );
};

/**
 * Generate Refresh Token (JWT)
 * Expires in 7 days
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'your-super-refresh-secret',
    { expiresIn: '7d' }
  );
};

/**
 * Verify Access Token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-key');
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-super-refresh-secret');
};

/**
 * Generate a random token for secure operations
 * Used for password reset, email verification, etc.
 * @returns {string} Random token
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Decode JWT without verification (for debugging)
 * WARNING: Use only for debugging — never trust decoded data without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
  decodeToken,
};
