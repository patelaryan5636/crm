'use strict';

/**
 * salesTarget.controller.js
 *
 * Handles monthly targets for Sales Team Leaders and Executives.
 *
 * TL endpoints:
 *   GET    /api/targets/tl/team          — list all targets for TL's team
 *   POST   /api/targets/tl               — create target for a team member
 *   PUT    /api/targets/tl/:id           — edit target (before period starts)
 *   DELETE /api/targets/tl/:id           — soft-delete target
 *   GET    /api/targets/tl/team-members  — list executives in TL's team
 *
 * SE endpoints:
 *   GET    /api/targets/se/my            — SE's own targets (current month default)
 */

const catchAsync = require('../utils/catchAsync');
const AppError   = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');

// ─── helpers ─────────────────────────────────────────────────────────────────

const monthRange = (year, month) => {
  // month: 1-based (1=Jan … 12=Dec)
  const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const to   = new Date(year, month,     0, 23, 59, 59, 999); // last day of month
  return { from, to };
};

const computeStatus = (target) => {
  const { targetSales, targetCalls, achievedSales, achievedCalls, toDate } = target;
  const salesPct = targetSales > 0 ? (achievedSales / targetSales) * 100 : 0;
  const callsPct = targetCalls > 0 ? (achievedCalls / targetCalls) * 100 : 0;
  const avgPct   = (salesPct + callsPct) / (targetSales > 0 && targetCalls > 0 ? 2 : 1);

  if (avgPct >= 100) return 'Completed';
  if (avgPct > 0)    return 'In Progress';
  if (new Date() > new Date(toDate)) return 'Overdue';
  return 'Pending';
};

const mapTarget = (t) => ({
  _id:             String(t._id),
  targetFor:       t.targetFor,
  period:          t.period,
  month:           new Date(t.fromDate).getMonth() + 1,
  year:            new Date(t.fromDate).getFullYear(),
  fromDate:        t.fromDate,
  toDate:          t.toDate,
  targetCalls:     t.targetCalls,
  targetSales:     t.targetSales,
  targetRevenue:   t.targetRevenue,
  achievedCalls:   t.achievedCalls,
  achievedSales:   t.achievedSales,
  achievedRevenue: t.achievedRevenue,
  remainingCalls:  Math.max(0, t.targetCalls  - t.achievedCalls),
  remainingSales:  Math.max(0, t.targetSales  - t.achievedSales),
  status:          computeStatus(t),
  notes:           t.notes || '',
  setBy:           t.setBy ? { _id: t.setBy._id, name: t.setBy.name } : null,
  user:            t.user  ? { _id: t.user._id,  name: t.user.name, role: t.user.role } : null,
  team:            t.team  ? { _id: t.team._id,  name: t.team.name } : null,
  createdAt:       t.createdAt,
});

// ─── TL: list team members ────────────────────────────────────────────────────

exports.getTeamMembers = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'SALES_TL') return next(new AppError('Only Sales TL', 403));
  const { Team, User } = require('../models');

  // Find the team led by this TL
  const team = await Team.findOne({
    admin:     req.admin._id,
    leader:    req.user._id,
    isDeleted: { $ne: true },
    isActive:  true,
  }).lean();

  if (!team) {
    return res.status(200).json(new ApiResponse(200, { members: [], team: null }, 'No team found'));
  }

  const memberIds = (team.members || []).map(m => m.user);
  const members = await User.find({
    _id:       { $in: memberIds },
    admin:     req.admin._id,
    isDeleted: { $ne: true },
    isActive:  true,
  }).select('name email role').lean();

  res.status(200).json(new ApiResponse(200, {
    team:    { _id: String(team._id), name: team.name },
    members: members.map(m => ({ _id: String(m._id), name: m.name, role: m.role, email: m.email })),
  }, 'Team members fetched'));
});

// ─── TL: list all targets for team ───────────────────────────────────────────

