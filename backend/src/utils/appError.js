/**
 * APP ERROR — Custom error class for consistent error handling
 * Extends Error with status code and isOperational flag
 * Allows easy identification of programmatic vs unexpected errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
