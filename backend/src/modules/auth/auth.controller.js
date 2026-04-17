const authService = require('./auth.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');
const { validateRegisterInput, validateLoginInput } = require('./auth.validation');

const register = async (req, res, next) => {
  try {
    const validationError = validateRegisterInput(req.body);

    if (validationError) {
      throw new AppError(validationError, 400);
    }

    const result = await authService.registerUser(req.body);

    return successResponse(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validationError = validateLoginInput(req.body);

    if (validationError) {
      throw new AppError(validationError, 400);
    }

    const result = await authService.loginUser(req.body);

    return successResponse(res, {
      statusCode: 200,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
};