exports.getTeamTargets = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'SALES_TL') return next(new AppError('Only Sales TL', 403));
  const { SalesTarget, Team } = require('../models');

  const { month, year } = req.query;
  const now = new Date();
  const m   = Number(month) || now.getMonth() + 1;
  const y   = Number(year)  || now.getFullYear();
  const { from, to } = monthRange(y, m);

  // Find TL's team
  const team = await Team.findOne({
    admin:     req.admin._id,
    leader:    req.user._id,
    isDeleted: { $ne: true },
  }).lean();

  const memberIds = team ? (team.members || []).map(m => m.user) : [];

  // Fetch all targets where user is TL or any team member
  const targets = await SalesTarget.find({
    admin:    req.admin._id,
    fromDate: { $gte: from },
    toDate:   { $lte: to },
    $or: [
      { user: req.user._id },
      { user: { $in: memberIds } },
      ...(team ? [{ team: team._id }] : []),
    ],
  })
    .populate('setBy', 'name')
    .populate('user', 'name role')
    .populate('team', 'name')
    .lean();

  // Compute KPI summary
  const totalTargets     = targets.length;
  const completed        = targets.filter(t => computeStatus(t) === 'Completed').length;
  const inProgress       = targets.filter(t => computeStatus(t) === 'In Progress').length;
  const pending          = targets.filter(t => computeStatus(t) === 'Pending').length;
  const overdue          = targets.filter(t => computeStatus(t) === 'Overdue').length;

  res.status(200).json(new ApiResponse(200, {
    targets: targets.map(mapTarget),
    stats:   { totalTargets, completed, inProgress, pending, overdue },
    month: m,
    year:  y,
  }, 'Team targets fetched'));
});

// ─── TL: create target ────────────────────────────────────────────────────────

exports.createTarget = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'SALES_TL') return next(new AppError('Only Sales TL', 403));
  const { SalesTarget, Team, User } = require('../models');

  const {
    userId,        // ID of the team member to assign target to
    month,
    year,
    targetCalls  = 0,
    targetSales  = 0,
    targetRevenue = 0,
    notes,
  } = req.body;

  if (!userId || !month || !year) {
    return next(new AppError('userId, month, and year are required', 400));
  }

  // Validate the user belongs to TL's team
  const team = await Team.findOne({
    admin:     req.admin._id,
    leader:    req.user._id,
    isDeleted: { $ne: true },
  }).lean();

  if (!team) return next(new AppError('No team found for this TL', 404));

  const isMember = (team.members || []).some(m => String(m.user) === String(userId));
  const isSelf   = String(req.user._id) === String(userId);
  if (!isMember && !isSelf) {
    return next(new AppError('This user is not in your team', 403));
  }

  const m = Number(month);
  const y = Number(year);
  const { from, to } = monthRange(y, m);

  // Prevent duplicate target for same user + same month
  const existing = await SalesTarget.findOne({
    admin:    req.admin._id,
    user:     userId,
    fromDate: { $gte: from },
    toDate:   { $lte: to },
  });
  if (existing) {
    return next(new AppError(`A target for this user already exists for ${m}/${y}`, 409));
  }

  const target = await SalesTarget.create({
    admin:         req.admin._id,
    setBy:         req.user._id,
    targetFor:     'USER',
    user:          userId,
    team:          team._id,
    period:        'MONTHLY',
    fromDate:      from,
    toDate:        to,
    targetCalls:   Number(targetCalls),
    targetSales:   Number(targetSales),
    targetRevenue: Number(targetRevenue),
    notes:         notes || '',
  });

  const populated = await SalesTarget.findById(target._id)
    .populate('setBy', 'name')
    .populate('user', 'name role')
    .populate('team', 'name')
    .lean();

  res.status(201).json(new ApiResponse(201, { target: mapTarget(populated) }, 'Target created'));
});

// ─── TL: update target ────────────────────────────────────────────────────────

