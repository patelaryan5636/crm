"use strict";

const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { sendProspectQuotationEmail } = require('../services/email.service');

const normalizeCurrency = (value) => Number(value || 0);

const mapRequirements = (prospect) => {
  const fromFinal = (prospect.finalServices || []).map((item) => ({
    id: item._id || `${item.name}-${item.price}`,
    title: item.name || 'Service',
    cost: normalizeCurrency(item.price) * Math.max(1, Number(item.qty || 1)),
    description: item.discount ? `Discount: ${item.discount}` : '',
  }));

  if (fromFinal.length > 0) return fromFinal;

  const fromSuggested = (prospect.suggestedServices || []).map((item) => ({
    id: item._id || `${item.name}-${item.price}`,
    title: item.name || 'Service',
    cost: normalizeCurrency(item.price) * Math.max(1, Number(item.qty || 1)),
    description: '',
  }));

  if (fromSuggested.length > 0) return fromSuggested;

  if (prospect.requirement) {
    return [{
      id: String(prospect._id),
      title: prospect.requirement,
      cost: normalizeCurrency(prospect.value),
      description: prospect.notes || '',
    }];
  }

  return [];
};

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
  const requirements = mapRequirements(p);
  const selectedService = (p.finalServices || p.suggestedServices || []).map((s) => s.name).filter(Boolean).join(', ');

  return {
    id: p._id,
    clientId: client._id || p.client,
    client: client.name || p.contactPerson || '',
    mobile: client.mobile || '',
    email: client.email || '',
    suggestedServices: selectedService || p.requirement || '',
    suggestedAmount: p.finalAmount ?? p.totalAmount ?? p.value ?? 0,
    salesExec: filledBy.name || '',
    status: toDisplayLeadStatus(p.lead?.status, Boolean(p.lead?.isDumped)),
    rawStatus: p.status,
    priority: p.priority,
    requirement: p.requirement,
    prospectStage: p.stage,
    requirements,
    selectedService,
    termsAndConditions: p.notes || '',
    discountValue: p.discount ?? 0,
    discountMode: p.discount ? 'Rupees' : 'None',
    paymentStatus: p.finalAmount > 0 ? 'Unpaid' : 'Unpaid',
    advanceAmount: p.totalAmount ? String(Math.max(0, p.totalAmount - p.finalAmount)) : '',
    advancePayments: [],
    totalCost: p.totalAmount ?? p.value ?? 0,
    netPayable: p.finalAmount ?? p.totalAmount ?? p.value ?? 0,
    sentToClientAt: p.sentToClientAt || null,
    sentToClientBy: p.sentToClientBy || null,
    clientEmailStatus: p.clientEmailStatus || 'PENDING',
    clientEmailMessageId: p.clientEmailMessageId || null,
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

/**
 * POST /api/finance/prospects/:prospectId/send
 * Persist finance quote details and send the quotation email to the client.
 */
exports.sendToClient = catchAsync(async (req, res, next) => {
  const { ProspectForm, Lead } = require('../models');

  const allowed = ['FINANCE_MANAGER', 'FINANCE_EXECUTIVE'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return next(new AppError('Only Finance users can send quotations', 403));
  }

  const { prospectId } = req.params;
  const {
    status,
    selectedService,
    requirements = [],
    termsAndConditions = '',
    discountMode = 'None',
    discountValue = '',
    paymentStatus = 'Unpaid',
    advanceAmount = '',
    advancePayments = [],
    notInterestedReason = '',
    conversationNotes = '',
    notTalkReason = '',
  } = req.body || {};

  const prospect = await ProspectForm.findOne({
    _id: prospectId,
    admin: req.admin._id,
  }).populate('client', 'name email mobile companyName').populate('filledBy', 'name email role');

  if (!prospect) {
    return next(new AppError('Prospect not found', 404));
  }

  const normalizedStatus = String(status || 'Interested').trim();
  const validStatuses = ['Interested', 'Not Interested', 'Talk', 'Not Talk'];
  if (!validStatuses.includes(normalizedStatus)) {
    return next(new AppError('Invalid client status', 400));
  }

  const structuredRequirements = Array.isArray(requirements)
    ? requirements
        .map((item) => ({
          title: String(item?.title || '').trim(),
          cost: Number(item?.cost || 0),
          description: String(item?.description || '').trim(),
        }))
        .filter((item) => item.title)
    : [];

  const baseCost = structuredRequirements.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const discountModeValue = String(discountMode || 'None');
  const discountRaw = Number(discountValue || 0);
  const discountAmount = discountModeValue === 'Percentage'
    ? Math.round((baseCost * Math.min(discountRaw, 99.99)) / 100)
    : discountModeValue === 'Rupees'
      ? Math.min(discountRaw, baseCost)
      : 0;
  const finalAmount = Math.max(0, baseCost - discountAmount);

  const finalServices = structuredRequirements.map((item) => ({
    name: item.title,
    price: item.cost,
    qty: 1,
    discount: 0,
  }));

  const leadStatusMap = {
    Interested: 'INTERESTED',
    Talk: 'TALK',
    'Not Interested': 'NOT_TALK',
    'Not Talk': 'NOT_TALK',
  };

  prospect.status = 'SENT_TO_FINANCE';
  prospect.finalServices = finalServices;
  prospect.totalAmount = baseCost;
  prospect.discount = discountAmount;
  prospect.finalAmount = finalAmount;
  prospect.paymentType = Number(advanceAmount || 0) > 0 || advancePayments.length > 0 ? 'PARTIAL' : 'FULL';
  prospect.paymentStatus = 'PENDING';
  prospect.paymentMethod = null;
  prospect.stage = normalizedStatus;
  prospect.priority = prospect.priority || 'Medium';
  prospect.notes = termsAndConditions?.trim() || prospect.notes || '';
  prospect.updatedBy = req.user._id;
  prospect.sentToClientAt = new Date();
  prospect.sentToClientBy = req.user._id;
  prospect.clientEmailStatus = 'PENDING';
  prospect.clientEmailMessageId = null;
  prospect.clientEmailError = null;
  prospect.requirement = notInterestedReason || conversationNotes || notTalkReason || prospect.requirement || '';
  await prospect.save();

  const lead = await Lead.findOne({ _id: prospect.lead, admin: req.admin._id });
  if (lead) {
    lead.status = leadStatusMap[normalizedStatus] || 'INTERESTED';
    lead.lastContactedAt = new Date();
    await lead.save();
  }

  let emailResult = null;
  try {
    const recipientEmail = String(prospect.client?.email || '').trim();
    if (!recipientEmail) {
      throw new AppError('Client email is missing. Please update the client record before sending the quotation.', 400);
    }

    emailResult = await sendProspectQuotationEmail({
      email: recipientEmail,
      clientName: prospect.client.name || 'Client',
      companyName: prospect.client.companyName || prospect.company || '',
      serviceName: selectedService || finalServices[0]?.name || 'Custom package',
      requirements: structuredRequirements,
      baseCost,
      discountAmount,
      finalAmount,
      paymentStatus,
      termsAndConditions,
    });

    prospect.clientEmailStatus = 'SENT';
    prospect.clientEmailMessageId = emailResult.messageId || null;
    prospect.clientEmailError = null;
    await prospect.save();
  } catch (error) {
    prospect.clientEmailStatus = 'FAILED';
    prospect.clientEmailError = error.message;
    await prospect.save();
    return next(new AppError(error.message || 'Failed to send quotation email', 502));
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        prospect: formatForFrontend({
          ...prospect.toObject(),
          client: prospect.client,
          filledBy: prospect.filledBy,
          lead: lead || prospect.lead,
        }),
        email: emailResult ? { success: true, messageId: emailResult.messageId || null } : { success: false },
      },
      'Quotation sent to client successfully'
    )
  );
});
