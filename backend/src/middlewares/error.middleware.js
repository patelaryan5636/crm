const { errorResponse } = require('../utils/responseHandler');

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return errorResponse(res, {
    statusCode,
    message,
    details: err.details || null,
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
