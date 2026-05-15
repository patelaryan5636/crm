'use strict';

const { BulkLeadUpload } = require('../models');
const bulkLeadUploadService = require('../services/bulkLeadUpload.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * GET /api/sales-manager/leads/bulk/template
 * Returns a sample CSV template for bulk lead upload
 */
exports.downloadTemplate = catchAsync(async (req, res) => {
  const header = 'NAME,MOBILE,EMAIL,COMPANY NAME\n';
  const sample = 'Rahul Sharma,9876543210,rahul@example.com,Google\n' +
                 'Priya Gupta,9888777666,priya@business.in,Amazon\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=lead_template.csv');
  res.status(200).send(header + sample);
});

/**
 * POST /api/sales-manager/leads/bulk/preview
 */
exports.previewUpload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded.', 400));
  }

  const fileType = req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv') ? 'CSV' : 'EXCEL';

  const newUpload = new BulkLeadUpload({
    admin: req.admin._id,
    uploadedBy: req.user._id,
    fileType,
    fileName: req.file.originalname,
    fileUrl: req.file.path,
    status: 'PROCESSING'
  });
  await newUpload.save();

  const preview = await bulkLeadUploadService.processUploadPreview(newUpload._id);

  res.status(200).json(
    new ApiResponse(200, {
      uploadId: preview.uploadId,
      summary: preview.summary,
      previewRows: preview.previewRows
    }, 'Preview generated successfully')
  );
});

/**
 * POST /api/sales-manager/leads/bulk/:uploadId/commit
 */
exports.commitUpload = catchAsync(async (req, res, next) => {
  const { uploadId } = req.params;
  const result = await bulkLeadUploadService.commitUpload(uploadId);

  res.status(200).json(
    new ApiResponse(200, {
      uploadId: result._id,
      importedCount: result.imported,
      failedCount: result.failedRows.length,
      status: result.status
    }, 'Upload committed successfully')
  );
});

/**
 * GET /api/sales-manager/leads/bulk/:uploadId/status
 */
exports.getStatus = catchAsync(async (req, res, next) => {
  const { uploadId } = req.params;
  const upload = await BulkLeadUpload.findOne({ _id: uploadId, admin: req.admin._id });
  if (!upload) return next(new AppError('Upload not found', 404));
  res.status(200).json(new ApiResponse(200, upload, 'Status retrieved successfully'));
});

/**
 * GET /api/sales-manager/leads
 */
exports.getAllLeads = catchAsync(async (req, res) => {
  const { Lead, LeadAssignmentHistory } = require('../models');
  
  const query = { 
    admin: req.admin._id,
    isDeleted: { $ne: true } 
  };

  const leads = await Lead.find(query)
  .populate({
    path: 'client',
    select: 'name email mobile companyName'
  })
  .populate('assignedTo', 'name email role')
  .populate('assignedBy', 'name email role')
  .populate('team', 'name')
  .sort({ createdAt: -1 });

  const assignmentHistory = await LeadAssignmentHistory.find({
    admin: req.admin._id,
    lead: { $in: leads.map((lead) => lead._id) },
  })
    .sort({ assignedAt: -1 })
    .select('lead assignedAt reason')
    .lean();

  const latestAssignmentByLead = new Map();
  for (const entry of assignmentHistory) {
    const leadId = String(entry.lead);
    if (!latestAssignmentByLead.has(leadId)) {
      latestAssignmentByLead.set(leadId, entry);
    }
  }

  const flatLeads = leads.map(l => ({
    id: l._id,
    name: l.client?.name || '',
    email: l.client?.email || '',
    mobile: l.client?.mobile || '',
    companyName: l.client?.companyName || '',
    status: l.status,
    isDumped: Boolean(l.isDumped),
    dumpReason: l.dumpReason || null,
    createdAt: l.createdAt.toISOString().split('T')[0],
    assignedTo: l.assignedTo ? l.assignedTo.name : 'Unassigned',
    assignedBy: l.assignedBy ? l.assignedBy.name : 'Unassigned',
    team: l.team ? l.team.name : 'No Team',
    assignedAt: latestAssignmentByLead.get(String(l._id))?.assignedAt
      ? new Date(latestAssignmentByLead.get(String(l._id)).assignedAt).toISOString().split('T')[0]
      : l.updatedAt.toISOString().split('T')[0],
    assignmentReason: latestAssignmentByLead.get(String(l._id))?.reason || null,
  }));

  res.status(200).json(new ApiResponse(200, flatLeads, 'Leads retrieved successfully'));
});

