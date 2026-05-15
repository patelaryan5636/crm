'use strict';

/**
 * FOLLOW-UP CONTROLLER — Sales Executive
 * Manages reminders/follow-ups for the logged-in Sales Executive.
 *
 * Rules (from planning.md):
 *  - Scoped to: admin (tenant) + user (this executive)
 *  - Reminder model: admin, user, lead, title, note, remindAt, isMissed, isDone, type, priority
 *  - isMissed is set when remindAt < now and isDone = false
 *  - Only the executive who owns the reminder can mark it done
 */

const catchAsync = require('../utils/catchAsync');
const AppError   = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const getClientIp = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

/**
 * Derive status string from reminder fields.
 * - isDone  → "done"
 * - isMissed (remindAt < now && !isDone) → "expired"
 * - else → "pending"
 */
const deriveStatus = (reminder) => {
  if (reminder.isDone) return 'done';
  if (reminder.isMissed || new Date(reminder.remindAt) < new Date()) return 'expired';
  return 'pending';
};

/**
 * Format a Date to "HH:MM AM/PM"
 */
const formatTime = (date) => {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

/**
 * Format a Date to "YYYY-MM-DD"
 */
const formatDate = (date) => new Date(date).toISOString().split('T')[0];

// ─────────────────────────────────────────────────────────────
// GET /api/sales-executive/follow-ups
// ─────────────────────────────────────────────────────────────
/**
 * Fetch all follow-up reminders for the current Sales Executive.
 *
 * Returns:
 *  - reminders[]  — full list (for calendar + table)
 *  - stats        — { today, expired, thisWeek, completed }
 *
 * Query params (all optional):
 *  - type         — filter by type (Call/Email/Meeting/Whatsapp/Demo)
 *  - status       — filter by status (pending/expired/done)
 *  - dateFrom     — ISO date string
 *  - dateTo       — ISO date string
 */
exports.getMyFollowUps = catchAsync(async (req, res, next) => {
  const { Reminder } = require('../models');

  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can access this resource', 403));
  }

  const { type, status, dateFrom, dateTo } = req.query;

  // ── Base filter: tenant + this executive ──
  const filter = {
    admin: req.admin._id,
    user:  req.user._id,
  };

  if (type && ['Call', 'Email', 'Meeting', 'Whatsapp', 'Demo'].includes(type)) {
    filter.type = type;
  }

  if (dateFrom || dateTo) {
    filter.remindAt = {};
    if (dateFrom) filter.remindAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.remindAt.$lte = end;
    }
  }

  // Fetch all reminders with lead + client populated
  const raw = await Reminder.find(filter)
    .populate({
      path: 'lead',
      select: 'status isDumped',
      populate: { path: 'client', select: 'name email mobile companyName' },
    })
    .sort({ remindAt: 1 })
    .lean();

  // ── Auto-mark missed: remindAt < now && !isDone ──
  const now = new Date();
  const missedIds = raw
    .filter((r) => !r.isDone && !r.isMissed && new Date(r.remindAt) < now)
    .map((r) => r._id);

  if (missedIds.length > 0) {
    await Reminder.updateMany(
      { _id: { $in: missedIds } },
      { $set: { isMissed: true } }
    );
    // Update in-memory too
    raw.forEach((r) => {
      if (missedIds.some((id) => String(id) === String(r._id))) {
        r.isMissed = true;
      }
    });
  }

  // ── Transform ──
  const reminders = raw.map((r) => ({
    id:          String(r._id),
    leadId:      r.lead ? String(r.lead._id) : null,
    leadName:    r.lead?.client?.name    || r.title,
    mobile:      r.lead?.client?.mobile  || '',
    email:       r.lead?.client?.email   || '',
    companyName: r.lead?.client?.companyName || '',
    title:       r.title,
    notes:       r.note || '',
    date:        formatDate(r.remindAt),
    time:        formatTime(r.remindAt),
    remindAt:    r.remindAt,
    type:        r.type     || 'Call',
    priority:    r.priority || 'Medium',
    status:      deriveStatus(r),
    isDone:      r.isDone,
    isMissed:    r.isMissed,
  }));

  // ── Apply status filter AFTER derivation ──
  let filtered = reminders;
  if (status && ['pending', 'expired', 'done'].includes(status)) {
    filtered = reminders.filter((r) => r.status === status);
  }

  // ── Stats (always from full unfiltered set) ──
  const todayStr = formatDate(now);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const stats = {
    today:     reminders.filter((r) => r.date === todayStr && r.status !== 'done').length,
    expired:   reminders.filter((r) => r.status === 'expired').length,
    thisWeek:  reminders.filter((r) => {
      const d = new Date(r.remindAt);
      return d >= startOfWeek && d <= endOfWeek;
    }).length,
    completed: reminders.filter((r) => r.status === 'done').length,
  };

  res.status(200).json(
    new ApiResponse(200, { reminders: filtered, stats }, 'Follow-ups retrieved successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/sales-executive/follow-ups/:id/done
// ─────────────────────────────────────────────────────────────
/**
 * Mark a reminder as done.
 * Only the owner (this executive) can mark their own reminder done.
 */
exports.markFollowUpDone = catchAsync(async (req, res, next) => {
  const { Reminder, AuditLog } = require('../models');
  const { id } = req.params;

  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can update follow-ups', 403));
  }

  const reminder = await Reminder.findOne({
    _id:   id,
    admin: req.admin._id,
    user:  req.user._id,
  });

  if (!reminder) {
    return next(new AppError('Follow-up not found or not assigned to you', 404));
  }

  if (reminder.isDone) {
    return next(new AppError('Follow-up is already marked as done', 400));
  }

  reminder.isDone  = true;
  reminder.isMissed = false;
  reminder.doneAt  = new Date();
  await reminder.save();

  // Audit log
  await AuditLog.create({
    admin:         req.admin._id,
    performedBy:   req.user._id,
    performerType: 'USER',
    action:        'LEAD_STATUS_CHANGED',
    targetModel:   'Reminder',
    targetId:      reminder._id,
    before:        { isDone: false },
    after:         { isDone: true, doneAt: reminder.doneAt },
    ipAddress:     getClientIp(req),
    note:          'Follow-up marked as done by Sales Executive',
  });

  res.status(200).json(
    new ApiResponse(200, {
      id:     String(reminder._id),
      isDone: true,
      doneAt: reminder.doneAt,
      status: 'done',
    }, 'Follow-up marked as done')
  );
});
