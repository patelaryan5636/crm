/**
 * APP ERROR — Custom error class for consistent error handling
 * Extends Error with status code and isOperational flag
 * Allows easy identification of programmatic vs unexpected errors
 */
class AppError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (data) this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