/**
 * GET /api/sales-manager/leads/assigned
 */
exports.getAssignedLeads = catchAsync(async (req, res) => {
  const { Lead, LeadAssignmentHistory } = require('../models');

  const query = {
    admin: req.admin._id,
    isDeleted: { $ne: true },
    isDumped: { $ne: true },
    assignedTo: { $ne: null },
  };

  const leads = await Lead.find(query)
    .populate({
      path: 'client',
      select: 'name email mobile companyName',
    })
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
    .populate('team', 'name')
    .sort({ updatedAt: -1 });

  const assignmentHistory = await LeadAssignmentHistory.find({
    admin: req.admin._id,
    lead: { $in: leads.map((lead) => lead._id) },
  })
    .sort({ assignedAt: -1 })
    .select('lead assignedAt reason')
    .lean();

  const latestAssignmentByLead = new Map();
  for (const entry of assignmentHistory) {
    const leadId = String(entry.lead);
    if (!latestAssignmentByLead.has(leadId)) {
      latestAssignmentByLead.set(leadId, entry);
    }
  }

  const flatLeads = leads.map((l) => ({
    id: l._id,
    name: l.client?.name || '',
    email: l.client?.email || '',
    mobile: l.client?.mobile || '',
    companyName: l.client?.companyName || '',
    status: l.status,
    isDumped: Boolean(l.isDumped),
    dumpReason: l.dumpReason || null,
    createdAt: l.createdAt.toISOString().split('T')[0],
    assignedTo: l.assignedTo ? l.assignedTo.name : 'Unassigned',
    assignedBy: l.assignedBy ? l.assignedBy.name : 'Unassigned',
    team: l.team ? l.team.name : 'No Team',
    assignedAt: latestAssignmentByLead.get(String(l._id))?.assignedAt
      ? new Date(latestAssignmentByLead.get(String(l._id)).assignedAt).toISOString().split('T')[0]
      : l.updatedAt.toISOString().split('T')[0],
    assignmentReason: latestAssignmentByLead.get(String(l._id))?.reason || null,
  }));

  res.status(200).json(new ApiResponse(200, flatLeads, 'Assigned leads retrieved successfully'));
});

/**
 * GET /api/sales-manager/leads/assignment-targets
 */
exports.getAssignmentTargets = catchAsync(async (req, res) => {
  const targetRole = req.query.role ? String(req.query.role).trim() : null;
  const result = await bulkLeadUploadService.getAssignmentTargets(req.admin._id, req.user, targetRole);

  res.status(200).json(
    new ApiResponse(200, result, 'Assignment targets retrieved successfully')
  );
});

/**
 * POST /api/sales-manager/leads/:leadId/assign
 */
exports.assignLead = catchAsync(async (req, res, next) => {
  const { leadId } = req.params;
  const { userId, reason = null } = req.body;
  const result = await bulkLeadUploadService.assignLead(req.admin._id, leadId, userId, req.user, reason);
  res.status(200).json(new ApiResponse(200, result, 'Lead assigned successfully'));
});

/**
 * POST /api/sales-manager/leads/bulk/assign
 */
exports.bulkAssignLeads = catchAsync(async (req, res) => {
  const { leadIds, userId, reason = null } = req.body;
  const result = await bulkLeadUploadService.assignBulkLeads(req.admin._id, leadIds, userId, req.user, reason);

  res.status(200).json(
    new ApiResponse(200, result, `Successfully assigned ${result.assignedCount} leads`)
  );
});

