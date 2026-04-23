/**
 * VALIDATION MIDDLEWARE — Joi schema validation
 * Validates request body, params, and query against Joi schemas
 * Returns 400 Bad Request on validation failure
 */
const AppError = require('../utils/appError');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new AppError(
        `Validation error: ${messages.map(m => m.message).join(', ')}`,
        400
      ));
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
};

module.exports = validate;
