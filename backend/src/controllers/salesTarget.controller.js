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

// ─── Team members fetch ────────────────────────────────────────────────────────

exports.getTeamMembers = catchAsync(async (req, res, next) => {
  if (!['SALES_TL', 'SALES_MANAGER'].includes(req.user.role)) {
    return next(new AppError('Unauthorized', 403));
  }
  const { Team, User } = require('../models');

  if (req.user.role === 'SALES_TL') {
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

    return res.status(200).json(new ApiResponse(200, {
      team:    { _id: String(team._id), name: team.name },
      members: members.map(m => ({ _id: String(m._id), name: m.name, role: m.role, email: m.email })),
    }, 'Team members fetched'));
  } else {
    // SALES_MANAGER
    const teams = await Team.find({
      admin: req.admin._id,
      isDeleted: { $ne: true },
    }).populate('leader', 'name').lean();

    const salesUsers = await User.find({
      admin: req.admin._id,
      role: { $in: ['SALES_TL', 'SALES_EXECUTIVE'] },
      isDeleted: { $ne: true },
      isActive: true,
    }).select('name email role').lean();

    const members = salesUsers.map(user => {
      let userTeam = null;
      let tlName = '—';
      if (user.role === 'SALES_EXECUTIVE') {
        const t = teams.find(t => (t.members || []).some(m => String(m.user) === String(user._id)));
        if (t) {
          userTeam = { _id: String(t._id), name: t.name };
          tlName = t.leader?.name || '—';
        }
      } else {
        const t = teams.find(t => String(t.leader?._id) === String(user._id));
        if (t) {
          userTeam = { _id: String(t._id), name: t.name };
          tlName = 'Self';
        }
      }
      return {
        _id: String(user._id),
        name: user.name,
        role: user.role,
        email: user.email,
        team: userTeam,
        teamLeader: tlName
      };
    });

    return res.status(200).json(new ApiResponse(200, {
      members,
      teams: teams.map(t => ({ _id: String(t._id), name: t.name, leaderName: t.leader?.name || '—' }))
    }, 'All sales members fetched'));
  }
});

// ─── List targets ────────────────────────────────────────────────────────────

exports.getTeamTargets = catchAsync(async (req, res, next) => {
  if (!['SALES_TL', 'SALES_MANAGER'].includes(req.user.role)) {
    return next(new AppError('Unauthorized', 403));
  }
  const { SalesTarget, Team } = require('../models');

  const { month, year } = req.query;
  const now = new Date();
  const m   = Number(month) || now.getMonth() + 1;
  const y   = Number(year)  || now.getFullYear();
  const { from, to } = monthRange(y, m);

  let query = {
    admin: req.admin._id,
    fromDate: { $gte: from },
    toDate:   { $lte: to },
  };

  if (req.user.role === 'SALES_TL') {
    const team = await Team.findOne({
      admin:     req.admin._id,
      leader:    req.user._id,
      isDeleted: { $ne: true },
    }).lean();

    const memberIds = team ? (team.members || []).map(m => m.user) : [];

    query.$or = [
      { user: req.user._id },
      { user: { $in: memberIds } },
      ...(team ? [{ team: team._id }] : []),
    ];
  }

  const targets = await SalesTarget.find(query)
    .populate('setBy', 'name')
    .populate('user', 'name role')
    .populate('team', 'name')
    .lean();

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
  }, 'Targets fetched'));
});

// ─── Create target ───────────────────────────────────────────────────────────