/**
 * POST /api/sales-manager/leads/bulk/distribute
 */
exports.distributeLeads = catchAsync(async (req, res) => {
  const { assignments } = req.body;
  const result = await bulkLeadUploadService.distributeLeads(req.admin._id, assignments, req.user);

  if (!result.assignedCount || result.assignedCount <= 0) {
    const groups = Array.isArray(result.groups) ? result.groups : [];
    const missingCount = groups.reduce((sum, group) => sum + (Array.isArray(group.skippedLeadIds) ? group.skippedLeadIds.length : 0), 0);
    const alreadyAssignedCount = groups.reduce(
      (sum, group) => sum + (Array.isArray(group.skipped)
        ? group.skipped.filter((entry) => entry.reason === 'ALREADY_ASSIGNED').length
        : 0),
      0
    );
    const totalSkipped = Number(result.skippedCount || 0);

    throw new AppError(
      `No leads were assigned. skipped=${totalSkipped}, missing=${missingCount}, alreadyAssigned=${alreadyAssignedCount}. Refresh leads and retry.`,
      409
    );
  }

  res.status(200).json(
    new ApiResponse(200, result, `Successfully distributed ${result.assignedCount} leads`)
  );
});

/**
 * POST /api/sales-manager/leads/bulk/:uploadId/assign-batch
 */
exports.assignBatchLeads = catchAsync(async (req, res, next) => {
  const { uploadId } = req.params;
  const { leadIds = [], userId, reason = null } = req.body;
  const result = await bulkLeadUploadService.assignBatchLeads(req.admin._id, uploadId, leadIds, userId, req.user, reason);

  res.status(200).json(
    new ApiResponse(200, result, `Successfully assigned ${result.assignedCount} leads`)
  );
});

/**
 * DELETE /api/sales-manager/leads/:leadId
 */
exports.deleteLead = catchAsync(async (req, res, next) => {
  const { Lead, Client } = require('../models');
  const { leadId } = req.params;

  const lead = await Lead.findOne({ _id: leadId, admin: req.admin._id });
  if (!lead) return next(new AppError('Lead not found', 404));

  // To allow re-upload, we need to remove the Client as well (since mobile is unique)
  const clientId = lead.client;
  
  await Lead.deleteOne({ _id: leadId });
  await Client.deleteOne({ _id: clientId });

  res.status(200).json(new ApiResponse(200, null, 'Lead and client deleted permanently'));
});

/**
 * GET /api/sales-executive/leads
 * Fetch leads assigned to the current Sales Executive
 */
