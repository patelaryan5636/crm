/**
 * TEAM CONTROLLER — Team management endpoints
 * Handles CRUD operations, member management, and team operations
 * Requires admin authentication on all routes
 */

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const teamService = require('../services/team.service');

/**
 * POST /api/teams
 * Create a new team
 * Body: { name, department, leader (optional) }
 */
exports.createTeam = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { name, department, leader } = req.body;

  const team = await teamService.createTeam(
    { admin: adminId, department, name, leader: leader || null },
    adminId // performedBy
  );

  res.status(201).json(
    new ApiResponse(201, { team }, 'Team created successfully')
  );
});

/**
 * GET /api/teams
 * List all teams for admin (optionally filter by department)
 * Query: { page, limit, sort, department }
 */
exports.listTeams = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { page, limit, sort, department } = req.query;

  const result = await teamService.getTeams(adminId, department || null, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    sort: sort || '-createdAt',
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Teams fetched successfully')
  );
});

/**
 * GET /api/teams/:id
 * Get single team details
 */
exports.getTeam = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { id } = req.params;

  const team = await teamService.getTeamById(id, adminId);

  res.status(200).json(
    new ApiResponse(200, { team }, 'Team fetched successfully')
  );
});

/**
 * PUT /api/teams/:id
 * Update team (name, leader, isActive)
 * Body: { name, leader, isActive }
 */
exports.updateTeam = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { id } = req.params;
  const { name, leader, isActive } = req.body;

  const team = await teamService.updateTeam(
    id,
    adminId,
    { name, leader, isActive },
    adminId // performedBy
  );

  res.status(200).json(
    new ApiResponse(200, { team }, 'Team updated successfully')
  );
});

/**
 * DELETE /api/teams/:id
 * Soft delete a team
 */
exports.deleteTeam = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { id } = req.params;

  const team = await teamService.deleteTeam(id, adminId, adminId);

  res.status(200).json(
    new ApiResponse(200, { team }, 'Team deleted successfully')
  );
});

/**
 * POST /api/teams/:id/members
 * Add a member to team
 * Body: { userId }
 */
exports.addTeamMember = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { id } = req.params;
  const { userId } = req.body;

  const team = await teamService.addTeamMember(id, userId, adminId, adminId);

  res.status(200).json(
    new ApiResponse(200, { team }, 'Member added to team successfully')
  );
});

/**
 * DELETE /api/teams/:id/members/:userId
 * Remove a member from team
 */
exports.removeTeamMember = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { id, userId } = req.params;

  const team = await teamService.removeTeamMember(id, userId, adminId, adminId);

  res.status(200).json(
    new ApiResponse(200, { team }, 'Member removed from team successfully')
  );
});

/**
 * GET /api/teams/:id/available-members
 * Get available members (users not yet in this team, same department)
 */
exports.getAvailableMembers = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { id } = req.params;

  const members = await teamService.getAvailableMembers(id, adminId);

  res.status(200).json(
    new ApiResponse(200, { members }, 'Available members fetched successfully')
  );
});

/**
 * GET /api/teams/available-leaders/:departmentId
 * Get available team leaders (users with SALES_TL role in department)
 */
exports.getAvailableLeaders = catchAsync(async (req, res, next) => {
  const adminId = req.admin?.id || req.admin?._id;
  if (!adminId) {
    return next(new AppError('Admin authentication required', 401));
  }

  const { departmentId } = req.params;

  const leaders = await teamService.getAvailableLeaders(departmentId, adminId);

  res.status(200).json(
    new ApiResponse(200, { leaders }, 'Available team leaders fetched successfully')
  );
});
