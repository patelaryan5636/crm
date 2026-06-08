"use strict";

/**
 * MANAGEMENT TEAM CONTROLLER
 *
 * Key difference from Sales teams:
 *   Sales: one executive belongs to exactly ONE team (enforced at DB level)
 *   Management: one employee can belong to MULTIPLE teams under different TLs
 *
 * All routes are user-level (MANAGEMENT_MANAGER role required).
 * Tenant-scoped via req.admin._id on every query.
 */

const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const AppError   = require('../utils/appError');
const logger     = require('../utils/logger');

// ─── role guard ───────────────────────────────────────────────────────────────
const ALLOWED_ROLES = ['MANAGEMENT_MANAGER'];

const requireMgmt = (req, next) => {
  if (!req.user || !ALLOWED_ROLES.includes(req.user.role)) {
    next(new AppError('Only Management Manager can access this resource', 403));
    return false;
  }
  return true;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Return MANAGEMENT department ID for the logged-in admin */
async function getMgmtDept(adminId) {
  const { Department } = require('../models');
  const dept = await Department.findOne({
    admin: adminId,
    name: 'MANAGEMENT',
    isDeleted: false,
  }).lean();
  return dept;
}

/** Map a ManagementTeam doc to a clean frontend object */
function mapTeam(t) {
  const leader = t.leader || {};
  return {
    id:           String(t._id),
    name:         t.name,
    isActive:     t.isActive,
    leader: {
      id:     leader._id ? String(leader._id) : null,
      name:   leader.name  || '—',
      email:  leader.email || '—',
      mobile: leader.phone || leader.mobile || '—',
      role:   leader.role  || '—',
    },
    members: (t.members || []).map((m) => {
      const u = m.user || {};
      return {
        id:       u._id ? String(u._id) : null,
        name:     u.name  || '—',
        email:    u.email || '—',
        mobile:   u.phone || '—',
        role:     u.role  || '—',
        isActive: u.isActive !== false,
        joinedAt: m.joinedAt,
      };
    }),
    memberCount:  (t.members || []).length,
    createdAt:    t.createdAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST  GET /api/management/teams
// ─────────────────────────────────────────────────────────────────────────────
exports.listTeams = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam } = require('../models');

  const dept = await getMgmtDept(req.admin._id);
  if (!dept) return next(new AppError('Management department not found', 404));

  const teams = await ManagementTeam.find({
    admin:      req.admin._id,
    department: dept._id,
    isDeleted:  false,
  })
    .populate('leader', 'name email phone role isActive')
    .populate('members.user', 'name email phone role isActive')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { teams: teams.map(mapTeam) }, 'Teams listed'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET ONE  GET /api/management/teams/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getTeam = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam } = require('../models');

  const t = await ManagementTeam.findOne({
    _id:       req.params.id,
    admin:     req.admin._id,
    isDeleted: false,
  })
    .populate('leader', 'name email phone role isActive')
    .populate('members.user', 'name email phone role isActive')
    .lean();

  if (!t) return next(new AppError('Team not found', 404));

  return res.status(200).json(
    new ApiResponse(200, { team: mapTeam(t) }, 'Team retrieved'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE  POST /api/management/teams
// Body: { name, leaderId, memberIds?: string[] }
// ─────────────────────────────────────────────────────────────────────────────
exports.createTeam = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam, User, AuditLog } = require('../models');

  const { name, leaderId, memberIds = [] } = req.body;

  if (!name?.trim())  return next(new AppError('Team name is required', 400));
  if (!leaderId)      return next(new AppError('Team leader is required', 400));

  const dept = await getMgmtDept(req.admin._id);
  if (!dept) return next(new AppError('Management department not found', 404));

  // Validate leader exists, is MANAGEMENT_TL, belongs to this admin+dept
  const leader = await User.findOne({
    _id:        leaderId,
    admin:      req.admin._id,
    department: dept._id,
    role:       'MANAGEMENT_TL',
    isDeleted:  false,
  });
  if (!leader) return next(new AppError('Team leader not found or not a MANAGEMENT_TL in this department', 400));

  // Duplicate team name check within department
  const existing = await ManagementTeam.findOne({
    admin:      req.admin._id,
    department: dept._id,
    name:       name.trim(),
    isDeleted:  false,
  });
  if (existing) return next(new AppError('A team with this name already exists', 409));

  // Validate members — must be MANAGEMENT_EMPLOYEE in same dept
  const validatedMembers = [];
  if (memberIds.length > 0) {
    const users = await User.find({
      _id:        { $in: memberIds },
      admin:      req.admin._id,
      department: dept._id,
      role:       'MANAGEMENT_EMPLOYEE',
      isDeleted:  false,
    }).lean();

    if (users.length !== memberIds.length) {
      return next(new AppError('One or more selected employees are invalid or not in the management department', 400));
    }

    validatedMembers.push(
      ...users.map((u) => ({ user: u._id, joinedAt: new Date() })),
    );
  }

  const team = await ManagementTeam.create({
    admin:      req.admin._id,
    department: dept._id,
    name:       name.trim(),
    leader:     leaderId,
    members:    validatedMembers,
    isActive:   true,
  });

  // Audit
  await AuditLog.create({
    admin:        req.admin._id,
    performedBy:  req.user._id,
    performerType:'USER',
    action:       'TEAM_CREATED',
    targetModel:  'ManagementTeam',
    targetId:     team._id,
    after: { name: team.name, leaderId, memberCount: validatedMembers.length },
  }).catch(() => {});

  await team.populate('leader', 'name email phone role isActive');
  await team.populate('members.user', 'name email phone role isActive');

  logger.info('Management team created', { teamId: String(team._id), name: team.name });

  return res.status(201).json(
    new ApiResponse(201, { team: mapTeam(team.toObject()) }, 'Team created successfully'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  PUT /api/management/teams/:id
// Body: { name?, leaderId?, isActive? }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateTeam = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam, User, AuditLog } = require('../models');

  const team = await ManagementTeam.findOne({
    _id:       req.params.id,
    admin:     req.admin._id,
    isDeleted: false,
  });
  if (!team) return next(new AppError('Team not found', 404));

  const { name, leaderId, isActive } = req.body;
  const before = { name: team.name, leader: team.leader?.toString(), isActive: team.isActive };

  if (name !== undefined && name.trim() !== team.name) {
    // Uniqueness check on rename
    const dup = await ManagementTeam.findOne({
      admin:     req.admin._id,
      department:team.department,
      name:      name.trim(),
      _id:       { $ne: team._id },
      isDeleted: false,
    });
    if (dup) return next(new AppError('Team name already exists', 409));
    team.name = name.trim();
  }

  if (leaderId !== undefined && leaderId !== team.leader?.toString()) {
    const dept = await getMgmtDept(req.admin._id);
    const leader = await User.findOne({
      _id:        leaderId,
      admin:      req.admin._id,
      department: dept?._id,
      role:       'MANAGEMENT_TL',
      isDeleted:  false,
    });
    if (!leader) return next(new AppError('New leader not found or not a MANAGEMENT_TL', 400));
    team.leader = leaderId;
  }

  if (isActive !== undefined) team.isActive = isActive;

  await team.save();

  await AuditLog.create({
    admin: req.admin._id, performedBy: req.user._id, performerType: 'USER',
    action: 'TEAM_UPDATED', targetModel: 'ManagementTeam', targetId: team._id,
    before, after: { name: team.name, leader: team.leader?.toString(), isActive: team.isActive },
  }).catch(() => {});

  await team.populate('leader', 'name email phone role isActive');
  await team.populate('members.user', 'name email phone role isActive');

  return res.status(200).json(
    new ApiResponse(200, { team: mapTeam(team.toObject()) }, 'Team updated'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ADD MEMBER  POST /api/management/teams/:id/members
// Body: { userId }
// An employee CAN be in multiple management teams — no cross-team conflict check.
// ─────────────────────────────────────────────────────────────────────────────
exports.addMember = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam, User, AuditLog } = require('../models');

  const { userId } = req.body;
  if (!userId) return next(new AppError('userId is required', 400));

  const team = await ManagementTeam.findOne({
    _id: req.params.id, admin: req.admin._id, isDeleted: false,
  });
  if (!team) return next(new AppError('Team not found', 404));

  // Validate user is MANAGEMENT_EMPLOYEE in same dept
  const user = await User.findOne({
    _id: userId, admin: req.admin._id, department: team.department,
    role: 'MANAGEMENT_EMPLOYEE', isDeleted: false,
  });
  if (!user) return next(new AppError('User not found or not a MANAGEMENT_EMPLOYEE in this department', 400));

  // Already in THIS team?
  if (team.members.some((m) => m.user.toString() === userId)) {
    return next(new AppError('User is already a member of this team', 409));
  }

  team.members.push({ user: userId, joinedAt: new Date() });
  await team.save();

  await AuditLog.create({
    admin: req.admin._id, performedBy: req.user._id, performerType: 'USER',
    action: 'TEAM_MEMBER_ADDED', targetModel: 'ManagementTeam', targetId: team._id,
    after: { userId, userName: user.name },
  }).catch(() => {});

  await team.populate('members.user', 'name email phone role isActive');
  return res.status(200).json(
    new ApiResponse(200, { team: mapTeam(team.toObject()) }, 'Member added'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// REMOVE MEMBER  DELETE /api/management/teams/:id/members/:userId
// ─────────────────────────────────────────────────────────────────────────────
exports.removeMember = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam, AuditLog } = require('../models');

  const { id, userId } = req.params;
  const team = await ManagementTeam.findOne({
    _id: id, admin: req.admin._id, isDeleted: false,
  });
  if (!team) return next(new AppError('Team not found', 404));

  if (team.leader?.toString() === userId) {
    return next(new AppError('Cannot remove the team leader. Change leader first.', 400));
  }

  const idx = team.members.findIndex((m) => m.user.toString() === userId);
  if (idx === -1) return next(new AppError('User is not a member of this team', 400));

  team.members.splice(idx, 1);
  await team.save();

  await AuditLog.create({
    admin: req.admin._id, performedBy: req.user._id, performerType: 'USER',
    action: 'TEAM_MEMBER_REMOVED', targetModel: 'ManagementTeam', targetId: team._id,
    after: { userId },
  }).catch(() => {});

  await team.populate('members.user', 'name email phone role isActive');
  return res.status(200).json(
    new ApiResponse(200, { team: mapTeam(team.toObject()) }, 'Member removed'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE  DELETE /api/management/teams/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteTeam = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam, AuditLog } = require('../models');

  const team = await ManagementTeam.findOne({
    _id: req.params.id, admin: req.admin._id, isDeleted: false,
  });
  if (!team) return next(new AppError('Team not found', 404));

  await team.softDelete(req.user._id);

  await AuditLog.create({
    admin: req.admin._id, performedBy: req.user._id, performerType: 'USER',
    action: 'TEAM_DELETED', targetModel: 'ManagementTeam', targetId: team._id,
    before: { name: team.name, memberCount: team.members.length },
  }).catch(() => {});

  return res.status(200).json(new ApiResponse(200, null, 'Team deleted'));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL TEAM LEADERS  GET /api/management/teams/leaders
// Returns all MANAGEMENT_TL users in this admin's management department
// ─────────────────────────────────────────────────────────────────────────────
exports.getLeaders = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { User, ManagementTeam } = require('../models');

  const dept = await getMgmtDept(req.admin._id);
  if (!dept) return next(new AppError('Management department not found', 404));

  const leaders = await User.findActive(
    { admin: req.admin._id, department: dept._id, role: 'MANAGEMENT_TL' },
    'name email phone role isActive',
    { sort: { name: 1 } },
  );

  // For each leader attach their teams count
  const teams = await ManagementTeam.find({
    admin: req.admin._id, department: dept._id, isDeleted: false,
  }).lean();

  const mapped = leaders.map((l) => {
    const leaderTeams = teams.filter((t) => t.leader?.toString() === String(l._id));
    const allMemberIds = new Set(
      leaderTeams.flatMap((t) => t.members.map((m) => m.user.toString())),
    );
    return {
      id:          String(l._id),
      name:        l.name,
      email:       l.email,
      mobile:      l.phone || '—',
      role:        l.role,
      isActive:    l.isActive,
      teamCount:   leaderTeams.length,
      employeeCount: allMemberIds.size,
    };
  });

  return res.status(200).json(
    new ApiResponse(200, { leaders: mapped }, 'Team leaders listed'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL EMPLOYEES  GET /api/management/teams/employees
// Returns all MANAGEMENT_EMPLOYEE users with their team assignments
// ─────────────────────────────────────────────────────────────────────────────
exports.getEmployees = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { User, ManagementTeam, Leave } = require('../models');

  const dept = await getMgmtDept(req.admin._id);
  if (!dept) return next(new AppError('Management department not found', 404));

  const [employees, teams, onLeaveNow] = await Promise.all([
    User.findActive(
      { admin: req.admin._id, department: dept._id, role: 'MANAGEMENT_EMPLOYEE' },
      'name email phone role isActive',
      { sort: { name: 1 } },
    ),
    ManagementTeam.find({
      admin: req.admin._id, department: dept._id, isDeleted: false,
    }).populate('leader', 'name').lean(),
    // Employees currently on approved leave
    Leave.find({
      admin:  req.admin._id,
      status: 'APPROVED',
      fromDate: { $lte: new Date() },
      toDate:   { $gte: new Date() },
    }).distinct('user').catch(() => []),
  ]);

  const onLeaveSet = new Set(onLeaveNow.map(String));

  const mapped = employees.map((e) => {
    // All teams this employee belongs to
    const myTeams = teams.filter((t) =>
      t.members.some((m) => m.user.toString() === String(e._id)),
    );
    const teamLeaders = [...new Set(myTeams.map((t) => t.leader?.name || '—'))];

    return {
      id:          String(e._id),
      name:        e.name,
      email:       e.email,
      mobile:      e.phone || '—',
      role:        e.role,
      isActive:    e.isActive,
      status:      onLeaveSet.has(String(e._id)) ? 'On Leave' : (e.isActive ? 'Active' : 'Inactive'),
      teamCount:   myTeams.length,
      teamNames:   myTeams.map((t) => t.name).join(', ') || '—',
      teamLeaders: teamLeaders.join(', ') || '—',
    };
  });

  const stats = {
    total:      mapped.length,
    active:     mapped.filter((e) => e.status === 'Active').length,
    onLeave:    mapped.filter((e) => e.status === 'On Leave').length,
    inactive:   mapped.filter((e) => e.status === 'Inactive').length,
  };

  return res.status(200).json(
    new ApiResponse(200, { employees: mapped, stats }, 'Employees listed'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABLE EMPLOYEES  GET /api/management/teams/:id/available-employees
// Returns employees NOT yet in this specific team (they can still be in others)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAvailableEmployees = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam, User } = require('../models');

  const team = await ManagementTeam.findOne({
    _id: req.params.id, admin: req.admin._id, isDeleted: false,
  }).lean();
  if (!team) return next(new AppError('Team not found', 404));

  // Get all employees in this department
  const dept = await getMgmtDept(req.admin._id);
  const allEmployees = await User.findActive(
    { admin: req.admin._id, department: dept._id, role: 'MANAGEMENT_EMPLOYEE' },
    'name email phone role isActive',
    { sort: { name: 1 } },
  );

  // Filter out those already in THIS team
  const inThisTeam = new Set(team.members.map((m) => m.user.toString()));
  const available = allEmployees.filter((e) => !inThisTeam.has(String(e._id)));

  return res.status(200).json(
    new ApiResponse(200, { employees: available }, 'Available employees listed'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW STATS  GET /api/management/teams/overview
// ─────────────────────────────────────────────────────────────────────────────
exports.getOverview = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { ManagementTeam, User, Project } = require('../models');

  const dept = await getMgmtDept(req.admin._id);
  if (!dept) return next(new AppError('Management department not found', 404));

  const [teams, leaders, employees, activeProjects, delayedProjects] = await Promise.all([
    ManagementTeam.countDocuments({ admin: req.admin._id, department: dept._id, isDeleted: false }),
    User.countDocuments({ admin: req.admin._id, department: dept._id, role: 'MANAGEMENT_TL', isDeleted: false, isActive: true }),
    User.countDocuments({ admin: req.admin._id, department: dept._id, role: 'MANAGEMENT_EMPLOYEE', isDeleted: false, isActive: true }),
    Project.countDocuments({ admin: req.admin._id, status: { $in: ['NOT_STARTED', 'WORK_STARTED', 'IN_PROGRESS', 'REVIEW', 'FINALIZATION'] }, isDeleted: false }).catch(() => 0),
    Project.countDocuments({ admin: req.admin._id, status: 'DELAYED', isDeleted: false }).catch(() => 0),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { teams, leaders, employees, activeProjects, delayedProjects }, 'Overview stats'),
  );
});