exports.getMyAssignedLeads = catchAsync(async (req, res, next) => {
  const { Lead, LeadAssignmentHistory } = require('../models');

  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executive users can access this resource', 403));
  }

  // Strict filtering: only this executive's leads
  const query = {
    admin: req.admin._id,
    assignedTo: req.user._id,
    isDeleted: { $ne: true },
    // Note: Keep isDumped leads to show dump history, but frontend can filter if needed
  };

  // Fetch leads with all necessary relationships
  const leads = await Lead.find(query)
    .populate({
      path: 'client',
      select: 'name email mobile companyName'
    })
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
    .populate('team', 'name')
    .sort({ updatedAt: -1 })
    .lean();

  // Keep only leads assigned by Sales Team Leaders as requested business rule.
  const leadsAssignedByTL = leads.filter((lead) => lead.assignedBy?.role === 'SALES_TL');

  // Get assignment history for latest assignment metadata
  const assignmentHistory = await LeadAssignmentHistory.find({
    admin: req.admin._id,
    lead: { $in: leadsAssignedByTL.map((lead) => lead._id) },
  })
    .sort({ assignedAt: -1 })
    .select('lead assignedAt reason')
    .lean();

  // Build map of latest assignment per lead
  const latestAssignmentByLead = new Map();
  for (const entry of assignmentHistory) {
    const leadId = String(entry.lead);
    if (!latestAssignmentByLead.has(leadId)) {
      latestAssignmentByLead.set(leadId, entry);
    }
  }

  // Transform to frontend format
  const transformedLeads = leadsAssignedByTL.map((l) => ({
    id: l._id,
    name: l.client?.name || '',
    email: l.client?.email || '',
    mobile: l.client?.mobile || '',
    companyName: l.client?.companyName || '',
    status: l.status || 'UNTOUCHED',
    isDumped: Boolean(l.isDumped),
    dumpReason: l.dumpReason || null,
    createdAt: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : '',
    assignedTo: l.assignedTo ? l.assignedTo.name : 'Unassigned',
    assignedBy: l.assignedBy ? l.assignedBy.name : 'Unassigned',
    team: l.team ? l.team.name : 'No Team',
    assignedAt: latestAssignmentByLead.get(String(l._id))?.assignedAt
      ? new Date(latestAssignmentByLead.get(String(l._id)).assignedAt).toISOString().split('T')[0]
      : (l.updatedAt ? new Date(l.updatedAt).toISOString().split('T')[0] : ''),
    assignmentReason: latestAssignmentByLead.get(String(l._id))?.reason || null,
  }));

  // Calculate status statistics
  const stats = {
    totalLeads: transformedLeads.length,
    talk: transformedLeads.filter((l) => l.status === 'TALK').length,
    interested: transformedLeads.filter((l) => l.status === 'INTERESTED').length,
    dumped: transformedLeads.filter((l) => l.isDumped === true).length,
    untouched: transformedLeads.filter((l) => l.status === 'UNTOUCHED').length,
    notTalk: transformedLeads.filter((l) => l.status === 'NOT_TALK').length,
    converted: transformedLeads.filter((l) => l.status === 'CONVERTED').length,
  };

  res.status(200).json(
    new ApiResponse(
      200,
      {
        leads: transformedLeads,
        stats,
      },
      'Leads retrieved successfully'
    )
  );
});

// ────────────────────────────────────────────────────────────
// SALES EXECUTIVE ACTIONS
// ────────────────────────────────────────────────────────────

/**
 * POST /api/sales-executive/leads/:leadId/status
 * Change lead status (TALK, INTERESTED, NOT_TALK, DUMPED)
 * Security: Role guard (SALES_EXECUTIVE), User scope (assignedTo), Admin scope
 * Audit: Creates AuditLog, LeadActivity, and LeadAssignmentHistory entry
 */