exports.updateTarget = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'SALES_TL') return next(new AppError('Only Sales TL', 403));
  const { SalesTarget } = require('../models');

  const { id } = req.params;
  const {
    targetCalls, targetSales, targetRevenue,
    achievedCalls, achievedSales, achievedRevenue,
    notes,
  } = req.body;

  const target = await SalesTarget.findOne({ _id: id, admin: req.admin._id });
  if (!target) return next(new AppError('Target not found', 404));

  // Allow editing target values
  if (targetCalls  !== undefined) target.targetCalls  = Number(targetCalls);
  if (targetSales  !== undefined) target.targetSales  = Number(targetSales);
  if (targetRevenue !== undefined) target.targetRevenue = Number(targetRevenue);

  // TL can also manually update achieved (override DB-computed values)
  if (achievedCalls   !== undefined) target.achievedCalls   = Number(achievedCalls);
  if (achievedSales   !== undefined) target.achievedSales   = Number(achievedSales);
  if (achievedRevenue !== undefined) target.achievedRevenue = Number(achievedRevenue);

  if (notes !== undefined) target.notes = notes;

  await target.save();

  const populated = await SalesTarget.findById(target._id)
    .populate('setBy', 'name')
    .populate('user',  'name role')
    .populate('team',  'name')
    .lean();

  res.status(200).json(new ApiResponse(200, { target: mapTarget(populated) }, 'Target updated'));
});

// ─── TL: delete target ────────────────────────────────────────────────────────

exports.deleteTarget = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'SALES_TL') return next(new AppError('Only Sales TL', 403));
  const { SalesTarget } = require('../models');

  const { id } = req.params;
  const target = await SalesTarget.findOne({ _id: id, admin: req.admin._id });
  if (!target) return next(new AppError('Target not found', 404));

  await target.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Target deleted'));
});

// ─── SE: get own targets ──────────────────────────────────────────────────────

exports.getMyTargets = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'SALES_EXECUTIVE') return next(new AppError('Only Sales Executive', 403));
  const { SalesTarget } = require('../models');

  const { month, year } = req.query;
  const now = new Date();
  const m   = Number(month) || now.getMonth() + 1;
  const y   = Number(year)  || now.getFullYear();
  const { from, to } = monthRange(y, m);

  const targets = await SalesTarget.find({
    admin:    req.admin._id,
    user:     req.user._id,
    fromDate: { $gte: from },
    toDate:   { $lte: to },
  })
    .populate('setBy', 'name')
    .populate('team',  'name')
    .lean();

  // Also compute live achieved data from Lead activities
  const { Lead } = require('../models');
  const leadsWon  = await Lead.countDocuments({
    admin:      req.admin._id,
    assignedTo: req.user._id,
    status:     'CONVERTED',
    convertedAt: { $gte: from, $lte: to },
  });
  const leadsTalked = await Lead.countDocuments({
    admin:      req.admin._id,
    assignedTo: req.user._id,
    status:     { $in: ['TALK', 'INTERESTED', 'CONVERTED'] },
    lastContactedAt: { $gte: from, $lte: to },
  });

  res.status(200).json(new ApiResponse(200, {
    targets: targets.map(mapTarget),
    live: {
      month: m, year: y,
      achievedSales:  leadsWon,
      achievedCalls:  leadsTalked,
    },
    month: m, year: y,
  }, 'My targets fetched'));
});

// ─── Sync achieved values from real data (called periodically) ────────────────

exports.syncTargetProgress = catchAsync(async (req, res, next) => {
  if (!['SALES_TL', 'ADMIN'].includes(req.user?.role)) {
    return next(new AppError('Unauthorized', 403));
  }
  const { SalesTarget, Lead } = require('../models');

  const targets = await SalesTarget.find({ admin: req.admin._id });

  for (const tgt of targets) {
    if (!tgt.user) continue;

    const [sales, calls] = await Promise.all([
      Lead.countDocuments({
        admin:       req.admin._id,
        assignedTo:  tgt.user,
        status:      'CONVERTED',
        convertedAt: { $gte: tgt.fromDate, $lte: tgt.toDate },
      }),
      Lead.countDocuments({
        admin:           req.admin._id,
        assignedTo:      tgt.user,
        status:          { $in: ['TALK', 'INTERESTED', 'CONVERTED'] },
        lastContactedAt: { $gte: tgt.fromDate, $lte: tgt.toDate },
      }),
    ]);

    tgt.achievedSales  = sales;
    tgt.achievedCalls  = calls;
    await tgt.save();
  }

  res.status(200).json(new ApiResponse(200, null, 'Sync complete'));
});
