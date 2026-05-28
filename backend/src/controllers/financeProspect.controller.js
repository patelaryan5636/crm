"use strict";

const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/apiResponse");
const AppError = require("../utils/appError");

const toDisplayLeadStatus = (status, isDumped = false) => {
  if (isDumped) return "Dumped";
  if (!status) return "Untouched";
  const normalized = String(status).toUpperCase();
  const map = {
    NOT_TALK: "Not Talk",
    INTERESTED: "Interested",
    TALK: "Talk",
    CONVERTED: "Converted",
    DUMP: "Dumped",
    UNTOUCHED: "Untouched",
  };
  return map[normalized] || status;
};

const formatForFrontend = (p) => {
  const client = p.client || {};
  const filledBy = p.filledBy || {};

  const suggestedServices = (p.suggestedServices || []).map(s => s.name).join(', ');

  return {
    id: p._id,
    clientId: client._id || p.client,
    client: client.name || p.contactPerson || '',
    mobile: client.mobile || '',
    email: client.email || '',
    suggestedServices: suggestedServices || p.requirement || '',
    suggestedAmount: p.value ?? p.totalAmount ?? 0,
    salesExec: filledBy.name || '',
    status: toDisplayLeadStatus(p.lead?.status, Boolean(p.lead?.isDumped)),
    rawStatus: p.status,
    priority: p.priority,
    requirement: p.requirement,
    prospectStage: p.stage,
    createdAt: p.createdAt,
  };
};

/**
 * GET /api/finance/prospects
 * Returns prospect forms for finance department (tenant-scoped)
 */
exports.getProspects = catchAsync(async (req, res, next) => {
  const { ProspectForm } = require("../models");

  // Role guard: finance roles only
  const allowed = ["FINANCE_MANAGER", "FINANCE_EXECUTIVE"];
  if (!req.user || !allowed.includes(req.user.role)) {
    return next(new AppError('Only Finance users can access prospects', 403));
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 25);
  const skip = (page - 1) * limit;

  const q = { admin: req.admin._id };
  if (req.query.status) q.status = req.query.status;

  if (req.query.search) {
    const term = req.query.search.trim();
    q.$or = [
      { contactPerson: { $regex: term, $options: 'i' } },
      { company: { $regex: term, $options: 'i' } },
    ];
  }

  const [total, rows] = await Promise.all([
    ProspectForm.countDocuments(q),
    ProspectForm.find(q)
      .populate('client', 'name email mobile companyName')
      .populate('filledBy', 'name email')
      .populate({ path: 'lead', select: 'status isDumped' })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const mapped = rows.map(formatForFrontend);

  const stats = {
    total,
    sentToFinance: mapped.filter(r => r.rawStatus === 'SENT_TO_FINANCE').length,
    open: mapped.filter(r => r.rawStatus === 'OPEN').length,
    inNegotiation: mapped.filter(r => r.rawStatus === 'IN_NEGOTIATION').length,
  };

  res.status(200).json(new ApiResponse(200, { prospects: mapped, stats, page, limit }, 'Finance prospects retrieved'));
});