exports.updateLeadStatus = catchAsync(async (req, res, next) => {
  const { leadId } = req.params;
  const { status } = req.body;
  const { Lead, LeadActivity, LeadAssignmentHistory, AuditLog } = require('../models');

  // Role guard
  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can update lead status', 403));
  }

  // Validate status
  const VALID_STATUSES = ['TALK', 'INTERESTED', 'NOT_TALK', 'DUMPED'];
  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400));
  }

  // Find lead with admin & user scoping
  const lead = await Lead.findOne({
    _id: leadId,
    admin: req.admin._id,
    assignedTo: req.user._id,
    isDeleted: { $ne: true },
  }).populate('client', 'name email mobile companyName');

  if (!lead) {
    return next(new AppError('Lead not found or not assigned to you', 404));
  }

  const clientId = lead.client?._id || lead.client;
  if (!clientId) {
    return next(new AppError('Lead client is missing', 400));
  }

  // Store old status for audit
  const oldStatus = lead.status;
  const statusChanged = oldStatus !== status;

  // Update lead
  lead.status = status;
  lead.lastContactedAt = new Date();

  // Auto-increment notTalkCount if status is NOT_TALK
  if (status === 'NOT_TALK') {
    lead.notTalkCount = (lead.notTalkCount || 0) + 1;
    // Rule: >= 3 not-talks triggers auto-dump
    if (lead.notTalkCount >= 3) {
      lead.isDumped = true;
      lead.dumpReason = 'Auto-dumped: Not talked 3+ times';
      lead.dumpedAt = new Date();
      lead.dumpedBy = req.user._id;
    }
  }

  // Track converted leads
  if (status === 'CONVERTED' && !lead.convertedAt) {
    lead.convertedAt = new Date();
    lead.convertedBy = req.user._id;
  }

  // Increment talkCount if status is TALK
  if (status === 'TALK') {
    lead.talkCount = (lead.talkCount || 0) + 1;
  }

  // Save lead
  await lead.save();

  // Create LeadActivity record (tracks every status change)
  await LeadActivity.create({
    admin: req.admin._id,
    lead: lead._id,
    user: req.user._id,
    status: status,
    comment: req.body.comment || null,
    duration: req.body.duration || 0, // call duration in minutes
  });

  // Create LeadAssignmentHistory entry if status changed
  if (statusChanged) {
    await LeadAssignmentHistory.create({
      admin: req.admin._id,
      lead: lead._id,
      assignedTo: req.user._id,
      assignedBy: lead.assignedBy,
      team: lead.team,
      reason: `Status changed from ${oldStatus} to ${status}`,
      assignedAt: new Date(),
    });
  }

  // Create AuditLog for audit trail
  await AuditLog.create({
    admin: req.admin._id,
    performedBy: req.user._id,
    performerType: 'USER',
    action: 'LEAD_STATUS_CHANGED',
    targetModel: 'Lead',
    targetId: lead._id,
    before: { status: oldStatus },
    after: { status: status },
    ipAddress: getClientIp(req),
    note: `Status changed from ${oldStatus} to ${status}`,
  });

  // Populate response
  const updatedLead = await Lead.findById(lead._id)
    .populate('client', 'name email mobile companyName')
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
    .populate('team', 'name');

  res.status(200).json(
    new ApiResponse(
      200,
      {
        id: updatedLead._id,
        name: updatedLead.client?.name,
        email: updatedLead.client?.email,
        mobile: updatedLead.client?.mobile,
        status: updatedLead.status,
        isDumped: updatedLead.isDumped,
        talkCount: updatedLead.talkCount,
        notTalkCount: updatedLead.notTalkCount,
        convertedAt: updatedLead.convertedAt,
      },
      'Lead status updated successfully'
    )
  );
});

/**
 * POST /api/sales-executive/leads/:leadId/prospect
 * Create or update prospect form for an interested lead
 */
