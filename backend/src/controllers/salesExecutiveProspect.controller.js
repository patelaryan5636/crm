'use strict';

const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const toDisplayLeadStatus = (status, isDumped = false) => {
  if (isDumped) return 'Dumped';
  if (!status) return 'Untouched';

  const normalized = String(status).toUpperCase();
  const map = {
    NOT_TALK: 'Not Talk',
    INTERESTED: 'Interested',
    TALK: 'Talk',
    CONVERTED: 'Converted',
    DUMP: 'Dumped',
    UNTOUCHED: 'Untouched',
  };

  return map[normalized] || status;
};

const formatProspectRow = (prospect) => {
  const client = prospect.client || {};
  const lead = prospect.lead || {};

  return {
    id: prospect._id,
    leadId: lead._id || prospect.lead,
    name: prospect.contactPerson || client.name || '',
    phone: client.mobile || '',
    email: client.email || '',
    company: prospect.company || client.companyName || '',
    status: toDisplayLeadStatus(lead.status, Boolean(lead.isDumped)),
    leadStatus: lead.status || 'UNTOUCHED',
    priority: prospect.priority || 'Medium',
    requirement: prospect.requirement || '',
    stage: prospect.stage || 'Interested',
    prospectStatus: prospect.status || 'OPEN',
    value: prospect.value ?? 0,
    createdAt: prospect.createdAt,
    updatedAt: prospect.updatedAt,
    lastContactedAt: lead.lastContactedAt || null,
  };
};

/**
 * GET /api/sales-executive/prospects
 * List prospect forms filled by the current Sales Executive (tenant scoped).
 */
exports.getMyProspects = catchAsync(async (req, res, next) => {
  const { ProspectForm } = require('../models');

  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can access prospects', 403));
  }

  const prospects = await ProspectForm.find({
    admin: req.admin._id,
    filledBy: req.user._id,
  })
    .populate('client', 'name email mobile companyName')
    .populate({
      path: 'lead',
      select: 'status isDumped lastContactedAt assignedTo',
    })
    .sort({ updatedAt: -1 })
    .lean();

  const rows = prospects.map(formatProspectRow);

  const stats = {
    total: rows.length,
    interested: rows.filter((r) => r.leadStatus === 'INTERESTED').length,
    inProgress: rows.filter((r) => ['OPEN', 'IN_NEGOTIATION'].includes(r.prospectStatus)).length,
    sentToFinance: rows.filter((r) => r.prospectStatus === 'SENT_TO_FINANCE').length,
  };

  res.status(200).json(
    new ApiResponse(200, { prospects: rows, stats }, 'Prospects retrieved successfully')
  );
});

/**
 * GET /api/sales-executive/prospects/:prospectId
 * Single prospect with lead + client details (view / edit load).
 */
exports.getProspectById = catchAsync(async (req, res, next) => {
  const { prospectId } = req.params;
  const { ProspectForm } = require('../models');

  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can access prospects', 403));
  }

  const prospect = await ProspectForm.findOne({
    _id: prospectId,
    admin: req.admin._id,
    filledBy: req.user._id,
  })
    .populate('client', 'name email mobile companyName')
    .populate({
      path: 'lead',
      select: 'status isDumped lastContactedAt assignedTo createdAt',
    })
    .lean();

  if (!prospect) {
    return next(new AppError('Prospect not found', 404));
  }

  res.status(200).json(
    new ApiResponse(200, formatProspectRow(prospect), 'Prospect retrieved successfully')
  );
});

/**
 * PUT /api/sales-executive/prospects/:prospectId
 * Update prospect form fields (Sales Executive scope).
 */
exports.updateProspect = catchAsync(async (req, res, next) => {
  const { prospectId } = req.params;
  const { contactPerson, company, priority, requirement } = req.body;
  const { ProspectForm, Lead, LeadActivity, AuditLog } = require('../models');

  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can update prospects', 403));
  }

  const prospect = await ProspectForm.findOne({
    _id: prospectId,
    admin: req.admin._id,
    filledBy: req.user._id,
  }).populate('client', 'name email mobile companyName');

  if (!prospect) {
    return next(new AppError('Prospect not found', 404));
  }

  const contactName = contactPerson?.trim() || prospect.contactPerson || prospect.client?.name || '';
  const companyName = company?.trim() || prospect.company || prospect.client?.companyName || '';

  if (!contactName || !companyName) {
    return next(new AppError('Contact person and company are required', 400));
  }

  const allowedPriorities = ['High', 'Medium', 'Low'];
  const nextPriority = priority?.trim() || prospect.priority || 'Medium';
  if (!allowedPriorities.includes(nextPriority)) {
    return next(new AppError('Priority must be High, Medium, or Low', 400));
  }

  const before = {
    contactPerson: prospect.contactPerson,
    company: prospect.company,
    priority: prospect.priority,
    requirement: prospect.requirement,
  };

  prospect.contactPerson = contactName;
  prospect.company = companyName;
  prospect.priority = nextPriority;
  prospect.requirement = requirement?.trim() || '';
  prospect.updatedBy = req.user._id;
  prospect.notes = prospect.requirement;
  await prospect.save();

  const lead = await Lead.findOne({
    _id: prospect.lead,
    admin: req.admin._id,
    assignedTo: req.user._id,
    isDeleted: { $ne: true },
  });

  if (lead) {
    lead.lastContactedAt = new Date();
    await lead.save();

    await LeadActivity.create({
      admin: req.admin._id,
      lead: lead._id,
      user: req.user._id,
      status: lead.status,
      comment: `Prospect updated: ${prospect.requirement || 'No requirement note'}`,
      duration: 0,
    });
  }

  await AuditLog.create({
    admin: req.admin._id,
    performedBy: req.user._id,
    performerType: 'USER',
    action: 'PROSPECT_UPDATED',
    targetModel: 'ProspectForm',
    targetId: prospect._id,
    before,
    after: {
      contactPerson: prospect.contactPerson,
      company: prospect.company,
      priority: prospect.priority,
      requirement: prospect.requirement,
    },
    ipAddress: getClientIp(req),
    note: `Prospect updated for ${contactName}`,
  });

  const updated = await ProspectForm.findById(prospect._id)
    .populate('client', 'name email mobile companyName')
    .populate({ path: 'lead', select: 'status isDumped lastContactedAt' })
    .lean();

  res.status(200).json(
    new ApiResponse(200, formatProspectRow(updated), 'Prospect updated successfully')
  );
});
