const userService = require('./user.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.listUsers();
    return successResponse(res, { message: 'Users fetched', data: users });
  } catch (error) {
    return next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return successResponse(res, { message: 'User fetched', data: user });
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('name, email, and password are required', 400);
    }

    const user = await userService.createUser(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'User created',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return successResponse(res, { message: 'User updated', data: user });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return successResponse(res, { message: 'User deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