exports.saveLeadProspect = catchAsync(async (req, res, next) => {
  const { leadId } = req.params;
  const {
    contactPerson,
    company,
    value,
    probability,
    expectedClose,
    stage,
    priority,
    requirement,
  } = req.body;
  const { Lead, ProspectForm, LeadActivity, AuditLog } = require('../models');

  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can save prospect forms', 403));
  }

  const lead = await Lead.findOne({
    _id: leadId,
    admin: req.admin._id,
    assignedTo: req.user._id,
    isDeleted: { $ne: true },
  }).populate('client', 'name email mobile companyName');

  if (!lead) {
    return next(new AppError('Lead not found or not assigned to you', 404));
  }

  const clientId = lead.client?._id || lead.client;
  if (!clientId) {
    return next(new AppError('Lead client is missing', 400));
  }

  const contactName = contactPerson?.trim() || lead.client?.name || '';
  const companyName = company?.trim() || lead.client?.companyName || '';
  if (!contactName || !companyName) {
    return next(new AppError('Contact person and company are required', 400));
  }

  const parsedValue = value === '' || value === null || value === undefined ? 0 : Number(value);
  if (Number.isNaN(parsedValue)) {
    return next(new AppError('Prospect value must be a valid number', 400));
  }

  const parsedProbability = probability === '' || probability === null || probability === undefined
    ? 60
    : Number(probability);
  if (Number.isNaN(parsedProbability) || parsedProbability < 0 || parsedProbability > 100) {
    return next(new AppError('Probability must be between 0 and 100', 400));
  }

  const expectedCloseDate = expectedClose ? new Date(expectedClose) : null;
  if (expectedClose && Number.isNaN(expectedCloseDate?.getTime?.())) {
    return next(new AppError('Invalid expected close date', 400));
  }

  const prospectPayload = {
    admin: req.admin._id,
    lead: lead._id,
    client: clientId,
    filledBy: req.user._id,
    updatedBy: req.user._id,
    contactPerson: contactName,
    company: companyName,
    value: parsedValue,
    probability: parsedProbability,
    expectedClose: expectedCloseDate,
    stage: stage?.trim() || 'Interested',
    priority: priority?.trim() || 'Medium',
    requirement: requirement?.trim() || '',
    budget: parsedValue,
    expectedClosing: expectedCloseDate,
    notes: requirement?.trim() || '',
    status: 'OPEN',
  };

  const prospect = await ProspectForm.findOneAndUpdate(
    { admin: req.admin._id, lead: lead._id },
    { $set: prospectPayload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const previousProspectFormId = lead.prospectForm || null;
  lead.status = 'INTERESTED';
  lead.lastContactedAt = new Date();
  lead.prospectForm = prospect._id;
  lead.isDumped = false;
  lead.dumpReason = null;
  lead.dumpedAt = null;
  lead.dumpedBy = null;
  await lead.save();

  await LeadActivity.create({
    admin: req.admin._id,
    lead: lead._id,
    user: req.user._id,
    status: 'INTERESTED',
    comment: requirement?.trim() || null,
    duration: 0,
  });

  await AuditLog.create({
    admin: req.admin._id,
    performedBy: req.user._id,
    performerType: 'USER',
    action: 'PROSPECT_CREATED',
    targetModel: 'ProspectForm',
    targetId: prospect._id,
    before: { prospectForm: previousProspectFormId },
    after: {
      prospectForm: prospect._id,
      leadStatus: lead.status,
    },
    ipAddress: getClientIp(req),
    note: `Prospect created for ${lead.client?.name || 'lead'}`,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        leadId: lead._id,
        status: lead.status,
        isDumped: lead.isDumped,
        prospect: {
          id: prospect._id,
          contactPerson: prospect.contactPerson,
          company: prospect.company,
          value: prospect.value,
          probability: prospect.probability,
          expectedClose: prospect.expectedClose,
          stage: prospect.stage,
          priority: prospect.priority,
          requirement: prospect.requirement,
        },
      },
      'Prospect form saved successfully'
    )
  );
});

/**
 * POST /api/sales-executive/leads/:leadId/comment
 * Add follow-up comment to a lead
 * Security: Role guard, User scope, Admin scope
 * Creates LeadActivity and audit log entry
 */
exports.addLeadComment = catchAsync(async (req, res, next) => {
  const { leadId } = req.params;
  const { comment, nextFollowUpDate } = req.body;
  const { Lead, LeadActivity, AuditLog, Reminder } = require('../models');

  // Role guard
  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can add comments', 403));
  }

  // Validate comment
  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    return next(new AppError('Comment is required and must be non-empty', 400));
  }

  if (comment.trim().length > 1000) {
    return next(new AppError('Comment must not exceed 1000 characters', 400));
  }

  // Find lead
  const lead = await Lead.findOne({
    _id: leadId,
    admin: req.admin._id,
    assignedTo: req.user._id,
    isDeleted: { $ne: true },
  });

  if (!lead) {
    return next(new AppError('Lead not found or not assigned to you', 404));
  }

  // Create LeadActivity record
  const activity = await LeadActivity.create({
    admin: req.admin._id,
    lead: lead._id,
    user: req.user._id,
    status: lead.status,
    comment: comment.trim(),
    duration: 0,
  });

  // Optionally create reminder for follow-up date
  if (nextFollowUpDate) {
    const followUpDate = new Date(nextFollowUpDate);
    if (isNaN(followUpDate.getTime())) {
      return next(new AppError('Invalid follow-up date', 400));
    }

    await Reminder.create({
      admin: req.admin._id,
      user: req.user._id,
      lead: lead._id,
      title: `Follow-up: ${lead.client?.name || 'Client'}`,
      note: comment.trim(),
      remindAt: followUpDate,
      isMissed: false,
      isDone: false,
    });

    lead.followUpAt = followUpDate;
    await lead.save();
  }

  // Audit log
  await AuditLog.create({
    admin: req.admin._id,
    performedBy: req.user._id,
    performerType: 'USER',
    action: 'LEAD_COMMENT_ADDED',
    targetModel: 'Lead',
    targetId: lead._id,
    ipAddress: getClientIp(req),
    note: `Comment added: ${comment.substring(0, 50)}...`,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        activityId: activity._id,
        leadId: lead._id,
        comment: activity.comment,
        status: activity.status,
        createdAt: activity.createdAt,
        followUpAt: lead.followUpAt,
      },
      'Comment added successfully'
    )
  );
});

