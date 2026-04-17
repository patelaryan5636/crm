const projectService = require('./project.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');

const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.listProjects();
    return successResponse(res, { message: 'Projects fetched', data: projects });
  } catch (error) {
    return next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    return successResponse(res, { message: 'Project fetched', data: project });
  } catch (error) {
    return next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      throw new AppError('name is required', 400);
    }

    const project = await projectService.createProject(req.body, req.user.id);
    return successResponse(res, {
      statusCode: 201,
      message: 'Project created',
      data: project,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    return successResponse(res, { message: 'Project updated', data: project });
  } catch (error) {
    return next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id);
    return successResponse(res, { message: 'Project deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
