/**
 * VALIDATION MIDDLEWARE — Joi schema validation
 * Validates request body, params, and query against Joi schemas
 * Returns 400 Bad Request on validation failure
 *
 * Express 5 compatible: req.query and req.params are read-only getters.
 * We override them with Object.defineProperty so controller code works unchanged.
 */
const AppError = require('../utils/appError');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
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

    if (source === 'body') {
      // body is writable in Express 5
      req.body = value;
    } else if (source === 'query') {
      // Express 5: req.query is a read-only getter — override with defineProperty
      Object.defineProperty(req, 'query', {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else if (source === 'params') {
      // Express 5: req.params is also a read-only getter
      Object.defineProperty(req, 'params', {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };
};

module.exports = validate;
