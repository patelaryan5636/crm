'use strict';

/**
 * SALES EXECUTIVE DASHBOARD CONTROLLER
 * ─────────────────────────────────────────────────────────────
 * Provides fully dynamic, DB-backed data for the Sales Executive
 * dashboard. All queries are tenant-scoped (admin._id) and
 * user-scoped (req.user._id).
 *
 * Endpoints:
 *   GET /api/sales-executive/dashboard/summary
 *   GET /api/sales-executive/dashboard/weekly-trend
 *   GET /api/sales-executive/dashboard/prospect-distribution
 *   GET /api/sales-executive/dashboard/calls-vs-conversion
 *   GET /api/sales-executive/dashboard/daily-target
 *   GET /api/sales-executive/dashboard/recent-prospects
 *   GET /api/sales-executive/dashboard/upcoming-reminders
 */

const catchAsync   = require('../utils/catchAsync');
const AppError     = require('../utils/appError');
const ApiResponse  = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Normalize a Date to midnight (start of day) in local time */
const startOfDay = (d = new Date()) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

/** Return the Monday of the ISO week containing `d` */
const startOfISOWeek = (d = new Date()) => {
  const dt = new Date(d);
  const day = dt.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1 - day);
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

/** Return the Sunday (end) of the ISO week containing `d` */
const endOfISOWeek = (d = new Date()) => {
  const start = startOfISOWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/** Role guard — throws 403 if caller is not SALES_EXECUTIVE */
const guardExec = (req, next) => {
  if (req.user?.role !== 'SALES_EXECUTIVE') {
    next(new AppError('Only Sales Executives can access this resource', 403));
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────
// 1. SUMMARY CARDS
// GET /api/sales-executive/dashboard/summary
// ─────────────────────────────────────────────────────────────
/**
 * Returns:
 *  totalLeads        — all active (non-deleted) leads assigned to this exec
 *  todayCalls        — LeadActivity records created today by this exec
 *  conversionRate    — (CONVERTED leads / total contacted leads) × 100
 *  pendingFollowUps  — Reminders that are pending (not done, not missed, future)
 *  dumpLeads         — leads where isDumped = true assigned to this exec
 */
exports.getSummary = catchAsync(async (req, res, next) => {
  if (!guardExec(req, next)) return;

  const { Lead, LeadActivity, Reminder } = require('../models');

  const adminId = req.admin._id;
  const userId  = req.user._id;
  const now     = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  // Run all counts in parallel for performance
  const [
    totalLeads,
    todayCalls,
    convertedLeads,
    contactedLeads,
    pendingFollowUps,
    dumpLeads,
  ] = await Promise.all([
    // Total active leads assigned to this exec
    Lead.countDocuments({
      admin:      adminId,
      assignedTo: userId,
      isDeleted:  { $ne: true },
      isDumped:   { $ne: true },
    }),

    // Today's call activities (any status update = a call attempt)
    LeadActivity.countDocuments({
      admin:     adminId,
      user:      userId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),

    // Converted leads (status = CONVERTED)
    Lead.countDocuments({
      admin:      adminId,
      assignedTo: userId,
      status:     'CONVERTED',
      isDeleted:  { $ne: true },
    }),

    // Contacted leads (TALK + INTERESTED + CONVERTED — excludes UNTOUCHED/NOT_TALK/DUMP)
    Lead.countDocuments({
      admin:      adminId,
      assignedTo: userId,
      status:     { $in: ['TALK', 'INTERESTED', 'CONVERTED'] },
      isDeleted:  { $ne: true },
    }),

    // Pending follow-ups: future reminders not yet done
    Reminder.countDocuments({
      admin:    adminId,
      user:     userId,
      isDone:   false,
      isMissed: false,
      remindAt: { $gt: now },
    }),

    // Dump leads assigned to this exec
    Lead.countDocuments({
      admin:      adminId,
      assignedTo: userId,
      isDumped:   true,
      isDeleted:  { $ne: true },
    }),
  ]);

  // Conversion rate = converted / contacted × 100 (avoid div-by-zero)
  const conversionRate = contactedLeads > 0
    ? parseFloat(((convertedLeads / contactedLeads) * 100).toFixed(1))
    : 0;

  res.status(200).json(
    new ApiResponse(200, {
      totalLeads,
      todayCalls,
      conversionRate,
      pendingFollowUps,
      dumpLeads,
    }, 'Dashboard summary retrieved successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// 2. WEEKLY PROSPECT TREND (Line Chart)
// GET /api/sales-executive/dashboard/weekly-trend
// ─────────────────────────────────────────────────────────────
/**
 * Returns last 7 days of:
 *  - newProspects  — ProspectForm records created each day
 *  - conversions   — Lead status changed to CONVERTED each day
 *
 * Shape: { labels: ['Mon','Tue',...], newProspects: [...], conversions: [...] }
 */
exports.getWeeklyTrend = catchAsync(async (req, res, next) => {
  if (!guardExec(req, next)) return;

  const { Lead, ProspectForm } = require('../models');

  const adminId = req.admin._id;
  const userId  = req.user._id;

  // Build last-7-days date buckets (today inclusive)
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(startOfDay(d));
  }

  const weekStart = days[0];
  const weekEnd   = new Date(days[6]);
  weekEnd.setHours(23, 59, 59, 999);

  // Aggregate new prospects per day
  const prospectAgg = await ProspectForm.aggregate([
    {
      $match: {
        admin:    adminId,
        filledBy: userId,
        createdAt: { $gte: weekStart, $lte: weekEnd },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Aggregate conversions per day (convertedAt field on Lead)
  const conversionAgg = await Lead.aggregate([
    {
      $match: {
        admin:       adminId,
        assignedTo:  userId,
        status:      'CONVERTED',
        convertedAt: { $gte: weekStart, $lte: weekEnd },
        isDeleted:   { $ne: true },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$convertedAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Build lookup maps
  const prospectMap  = Object.fromEntries(prospectAgg.map((r) => [r._id, r.count]));
  const conversionMap = Object.fromEntries(conversionAgg.map((r) => [r._id, r.count]));

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const labels       = days.map((d) => DAY_LABELS[d.getDay()]);
  const newProspects = days.map((d) => prospectMap[d.toISOString().split('T')[0]] || 0);
  const conversions  = days.map((d) => conversionMap[d.toISOString().split('T')[0]] || 0);

  res.status(200).json(
    new ApiResponse(200, { labels, newProspects, conversions }, 'Weekly trend retrieved successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// 3. PROSPECT DISTRIBUTION (Donut Chart)
// GET /api/sales-executive/dashboard/prospect-distribution
// ─────────────────────────────────────────────────────────────
/**
 * Returns lead status distribution for this executive's active leads.
 * Maps internal statuses to display labels.
 *
 * Shape: { labels: [...], values: [...], percentages: [...] }
 */
exports.getProspectDistribution = catchAsync(async (req, res, next) => {
  if (!guardExec(req, next)) return;

  const { Lead } = require('../models');

  const adminId = req.admin._id;
  const userId  = req.user._id;

  const agg = await Lead.aggregate([
    {
      $match: {
        admin:      adminId,
        assignedTo: userId,
        isDeleted:  { $ne: true },
        isDumped:   { $ne: true },
      },
    },
    {
      $group: {
        _id:   '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Map internal enum → display label
  const STATUS_LABEL = {
    UNTOUCHED:  'New',
    TALK:       'Contacted',
    NOT_TALK:   'Not Contacted',
    INTERESTED: 'Qualified',
    CONVERTED:  'Closed',
  };

  const total = agg.reduce((sum, r) => sum + r.count, 0);

  const result = agg.map((r) => ({
    status:     r._id,
    label:      STATUS_LABEL[r._id] || r._id,
    count:      r.count,
    percentage: total > 0 ? parseFloat(((r.count / total) * 100).toFixed(1)) : 0,
  }));

  // Sort by count descending
  result.sort((a, b) => b.count - a.count);

  res.status(200).json(
    new ApiResponse(200, {
      total,
      distribution: result,
      // Convenience arrays for chart libraries
      labels:      result.map((r) => r.label),
      values:      result.map((r) => r.count),
      percentages: result.map((r) => r.percentage),
    }, 'Prospect distribution retrieved successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// 4. CALLS VS CONVERSION (Horizontal Bar Chart — last 4 weeks)
// GET /api/sales-executive/dashboard/calls-vs-conversion
// ─────────────────────────────────────────────────────────────
/**
 * Returns weekly breakdown for the last 4 ISO weeks:
 *  - totalCalls   — LeadActivity records in that week
 *  - conversions  — Leads converted in that week
 *
 * Shape: { weeks: [{ label, totalCalls, conversions }] }
 */
exports.getCallsVsConversion = catchAsync(async (req, res, next) => {
  if (!guardExec(req, next)) return;

  const { LeadActivity, Lead } = require('../models');

  const adminId = req.admin._id;
  const userId  = req.user._id;

  // Build 4-week buckets (current week = Week 4)
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() - i * 7);
    weeks.push({
      label: `Week ${4 - i}`,
      start: startOfISOWeek(refDate),
      end:   endOfISOWeek(refDate),
    });
  }

  const rangeStart = weeks[0].start;
  const rangeEnd   = weeks[3].end;

  // Aggregate calls per week
  const callsAgg = await LeadActivity.aggregate([
    {
      $match: {
        admin:     adminId,
        user:      userId,
        createdAt: { $gte: rangeStart, $lte: rangeEnd },
      },
    },
    {
      $group: {
        _id: {
          // ISO week number within the range
          week: { $isoWeek: '$createdAt' },
          year: { $isoWeekYear: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Aggregate conversions per week
  const convAgg = await Lead.aggregate([
    {
      $match: {
        admin:       adminId,
        assignedTo:  userId,
        status:      'CONVERTED',
        convertedAt: { $gte: rangeStart, $lte: rangeEnd },
        isDeleted:   { $ne: true },
      },
    },
    {
      $group: {
        _id: {
          week: { $isoWeek: '$convertedAt' },
          year: { $isoWeekYear: '$convertedAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Build lookup maps keyed by "YYYY-WW"
  const callsMap = Object.fromEntries(
    callsAgg.map((r) => [`${r._id.year}-${r._id.week}`, r.count])
  );
  const convMap = Object.fromEntries(
    convAgg.map((r) => [`${r._id.year}-${r._id.week}`, r.count])
  );

  const getISOWeekKey = (date) => {
    // ISO week number helper
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // avoid DST edge
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-${weekNo}`;
  };

  const result = weeks.map((w) => {
    const key = getISOWeekKey(w.start);
    return {
      label:       w.label,
      totalCalls:  callsMap[key] || 0,
      conversions: convMap[key]  || 0,
    };
  });

  res.status(200).json(
    new ApiResponse(200, { weeks: result }, 'Calls vs conversion retrieved successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// 5. DAILY TARGET PROGRESS
// GET /api/sales-executive/dashboard/daily-target
// ─────────────────────────────────────────────────────────────
/**
 * Returns today's progress against the active DAILY SalesTarget for this user.
 * Falls back to zero if no target is set.
 *
 * Shape:
 *  {
 *    overallPercent,
 *    targets: {
 *      calls:      { target, achieved, percent },
 *      prospects:  { target, achieved, percent },
 *      reminders:  { target, achieved, percent },
 *    }
 *  }
 */
exports.getDailyTarget = catchAsync(async (req, res, next) => {
  if (!guardExec(req, next)) return;

  const { SalesTarget, LeadActivity, ProspectForm, Reminder } = require('../models');

  const adminId    = req.admin._id;
  const userId     = req.user._id;
  const now        = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  // Find today's DAILY target for this user (most recent if multiple)
  const target = await SalesTarget.findOne({
    admin:      adminId,
    user:       userId,
    targetFor:  'USER',
    period:     'DAILY',
    fromDate:   { $lte: now },
    toDate:     { $gte: todayStart },
  }).sort({ createdAt: -1 }).lean();

  // Actual achieved values from live DB (not from target.achieved* which is $inc-based)
  const [callsMade, prospectsConverted, remindersCompleted] = await Promise.all([
    // Calls = LeadActivity entries today
    LeadActivity.countDocuments({
      admin:     adminId,
      user:      userId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),

    // Prospects = ProspectForm records created/updated today
    ProspectForm.countDocuments({
      admin:     adminId,
      filledBy:  userId,
      updatedAt: { $gte: todayStart, $lte: todayEnd },
    }),

    // Reminders completed today
    Reminder.countDocuments({
      admin:  adminId,
      user:   userId,
      isDone: true,
      doneAt: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  // Target values (from SalesTarget or sensible defaults)
  const targetCalls     = target?.targetCalls     || 0;
  const targetProspects = target?.targetSales      || 0; // targetSales = prospect target
  const targetReminders = target?.targetRevenue    || 0; // repurposed field or 0

  const pct = (achieved, tgt) =>
    tgt > 0 ? Math.min(100, parseFloat(((achieved / tgt) * 100).toFixed(1))) : 0;

  const callsPct     = pct(callsMade, targetCalls);
  const prospectsPct = pct(prospectsConverted, targetProspects);
  const remindersPct = pct(remindersCompleted, targetReminders);

  // Overall = average of the three metrics (only include metrics with a target set)
  const activePcts = [
    targetCalls     > 0 ? callsPct     : null,
    targetProspects > 0 ? prospectsPct : null,
    targetReminders > 0 ? remindersPct : null,
  ].filter((v) => v !== null);

  const overallPercent = activePcts.length > 0
    ? parseFloat((activePcts.reduce((s, v) => s + v, 0) / activePcts.length).toFixed(1))
    : 0;

  res.status(200).json(
    new ApiResponse(200, {
      hasTarget:      Boolean(target),
      overallPercent,
      targets: {
        calls: {
          target:   targetCalls,
          achieved: callsMade,
          percent:  callsPct,
        },
        prospects: {
          target:   targetProspects,
          achieved: prospectsConverted,
          percent:  prospectsPct,
        },
        reminders: {
          target:   targetReminders,
          achieved: remindersCompleted,
          percent:  remindersPct,
        },
      },
    }, 'Daily target retrieved successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// 6. RECENT PROSPECT ACTIVITY (Data Table)
// GET /api/sales-executive/dashboard/recent-prospects
// ─────────────────────────────────────────────────────────────
/**
 * Query params:
 *  page     (default 1)
 *  pageSize (default 5, max 50)
 *  search   (name / mobile / company)
 *  status   (lead status filter)
 *  sortBy   (field name, default 'updatedAt')
 *  sortDir  ('asc' | 'desc', default 'desc')
 *
 * Returns paginated prospect rows with lead + client data.
 */
exports.getRecentProspects = catchAsync(async (req, res, next) => {
  if (!guardExec(req, next)) return;

  const { ProspectForm } = require('../models');

  const adminId = req.admin._id;
  const userId  = req.user._id;

  const page     = Math.max(1, parseInt(req.query.page)     || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 5));
  const search   = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const statusF  = typeof req.query.status === 'string'  ? req.query.status.trim().toUpperCase() : '';
  const sortDir  = req.query.sortDir === 'asc' ? 1 : -1;
  const ALLOWED_SORT = ['updatedAt', 'createdAt', 'priority', 'value'];
  const sortBy   = ALLOWED_SORT.includes(req.query.sortBy) ? req.query.sortBy : 'updatedAt';

  // Fetch all prospects for this exec (with populated data for search)
  const raw = await ProspectForm.find({
    admin:    adminId,
    filledBy: userId,
  })
    .populate('client', 'name email mobile companyName')
    .populate({
      path:   'lead',
      select: 'status isDumped lastContactedAt followUpAt',
    })
    .sort({ [sortBy]: sortDir })
    .lean();

  // Apply search filter (client-side after populate)
  let filtered = raw;
  if (search) {
    const q = search.toLowerCase();
    filtered = raw.filter((p) => {
      const c = p.client || {};
      return (
        (c.name        || '').toLowerCase().includes(q) ||
        (c.mobile      || '').includes(q)               ||
        (c.companyName || '').toLowerCase().includes(q) ||
        (p.company     || '').toLowerCase().includes(q)
      );
    });
  }

  // Apply status filter
  if (statusF) {
    filtered = filtered.filter((p) => (p.lead?.status || '').toUpperCase() === statusF);
  }

  const total = filtered.length;
  const skip  = (page - 1) * pageSize;
  const paged = filtered.slice(skip, skip + pageSize);

  const PRIORITY_MAP = { High: 'High', Medium: 'Medium', Low: 'Low' };

  const rows = paged.map((p) => ({
    id:            String(p._id),
    leadId:        p.lead ? String(p.lead._id) : null,
    name:          p.contactPerson || p.client?.name || '',
    mobile:        p.client?.mobile || '',
    email:         p.client?.email  || '',
    company:       p.company || p.client?.companyName || '',
    status:        p.lead?.status || 'UNTOUCHED',
    isDumped:      Boolean(p.lead?.isDumped),
    priority:      PRIORITY_MAP[p.priority] || 'Medium',
    value:         p.value || 0,
    requirement:   p.requirement || '',
    lastActivity:  p.lead?.lastContactedAt
      ? new Date(p.lead.lastContactedAt).toISOString().split('T')[0]
      : new Date(p.updatedAt).toISOString().split('T')[0],
    nextReminder:  p.lead?.followUpAt
      ? new Date(p.lead.followUpAt).toISOString().split('T')[0]
      : null,
    executive:     req.user.name || '',
    createdAt:     p.createdAt,
    updatedAt:     p.updatedAt,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      prospects: rows,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }, 'Recent prospects retrieved successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// 7. UPCOMING REMINDERS (Bottom Banner)
// GET /api/sales-executive/dashboard/upcoming-reminders
// ─────────────────────────────────────────────────────────────
/**
 * Returns the next N upcoming (not done, not missed) reminders
 * for this executive, sorted by remindAt ascending.
 *
 * Query params:
 *  limit  (default 3, max 10)
 */
exports.getUpcomingReminders = catchAsync(async (req, res, next) => {
  if (!guardExec(req, next)) return;

  const { Reminder } = require('../models');

  const adminId = req.admin._id;
  const userId  = req.user._id;
  const limit   = Math.min(10, Math.max(1, parseInt(req.query.limit) || 3));
  const now     = new Date();

  const reminders = await Reminder.find({
    admin:    adminId,
    user:     userId,
    isDone:   false,
    remindAt: { $gte: now },
  })
    .populate({
      path:   'lead',
      select: 'status',
      populate: { path: 'client', select: 'name mobile companyName' },
    })
    .sort({ remindAt: 1 })
    .limit(limit)
    .lean();

  const formatRemindAt = (date) => {
    const d = new Date(date);
    const today    = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const timeStr = d.toLocaleTimeString('en-IN', {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (d >= today && d < tomorrow) return `Today, ${timeStr}`;
    if (d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000)) return `Tomorrow, ${timeStr}`;

    return d.toLocaleDateString('en-IN', {
      day:   'numeric',
      month: 'short',
    }) + `, ${timeStr}`;
  };

  const rows = reminders.map((r) => ({
    id:          String(r._id),
    leadId:      r.lead ? String(r.lead._id) : null,
    title:       r.title,
    note:        r.note || '',
    remindAt:    r.remindAt,
    displayTime: formatRemindAt(r.remindAt),
    type:        r.type     || 'Call',
    priority:    r.priority || 'Medium',
    clientName:  r.lead?.client?.name    || r.title,
    mobile:      r.lead?.client?.mobile  || '',
    company:     r.lead?.client?.companyName || '',
    leadStatus:  r.lead?.status || null,
  }));

  res.status(200).json(
    new ApiResponse(200, { reminders: rows }, 'Upcoming reminders retrieved successfully')
  );
});
