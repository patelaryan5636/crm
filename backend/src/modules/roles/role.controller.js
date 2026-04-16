const roleService = require('./role.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');

const listRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getRoles();
    return successResponse(res, { message: 'Roles fetched', data: roles });
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      throw new AppError('userId and role are required', 400);
    }

    const user = await roleService.assignRole(userId, role);
    return successResponse(res, { message: 'Role updated', data: user });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listRoles,
  updateUserRole,
};
