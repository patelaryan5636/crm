'use strict';

/**
 * financeNotification.controller.js
 *
 * Finance Notification Centre — aggregates real events from:
 *   Payment    → Payment Received, Payment Failed, Pending Payment
 *   Invoice    → Invoice Sent, Invoice Overdue, Invoice Paid
 *   WorkOrder  → Work Order Pending Approval, Work Order Signed/Approved
 *   ProspectForm → New Prospect (client interested)
 *
 * All events are derived from existing collections — no extra storage.
 * Read/delete state is tracked via the existing Notification model.
 *
 * Endpoints (all under /api/finance/notifications):
 *   GET    /           — paginated list with filters
 *   GET    /summary    — KPI counts (total, unread per type)
 *   PATCH  /:id/read   — mark one as read
 *   PATCH  /read-all   — mark all as read
 *   DELETE /:id        — dismiss one notification
 *   DELETE /clear-all  — dismiss all read notifications
 */

const catchAsync   = require('../utils/catchAsync');
const AppError     = require('../utils/appError');
const ApiResponse  = require('../utils/apiResponse');
const mongoose     = require('mongoose');

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return dt.toISOString();
};

const fmtCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Build raw notification events from Payment, Invoice, WorkOrder, ProspectForm.
 * Returns array of event objects — NOT persisted, generated on-the-fly.
 */