/**
 * POST /api/sales-executive/leads/:leadId/reminder
 * Set or update reminder/follow-up date for a lead
 * Security: Role guard, User scope, Admin scope
 * Creates Reminder record
 */
exports.setLeadReminder = catchAsync(async (req, res, next) => {
  const { leadId } = req.params;
  const { reminderDate, description } = req.body;
  const { Lead, Reminder, AuditLog } = require('../models');

  // Role guard
  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can set reminders', 403));
  }

  // Validate reminder date
  if (!reminderDate) {
    return next(new AppError('Reminder date is required', 400));
  }

  const reminderDateTime = new Date(reminderDate);
  if (isNaN(reminderDateTime.getTime())) {
    return next(new AppError('Invalid reminder date format', 400));
  }

  if (reminderDateTime <= new Date()) {
    return next(new AppError('Reminder date must be in the future', 400));
  }

  if (description && description.length > 500) {
    return next(new AppError('Description must not exceed 500 characters', 400));
  }

  // Find lead
  const lead = await Lead.findOne({
    _id: leadId,
    admin: req.admin._id,
    assignedTo: req.user._id,
    isDeleted: { $ne: true },
  }).populate('client', 'name email mobile');

  if (!lead) {
    return next(new AppError('Lead not found or not assigned to you', 404));
  }

  // Create reminder
  const reminder = await Reminder.create({
    admin: req.admin._id,
    user: req.user._id,
    lead: lead._id,
    title: `Follow-up: ${lead.client?.name || 'Client'}`,
    note: description || `Reminder for lead follow-up`,
    remindAt: reminderDateTime,
    isMissed: false,
    isDone: false,
  });

  // Update lead with follow-up date
  lead.followUpAt = reminderDateTime;
  await lead.save();

  // Audit log
  await AuditLog.create({
    admin: req.admin._id,
    performedBy: req.user._id,
    performerType: 'USER',
    action: 'LEAD_REMINDER_SET',
    targetModel: 'Lead',
    targetId: lead._id,
    ipAddress: getClientIp(req),
    note: `Reminder set for ${reminderDateTime.toISOString()}`,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        reminderId: reminder._id,
        leadId: lead._id,
        reminderDate: reminder.remindAt,
        description: reminder.note,
        createdAt: reminder.createdAt,
      },
      'Reminder set successfully'
    )
  );
});

/**
 * GET /api/sales-executive/leads/dump
 * Fetch dump leads that belong to the current Sales Executive (assignedTo = me)
 * Scoped strictly to: admin (tenant) + assignedTo (this executive)
 * Returns: stats + paginated dump leads with client info, dump metadata
 */
