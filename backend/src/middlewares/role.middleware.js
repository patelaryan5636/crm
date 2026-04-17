const { AppError } = require('./error.middleware');

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }

    return next();
  };
};

module.exports = allowRoles;
