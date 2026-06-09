"use strict";

/**
 * MANAGEMENT TEAM LEADER CONTROLLER
 *
 * Endpoints for MANAGEMENT_TL role.
 * A TL can lead multiple ManagementTeams — we aggregate all members
 * across all their teams and return a unified list.
 */

const catchAsync  = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const AppError    = require('../utils/appError');

// ─── role guard ───────────────────────────────────────────────────────────────
const requireTL = (req, next) => {
  if (!req.user || req.user.role !== 'MANAGEMENT_TL') {
    next(new AppError('Only Management Team Leader can access this resource', 403));
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY TEAM MEMBERS
// GET /api/management-tl/teams/members
//
// Returns all unique members across every team this TL leads.
// Each member includes: basic info + leave status + project task stats.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyTeamMembers = catchAsync(async (req, res, next) => {
  if (!requireTL(req, next)) return;

  const { ManagementTeam, Leave, Project } = require('../models');

  const adminId = req.admin._id;
  const tlId    = req.user._id;

  // 1. Find all teams led by this TL
  const teams = await ManagementTeam.find({
    admin:     adminId,
    leader:    tlId,
    isDeleted: false,
  })
    .populate('members.user', 'name email phone role isActive')
    .lean();

  if (!teams.length) {
    return res.status(200).json(
      new ApiResponse(200, {
        members: [],
        stats: { total: 0, active: 0, onLeave: 0, delayed: 0 },
        teams: [],
      }, 'No teams found for this team leader'),
    );
  }

  // 2. Deduplicate members across teams (an employee can be in multiple teams)
  const memberMap = new Map(); // userId → { member, teamNames[] }
  for (const team of teams) {
    for (const m of team.members) {
      if (!m.user) continue;
      const uid = String(m.user._id);
      if (!memberMap.has(uid)) {
        memberMap.set(uid, { user: m.user, teamNames: [] });
      }
      memberMap.get(uid).teamNames.push(team.name);
    }
  }

  const uniqueMembers = [...memberMap.values()];
  const memberIds = uniqueMembers.map((m) => m.user._id);

  // 3. Who is currently on approved leave?
  const today = new Date();
  const onLeaveIds = await Leave.find({
    admin:    adminId,
    user:     { $in: memberIds },
    status:   'APPROVED',
    fromDate: { $lte: today },
    toDate:   { $gte: today },
  }).distinct('user').catch(() => []);
  const onLeaveSet = new Set(onLeaveIds.map(String));

  // 4. Project task stats per member
  //    We look at all projects scoped to this admin that have tasks assigned to these members.
  const projects = await Project.find({
    admin:     adminId,
    isDeleted: false,
  })
    .select('tasks title')
    .lean()
    .catch(() => []);

  // Build a flat task list with assignee userId
  const tasksByMember = {}; // userId → { assigned, inProgress, completed, delayed }
  for (const project of projects) {
    for (const task of (project.tasks || [])) {
      const assigneeId = task.assignedTo ? String(task.assignedTo) : null;
      if (!assigneeId || !memberMap.has(assigneeId)) continue;

      if (!tasksByMember[assigneeId]) {
        tasksByMember[assigneeId] = { assigned: 0, inProgress: 0, completed: 0, delayed: 0 };
      }
      const t = tasksByMember[assigneeId];
      t.assigned += 1;

      const s = (task.status || '').toUpperCase();
      if (s === 'IN_PROGRESS' || s === 'WORK_STARTED')    t.inProgress += 1;
      else if (s === 'COMPLETED' || s === 'DELIVERED')    t.completed  += 1;
      else if (s === 'DELAYED')                           t.delayed    += 1;
    }
  }

  // 5. Shape response
  const members = uniqueMembers.map(({ user, teamNames }) => {
    const uid    = String(user._id);
    const tasks  = tasksByMember[uid] || { assigned: 0, inProgress: 0, completed: 0, delayed: 0 };
    const isOnLeave = onLeaveSet.has(uid);
    const status = isOnLeave ? 'On Leave' : (user.isActive ? 'Active' : 'Inactive');

    return {
      id:         uid,
      name:       user.name,
      email:      user.email,
      mobile:     user.phone || '—',
      role:       user.role,
      isActive:   user.isActive,
      status,
      teamNames:  teamNames.join(', '),
      assigned:   tasks.assigned,
      inProgress: tasks.inProgress,
      completed:  tasks.completed,
      delayed:    tasks.delayed,
    };
  });

  // 6. Stats
  const stats = {
    total:   members.length,
    active:  members.filter((m) => m.status === 'Active').length,
    onLeave: members.filter((m) => m.status === 'On Leave').length,
    delayed: members.reduce((sum, m) => sum + m.delayed, 0),
  };

  // 7. Teams summary (for reference)
  const teamsSummary = teams.map((t) => ({
    id:          String(t._id),
    name:        t.name,
    memberCount: t.members.length,
  }));

  return res.status(200).json(
    new ApiResponse(200, { members, stats, teams: teamsSummary }, 'Team members fetched'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET MY TEAMS OVERVIEW (stat cards)
// GET /api/management-tl/teams/overview
// ─────────────────────────────────────────────────────────────────────────────
exports.getOverview = catchAsync(async (req, res, next) => {
  if (!requireTL(req, next)) return;

  const { ManagementTeam, Leave, Project } = require('../models');

  const adminId = req.admin._id;
  const tlId    = req.user._id;

  const teams = await ManagementTeam.find({
    admin: adminId, leader: tlId, isDeleted: false,
  }).lean();

  // Unique member ids
  const memberIdSet = new Set();
  for (const t of teams) {
    for (const m of t.members) memberIdSet.add(String(m.user));
  }
  const totalMembers = memberIdSet.size;

  const today = new Date();
  const onLeaveCount = await Leave.countDocuments({
    admin:    adminId,
    user:     { $in: [...memberIdSet] },
    status:   'APPROVED',
    fromDate: { $lte: today },
    toDate:   { $gte: today },
  }).catch(() => 0);

  const delayedTasks = await Project.aggregate([
    { $match: { admin: adminId, isDeleted: false } },
    { $unwind: { path: '$tasks', preserveNullAndEmpty: true } },
    { $match: { 'tasks.assignedTo': { $in: [...memberIdSet].map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) }, 'tasks.status': 'DELAYED' } },
    { $count: 'total' },
  ]).then((r) => r[0]?.total || 0).catch(() => 0);

  return res.status(200).json(
    new ApiResponse(200, {
      totalMembers,
      activeMembers: totalMembers - onLeaveCount,
      onLeave:       onLeaveCount,
      delayedTasks,
      teamCount:     teams.length,
    }, 'Overview fetched'),
  );
});