exports.getMyDumpLeads = catchAsync(async (req, res, next) => {
  const { Lead } = require('../models');

  // Role guard — only Sales Executive
  if (req.user?.role !== 'SALES_EXECUTIVE') {
    return next(new AppError('Only Sales Executives can access this resource', 403));
  }

  // Parse optional query params
  const page     = Math.max(1, parseInt(req.query.page)     || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
  const search   = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const reason   = typeof req.query.reason === 'string' ? req.query.reason.trim() : '';
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
  const dateTo   = req.query.dateTo   ? new Date(req.query.dateTo)   : null;

  // ── Core filter: tenant + this executive + dumped ──
  const baseFilter = {
    admin:      req.admin._id,
    assignedTo: req.user._id,
    isDumped:   true,
    isDeleted:  { $ne: true },
  };

  // Optional date range on dumpedAt
  if (dateFrom || dateTo) {
    baseFilter.dumpedAt = {};
    if (dateFrom) baseFilter.dumpedAt.$gte = dateFrom;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      baseFilter.dumpedAt.$lte = end;
    }
  }

  // Optional dump reason filter
  if (reason) {
    baseFilter.dumpReason = { $regex: reason, $options: 'i' };
  }

  // Fetch all matching dump leads (we need client data for search)
  const rawLeads = await Lead.find(baseFilter)
    .populate({ path: 'client', select: 'name email mobile companyName' })
    .populate('dumpedBy', 'name role')
    .populate('assignedBy', 'name role')
    .populate('team', 'name')
    .sort({ dumpedAt: -1 })
    .lean();

  // Apply client-level search (name / mobile / email / company)
  let filtered = rawLeads;
  if (search) {
    const q = search.toLowerCase();
    filtered = rawLeads.filter((l) => {
      const c = l.client || {};
      return (
        (c.name        || '').toLowerCase().includes(q) ||
        (c.mobile      || '').toLowerCase().includes(q) ||
        (c.email       || '').toLowerCase().includes(q) ||
        (c.companyName || '').toLowerCase().includes(q)
      );
    });
  }

  // ── Stats (computed from full filtered set, before pagination) ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDump    = filtered.length;
  const noResponse   = filtered.filter((l) =>
    (l.dumpReason || '').toLowerCase().includes('no response') ||
    (l.dumpReason || '').toLowerCase().includes('not talk')
  ).length;
  const todayDumped  = filtered.filter((l) => {
    if (!l.dumpedAt) return false;
    const d = new Date(l.dumpedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  // ── Pagination ──
  const totalRecords = filtered.length;
  const totalPages   = Math.ceil(totalRecords / pageSize) || 1;
  const safePage     = Math.min(page, totalPages);
  const skip         = (safePage - 1) * pageSize;
  const paginated    = filtered.slice(skip, skip + pageSize);

  // ── Transform to flat response shape ──
  const leads = paginated.map((l) => ({
    id:          l._id,
    name:        l.client?.name        || '',
    email:       l.client?.email       || '',
    mobile:      l.client?.mobile      || '',
    companyName: l.client?.companyName || '',
    dumpReason:  l.dumpReason          || 'Not specified',
    dumpedBy:    l.dumpedBy?.name      || 'System',
    dumpedByRole:l.dumpedBy?.role      || null,
    dumpDate:    l.dumpedAt
      ? new Date(l.dumpedAt).toISOString().split('T')[0]
      : null,
    assignedBy:  l.assignedBy?.name    || null,
    team:        l.team?.name          || null,
    notTalkCount:l.notTalkCount        || 0,
    talkCount:   l.talkCount           || 0,
    lastContactedAt: l.lastContactedAt
      ? new Date(l.lastContactedAt).toISOString().split('T')[0]
      : null,
    // Restore is Manager/Admin only — surface this flag so frontend can show correct UI
    canRestore:  false,
  }));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        leads,
        stats: {
          totalDump,
          noResponse,
          todayDumped,
          // Restore is Manager/Admin only — not available to Sales Executive
          restoreAccess: 'Manager',
        },
        pagination: {
          page:         safePage,
          pageSize,
          totalRecords,
          totalPages,
        },
      },
      'Dump leads retrieved successfully'
    )
  );
});

/**
 * Helper: Get client IP address
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};