async function buildEvents(adminId) {
  const {
    Payment, Invoice, WorkOrder, ProspectForm, Client,
  } = require('../models');

  const mongoAdminId = new mongoose.Types.ObjectId(adminId);

  const [payments, invoices, workOrders, prospects] = await Promise.all([
    Payment.find({ admin: adminId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('client', 'name companyName')
      .lean(),

    Invoice.find({ admin: adminId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('client', 'name companyName')
      .lean(),

    WorkOrder.find({ admin: adminId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),

    ProspectForm.find({ admin: adminId })
      .sort({ createdAt: -1 })
      .limit(60)
      .populate('lead', 'name phone')
      .populate('filledBy', 'name')
      .lean(),
  ]);

  const events = [];
  const now = new Date();

  // ── Payments ──────────────────────────────────────────────────────────────
  payments.forEach((p) => {
    const clientName = p.client?.name || p.client?.companyName || 'Client';
    const amount = fmtCurrency(p.amount);
    const method = p.paymentProvider === 'OFFLINE' ? 'Global Payment' : (p.paymentProvider || 'Razorpay');

    if (p.status === 'SUCCESS') {
      events.push({
        eventId:   `pay-${p._id}`,
        refId:     String(p._id),
        refType:   'Payment',
        type:      'PAYMENT',
        subType:   'PAYMENT_RECEIVED',
        title:     'Payment Received',
        client:    clientName,
        amount:    amount,
        message:   `${amount} received from ${clientName} via ${method}.`,
        priority:  'HIGH',
        date:      fmt(p.paidAt || p.createdAt),
        _ts:       new Date(p.paidAt || p.createdAt),
      });
    } else if (p.status === 'FAILED') {
      events.push({
        eventId:   `pay-${p._id}`,
        refId:     String(p._id),
        refType:   'Payment',
        type:      'PAYMENT',
        subType:   'PAYMENT_FAILED',
        title:     'Payment Failed',
        client:    clientName,
        amount:    amount,
        message:   `Payment of ${amount} from ${clientName} has failed via ${method}. Please follow up.`,
        priority:  'URGENT',
        date:      fmt(p.createdAt),
        _ts:       new Date(p.createdAt),
      });
    } else if (p.status === 'PENDING') {
      events.push({
        eventId:   `pay-${p._id}`,
        refId:     String(p._id),
        refType:   'Payment',
        type:      'PAYMENT',
        subType:   'PAYMENT_PENDING',
        title:     'Payment Pending',
        client:    clientName,
        amount:    amount,
        message:   `Payment of ${amount} from ${clientName} is awaiting clearance.`,
        priority:  'MEDIUM',
        date:      fmt(p.createdAt),
        _ts:       new Date(p.createdAt),
      });
    }
  });

  // ── Invoices ──────────────────────────────────────────────────────────────
  invoices.forEach((inv) => {
    const clientName = inv.clientName || inv.client?.name || inv.client?.companyName || 'Client';
    const amount     = fmtCurrency(inv.totalAmount || inv.amount);
    const invNo      = inv.invoiceNumber || String(inv._id).slice(-6).toUpperCase();

    // Invoice sent (created)
    events.push({
      eventId:   `inv-sent-${inv._id}`,
      refId:     String(inv._id),
      refType:   'Invoice',
      type:      'INVOICE',
      subType:   'INVOICE_SENT',
      title:     'Invoice Generated',
      client:    clientName,
      amount:    amount,
      message:   `Invoice ${invNo} of ${amount} has been generated for ${clientName}.`,
      priority:  'LOW',
      date:      fmt(inv.createdAt),
      _ts:       new Date(inv.createdAt),
    });

    // Overdue check
    if (inv.dueDate && inv.status !== 'PAID') {
      const daysOverdue = Math.floor((now - new Date(inv.dueDate)) / 86400000);
      if (daysOverdue > 0) {
        events.push({
          eventId:   `inv-overdue-${inv._id}`,
          refId:     String(inv._id),
          refType:   'Invoice',
          type:      'INVOICE',
          subType:   'INVOICE_OVERDUE',
          title:     'Invoice Overdue',
          client:    clientName,
          amount:    amount,
          message:   `Invoice ${invNo} of ${amount} is overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}. Please follow up with ${clientName}.`,
          priority:  'URGENT',
          date:      fmt(inv.dueDate),
          _ts:       new Date(inv.dueDate),
        });
      }
    }

    // Paid
    if (inv.status === 'PAID') {
      events.push({
        eventId:   `inv-paid-${inv._id}`,
        refId:     String(inv._id),
        refType:   'Invoice',
        type:      'INVOICE',
        subType:   'INVOICE_PAID',
        title:     'Invoice Paid',
        client:    clientName,
        amount:    amount,
        message:   `Invoice ${invNo} of ${amount} from ${clientName} has been fully paid.`,
        priority:  'HIGH',
        date:      fmt(inv.updatedAt),
        _ts:       new Date(inv.updatedAt),
      });
    }
  });

  // ── Work Orders ───────────────────────────────────────────────────────────
  workOrders.forEach((wo) => {
    const clientName = wo.clientName || 'Client';
    const woNo       = wo.woNumber || String(wo._id).slice(-6).toUpperCase();
    const amount     = fmtCurrency(wo.amount || wo.totalAmount);

    // Pending approval
    if (!wo.isApproved) {
      events.push({
        eventId:   `wo-pending-${wo._id}`,
        refId:     String(wo._id),
        refType:   'WorkOrder',
        type:      'WORK_ORDER',
        subType:   'WO_PENDING_APPROVAL',
        title:     'Work Order Pending Approval',
        client:    clientName,
        amount:    amount,
        message:   `Work Order ${woNo} for ${clientName} (${amount}) is pending your approval.`,
        priority:  'MEDIUM',
        date:      fmt(wo.createdAt),
        _ts:       new Date(wo.createdAt),
      });
    }

    // Approved / Signed
    if (wo.isApproved) {
      events.push({
        eventId:   `wo-approved-${wo._id}`,
        refId:     String(wo._id),
        refType:   'WorkOrder',
        type:      'WORK_ORDER',
        subType:   'WO_SIGNED',
        title:     'Work Order Signed',
        client:    clientName,
        amount:    amount,
        message:   `Work Order ${woNo} has been approved and signed for ${clientName}. Project value: ${amount}.`,
        priority:  'HIGH',
        date:      fmt(wo.approvedAt || wo.updatedAt),
        _ts:       new Date(wo.approvedAt || wo.updatedAt),
      });
    }
  });

  // ── Prospects (Interested Clients) ────────────────────────────────────────
  prospects.forEach((pf) => {
    const clientName = pf.contactPerson || pf.lead?.name || 'Prospect';
    const exec       = pf.filledBy?.name || 'Sales Executive';

    events.push({
      eventId:   `prospect-${pf._id}`,
      refId:     String(pf._id),
      refType:   'ProspectForm',
      type:      'PROSPECT',
      subType:   'PROSPECT_CREATED',
      title:     'New Prospect Added',
      client:    clientName,
      amount:    fmtCurrency(pf.proposedBudget || pf.budget || 0),
      message:   `${clientName} has shown interest. Prospect form submitted by ${exec}.`,
      priority:  'MEDIUM',
      date:      fmt(pf.createdAt),
      _ts:       new Date(pf.createdAt),
    });
  });

  // Sort by newest first
  events.sort((a, b) => b._ts - a._ts);
  return events;
}

// ─── GET /api/finance/notifications ──────────────────────────────────────────

exports.getNotifications = catchAsync(async (req, res, next) => {
  const adminId = req.admin?._id;
  if (!adminId) return next(new AppError('Admin context not found', 400));

  const { FinanceNotificationRead } = require('../models');

  const page     = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, parseInt(req.query.pageSize) || 20);
  const type     = req.query.type || 'ALL';      // ALL | PAYMENT | INVOICE | WORK_ORDER | PROSPECT
  const status   = req.query.status || 'ALL';    // ALL | UNREAD | READ
  const priority = req.query.priority || 'ALL';  // ALL | URGENT | HIGH | MEDIUM | LOW
  const search   = (req.query.search || '').trim().toLowerCase();

  // Build all events
  let events = await buildEvents(adminId);

  // Fetch read/dismissed states for this admin
  const readRecords = await FinanceNotificationRead.find({ admin: adminId }).lean();
  const readMap     = {};
  const dismissMap  = {};
  readRecords.forEach(r => {
    readMap[r.eventId]    = r.isRead;
    dismissMap[r.eventId] = r.isDismissed;
  });

  // Enrich events with read state and filter dismissed
  events = events
    .filter(e => !dismissMap[e.eventId])
    .map(e => ({
      ...e,
      isRead: readMap[e.eventId] || false,
    }));

  // Apply filters
  if (type !== 'ALL')     events = events.filter(e => e.type === type);
  if (status === 'UNREAD') events = events.filter(e => !e.isRead);
  if (status === 'READ')   events = events.filter(e => e.isRead);
  if (priority !== 'ALL') events = events.filter(e => e.priority === priority);
  if (search)             events = events.filter(e =>
    e.title.toLowerCase().includes(search) ||
    e.client.toLowerCase().includes(search) ||
    e.message.toLowerCase().includes(search)
  );

  const total      = events.length;
  const totalPages = Math.ceil(total / pageSize);
  const skip       = (page - 1) * pageSize;
  const paged      = events.slice(skip, skip + pageSize);

  res.status(200).json(new ApiResponse(200, {
    notifications: paged,
    pagination: { total, page, pageSize, totalPages },
  }, 'Notifications fetched'));
});

// ─── GET /api/finance/notifications/summary ───────────────────────────────────

exports.getSummary = catchAsync(async (req, res, next) => {
  const adminId = req.admin?._id;
  if (!adminId) return next(new AppError('Admin context not found', 400));

  const { FinanceNotificationRead } = require('../models');

  let events = await buildEvents(adminId);

  const readRecords = await FinanceNotificationRead.find({ admin: adminId }).lean();
  const readMap     = {};
  const dismissMap  = {};
  readRecords.forEach(r => {
    readMap[r.eventId]    = r.isRead;
    dismissMap[r.eventId] = r.isDismissed;
  });

  events = events
    .filter(e => !dismissMap[e.eventId])
    .map(e => ({ ...e, isRead: readMap[e.eventId] || false }));

  const total         = events.length;
  const unread        = events.filter(e => !e.isRead).length;
  const paymentAlerts = events.filter(e => e.type === 'PAYMENT').length;
  const invoiceAlerts = events.filter(e => e.type === 'INVOICE').length;
  const woAlerts      = events.filter(e => e.type === 'WORK_ORDER').length;
  const prospectAlerts = events.filter(e => e.type === 'PROSPECT').length;
  const urgent        = events.filter(e => e.priority === 'URGENT' && !e.isRead).length;

  res.status(200).json(new ApiResponse(200, {
    total, unread, paymentAlerts, invoiceAlerts, woAlerts, prospectAlerts, urgent,
  }, 'Summary fetched'));
});

// ─── PATCH /api/finance/notifications/:id/read ────────────────────────────────

exports.markRead = catchAsync(async (req, res, next) => {
  const adminId = req.admin?._id;
  if (!adminId) return next(new AppError('Admin context not found', 400));

  const { FinanceNotificationRead } = require('../models');
  const { id } = req.params; // eventId

  await FinanceNotificationRead.findOneAndUpdate(
    { admin: adminId, eventId: id },
    { admin: adminId, eventId: id, isRead: true, readAt: new Date() },
    { upsert: true, new: true },
  );

  res.status(200).json(new ApiResponse(200, null, 'Marked as read'));
});

// ─── PATCH /api/finance/notifications/read-all ───────────────────────────────

exports.markAllRead = catchAsync(async (req, res, next) => {
  const adminId = req.admin?._id;
  if (!adminId) return next(new AppError('Admin context not found', 400));

  const { FinanceNotificationRead } = require('../models');

  // Get all current events to know their IDs
  const events = await buildEvents(adminId);

  const ops = events.map(e => ({
    updateOne: {
      filter: { admin: adminId, eventId: e.eventId },
      update: { $set: { admin: adminId, eventId: e.eventId, isRead: true, readAt: new Date() } },
      upsert: true,
    },
  }));

  if (ops.length) await FinanceNotificationRead.bulkWrite(ops);

  res.status(200).json(new ApiResponse(200, null, 'All marked as read'));
});

// ─── DELETE /api/finance/notifications/:id ────────────────────────────────────

exports.dismiss = catchAsync(async (req, res, next) => {
  const adminId = req.admin?._id;
  if (!adminId) return next(new AppError('Admin context not found', 400));

  const { FinanceNotificationRead } = require('../models');
  const { id } = req.params;

  await FinanceNotificationRead.findOneAndUpdate(
    { admin: adminId, eventId: id },
    { admin: adminId, eventId: id, isDismissed: true, isRead: true },
    { upsert: true, new: true },
  );

  res.status(200).json(new ApiResponse(200, null, 'Notification dismissed'));
});

// ─── DELETE /api/finance/notifications/clear-all ─────────────────────────────

exports.clearAll = catchAsync(async (req, res, next) => {
  const adminId = req.admin?._id;
  if (!adminId) return next(new AppError('Admin context not found', 400));

  const { FinanceNotificationRead } = require('../models');

  // Dismiss all read notifications
  const events = await buildEvents(adminId);
  const readRecords = await FinanceNotificationRead.find({ admin: adminId }).lean();
  const readMap = {};
  readRecords.forEach(r => { readMap[r.eventId] = r.isRead; });

  const readEventIds = events
    .filter(e => readMap[e.eventId])
    .map(e => e.eventId);

  if (readEventIds.length) {
    await FinanceNotificationRead.updateMany(
      { admin: adminId, eventId: { $in: readEventIds } },
      { $set: { isDismissed: true } },
    );
  }

  res.status(200).json(new ApiResponse(200, null, 'Read notifications cleared'));
});