exports.createTarget = catchAsync(async (req, res, next) => {
  if (!['SALES_TL', 'SALES_MANAGER'].includes(req.user.role)) {
    return next(new AppError('Unauthorized', 403));
  }
  const { SalesTarget, Team, User } = require('../models');

  const {
    userId,
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

  const targetUser = await User.findOne({
    _id: userId,
    admin: req.admin._id,
    isDeleted: { $ne: true }
  });
  if (!targetUser) return next(new AppError('Target user not found', 404));

  let teamId = null;

  if (req.user.role === 'SALES_TL') {
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
    teamId = team._id;
  } else {
    // SALES_MANAGER: dynamically find user's team membership
    let team = null;
    if (targetUser.role === 'SALES_TL') {
      team = await Team.findOne({ admin: req.admin._id, leader: userId, isDeleted: { $ne: true } });
    } else {
      team = await Team.findOne({ admin: req.admin._id, 'members.user': userId, isDeleted: { $ne: true } });
    }
    if (team) teamId = team._id;
  }

  const m = Number(month);
  const y = Number(year);
  const { from, to } = monthRange(y, m);

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
    team:          teamId,
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

// ─── Update target ───────────────────────────────────────────────────────────

exports.updateTarget = catchAsync(async (req, res, next) => {
  if (!['SALES_TL', 'SALES_MANAGER'].includes(req.user.role)) {
    return next(new AppError('Unauthorized', 403));
  }
  const { SalesTarget, Team } = require('../models');

  const { id } = req.params;
  const {
    targetCalls, targetSales, targetRevenue,
    achievedCalls, achievedSales, achievedRevenue,
    notes,
  } = req.body;

  const target = await SalesTarget.findOne({ _id: id, admin: req.admin._id });
  if (!target) return next(new AppError('Target not found', 404));

  if (req.user.role === 'SALES_TL' && String(target.setBy) !== String(req.user._id)) {
    const team = await Team.findOne({
      admin:     req.admin._id,
      leader:    req.user._id,
      isDeleted: { $ne: true },
    }).lean();
    const isMember = team && (team.members || []).some(m => String(m.user) === String(target.user));
    if (!isMember) {
      return next(new AppError('Unauthorized to update this target', 403));
    }
  }

  if (targetCalls  !== undefined) target.targetCalls  = Number(targetCalls);
  if (targetSales  !== undefined) target.targetSales  = Number(targetSales);
  if (targetRevenue !== undefined) target.targetRevenue = Number(targetRevenue);

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

// ─── Delete target ───────────────────────────────────────────────────────────

exports.deleteTarget = catchAsync(async (req, res, next) => {
  if (!['SALES_TL', 'SALES_MANAGER'].includes(req.user.role)) {
    return next(new AppError('Unauthorized', 403));
  }
  const { SalesTarget, Team } = require('../models');

  const { id } = req.params;
  const target = await SalesTarget.findOne({ _id: id, admin: req.admin._id });
  if (!target) return next(new AppError('Target not found', 404));

  if (req.user.role === 'SALES_TL' && String(target.setBy) !== String(req.user._id)) {
    const team = await Team.findOne({
      admin:     req.admin._id,
      leader:    req.user._id,
      isDeleted: { $ne: true },
    }).lean();
    const isMember = team && (team.members || []).some(m => String(m.user) === String(target.user));
    if (!isMember) {
      return next(new AppError('Unauthorized to delete this target', 403));
    }
  }

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

// ─── Sync achieved progress ──────────────────────────────────────────────────

exports.syncTargetProgress = catchAsync(async (req, res, next) => {
  if (!['SALES_TL', 'SALES_MANAGER', 'ADMIN'].includes(req.user?.role)) {
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
        isDeleted:   { $ne: true },
        convertedAt: { $gte: tgt.fromDate, $lte: tgt.toDate },
      }),
      Lead.countDocuments({
        admin:           req.admin._id,
        assignedTo:      tgt.user,
        isDeleted:       { $ne: true },
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

// ─── Sales Manager: performance overview ─────────────────────────────────────

exports.getPerformanceOverview = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'SALES_MANAGER') {
    return next(new AppError('Only Sales Manager can access performance overview', 403));
  }
  const { Lead, Team, User } = require('../models');
  const mongoose = require('mongoose');
  const mongoAdminId = new mongoose.Types.ObjectId(String(req.admin._id));
  const now = new Date();

  // ── Base match — CRITICAL: use $ne: true not === false ──────────────────
  // Documents that never had isDeleted set will NOT match isDeleted: false
  const baseMatch = {
    admin:     mongoAdminId,
    isDeleted: { $ne: true },
  };
  const activeMatch = {
    ...baseMatch,
    isDumped: { $ne: true },
  };

  // ── 1. KPIs ─────────────────────────────────────────────────────────────
  const [
    totalLeads,
    convertedLeads,
    dumpedLeads,
    missedFollowups,
    callsAgg,
  ] = await Promise.all([
    Lead.countDocuments({ ...activeMatch }),
    Lead.countDocuments({ ...baseMatch,  status: 'CONVERTED' }),
    Lead.countDocuments({ ...baseMatch,  isDumped: true }),
    Lead.countDocuments({ ...baseMatch,  followUpMissed: true }),
    Lead.aggregate([
      { $match: activeMatch },
      { $group: { _id: null, totalCalls: { $sum: '$talkCount' } } },
    ]),
  ]);

  const totalCalls = callsAgg[0]?.totalCalls || 0;
  const conversionRate =
    totalLeads > 0
      ? ((convertedLeads / totalLeads) * 100).toFixed(1) + '%'
      : '0.0%';
  const totalLeadsWithDump = totalLeads + dumpedLeads;
  const dumpPct =
    totalLeadsWithDump > 0
      ? ((dumpedLeads / totalLeadsWithDump) * 100).toFixed(1) + '%'
      : '0.0%';

  const kpiOverview = [
    { title: 'Total Leads',      value: totalLeads.toLocaleString(),    accent: '#3b82f6' },
    { title: 'Total Calls',      value: totalCalls.toLocaleString(),    accent: '#14b8a6' },
    { title: 'Conversion Rate',  value: conversionRate,                 accent: '#22c55e' },
    { title: 'Dump %',           value: dumpPct,                        accent: '#f43f5e' },
    { title: 'Missed Follow-ups',value: missedFollowups.toLocaleString(),accent: '#f59e0b' },
  ];

  // ── 2. Team-wise Performance ─────────────────────────────────────────────
  const teamPerfAgg = await Lead.aggregate([
    { $match: { admin: mongoAdminId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id:   '$team',
        leads: { $sum: 1 },
        calls: { $sum: '$talkCount' },
        sales: { $sum: { $cond: [{ $eq: ['$status', 'CONVERTED'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from:         'teams',
        localField:   '_id',
        foreignField: '_id',
        as:           'teamDoc',
      },
    },
    { $unwind: { path: '$teamDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id:   0,
        name:  { $ifNull: ['$teamDoc.name', 'Unassigned'] },
        leads: 1,
        calls: 1,
        sales: 1,
      },
    },
    { $sort: { calls: -1 } },
  ]);

  // ── 3. Employee-wise Sales (top 10) ──────────────────────────────────────
  const empSalesAgg = await Lead.aggregate([
    { $match: { admin: mongoAdminId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id:   '$assignedTo',
        calls: { $sum: '$talkCount' },
        sales: { $sum: { $cond: [{ $eq: ['$status', 'CONVERTED'] }, 1, 0] } },
      },
    },
    { $sort: { calls: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from:         'users',
        localField:   '_id',
        foreignField: '_id',
        as:           'userDoc',
      },
    },
    { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id:   0,
        name:  { $ifNull: ['$userDoc.name', 'Unknown'] },
        calls: 1,
        sales: 1,
      },
    },
  ]);

  // ── 4. Calls vs Sales Trend (monthly, current year) ──────────────────────
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const monthlyAgg = await Lead.aggregate([
    {
      $match: {
        admin:     mongoAdminId,
        isDeleted: { $ne: true },
        createdAt: { $gte: startOfYear },
      },
    },
    {
      $project: {
        month:       { $month: '$createdAt' },
        isConverted: { $cond: [{ $eq: ['$status', 'CONVERTED'] }, 1, 0] },
        calls:       '$talkCount',
      },
    },
    {
      $group: {
        _id:   '$month',
        calls: { $sum: '$calls' },
        sales: { $sum: '$isConverted' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const callsVsSalesData = MONTH_NAMES.map((name, idx) => {
    const found = monthlyAgg.find((m) => m._id === idx + 1);
    return {
      name,
      calls: found ? found.calls : 0,
      sales: found ? found.sales : 0,
    };
  });

  // ── 5. Leaderboard ───────────────────────────────────────────────────────
  const leaderboardAgg = await Lead.aggregate([
    { $match: { admin: mongoAdminId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id:   '$assignedTo',
        calls: { $sum: '$talkCount' },
        sales: { $sum: { $cond: [{ $eq: ['$status', 'CONVERTED'] }, 1, 0] } },
      },
    },
    { $sort: { sales: -1 } },
    {
      $lookup: {
        from:         'users',
        localField:   '_id',
        foreignField: '_id',
        as:           'userDoc',
      },
    },
    { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from:         'teams',
        localField:   'userDoc._id',
        foreignField: 'members.user',
        as:           'teamDoc',
      },
    },
    { $unwind: { path: '$teamDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from:         'users',
        localField:   'teamDoc.leader',
        foreignField: '_id',
        as:           'tlDoc',
      },
    },
    { $unwind: { path: '$tlDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id:        0,
        userId:     '$userDoc._id',
        name:       { $ifNull: ['$userDoc.name', 'Unknown'] },
        role:       '$userDoc.role',
        teamName:   { $ifNull: ['$teamDoc.name', '—'] },
        teamLeader: { $ifNull: ['$tlDoc.name', '—'] },
        calls:      1,
        sales:      1,
        isActive:   '$userDoc.isActive',
      },
    },
  ]);

  const leaderboardRows = leaderboardAgg.map((item, index) => ({
    rank:       index + 1,
    userId:     item.userId,
    name:       item.name,
    teamName:   item.teamName,
    teamLeader: item.teamLeader,
    calls:      item.calls,
    sales:      item.sales,
    conversion: item.calls > 0
      ? ((item.sales / item.calls) * 100).toFixed(1) + '%'
      : '0.0%',
    status: item.isActive !== false ? 'Active' : 'Inactive',
  }));

  res.status(200).json(
    new ApiResponse(200, {
      kpiOverview,
      teamPerformanceData: teamPerfAgg,
      empSalesData:        empSalesAgg,
      callsVsSalesData,
      leaderboardRows,
    }, 'Performance overview stats fetched'),
  );
});

// ─── Sales Manager: Send performance alert ───────────────────────────────────

exports.sendPerformanceAlert = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'SALES_MANAGER') {
    return next(new AppError('Only Sales Manager can send alerts', 403));
  }
  const { Notification, User } = require('../models');
  const { userId, type, message } = req.body;

  if (!userId || !type || !message) {
    return next(new AppError('userId, type, and message are required', 400));
  }

  const targetUser = await User.findOne({ _id: userId, admin: req.admin._id });
  if (!targetUser) return next(new AppError('Target user not found', 404));

  const alertTitle = type === 'warning'
    ? 'Performance Alert'
    : 'Performance Appreciation 🌟';

  await Notification.create({
    admin: req.admin._id,
    user: userId,
    title: alertTitle,
    body: message,
    type: 'TARGET_ALERT',
  });

  res.status(201).json(new ApiResponse(201, null, 'Performance alert sent successfully'));
});
