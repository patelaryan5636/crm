'use strict';

const { Lead, ProspectForm, Payment, SalesTarget, User } = require("../models/index");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/appError");
const ApiResponse = require("../utils/apiResponse");
const mongoose   = require("mongoose");

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  UNTOUCHED: "New",
  TALK:      "Contacted",
  NOT_TALK:  "Not Interested",
  INTERESTED:"Interested",
  CONVERTED: "Won",
  DUMP:      "Lost",
};
const mapStatus = (s) => STATUS_MAP[s] || s;

const generateAvatar = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].charAt(0).toUpperCase()
    : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDateShort = (date) => {
  if (!date) return "—";
  const d   = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString())       return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const startOfDay = (d = new Date()) => {
  const x = new Date(d); x.setHours(0,0,0,0); return x;
};

// ─── GET /api/admin/leads  (ALL active leads) ─────────────────────────────────

exports.getAdminLeads = catchAsync(async (req, res, next) => {
  const adminId = req.admin._id;

  // Optional filters from query
  const { status, source, search, assignedTo } = req.query;

  const query = { admin: adminId, isDumped: false };
  if (status && status !== "All") {
    const reverseMap = Object.entries(STATUS_MAP).find(([, v]) => v === status);
    if (reverseMap) query.status = reverseMap[0];
  }

  const leads = await Lead.find(query)
    .populate("client", "name email mobile source")
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  // Filter by assignedTo name if provided
  let filtered = leads;
  if (assignedTo && assignedTo !== "All Owners") {
    filtered = leads.filter(l => l.assignedTo?.name === assignedTo);
  }
  if (source && source !== "All Sources") {
    filtered = filtered.filter(l => (l.client?.source || "Manual") === source);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(l =>
      (l.client?.name || "").toLowerCase().includes(q) ||
      (l.client?.mobile || "").includes(q) ||
      (l.client?.email || "").toLowerCase().includes(q)
    );
  }

  // Get prospect values
  const leadIds = filtered.map(l => l._id);
  const prospectForms = await ProspectForm.find({
    admin: adminId, lead: { $in: leadIds },
  }).select("lead value").lean();
  const valueMap = {};
  prospectForms.forEach(f => { valueMap[f.lead.toString()] = f.value; });

  const today = startOfDay();
  let newToday = 0, hotLeads = 0, converted = 0;

  const formattedLeads = filtered.map(lead => {
    const clientName = lead.client?.name || "Unknown";
    const st = mapStatus(lead.status);
    if (new Date(lead.createdAt) >= today) newToday++;
    if (["Interested", "Proposal"].includes(st)) hotLeads++;
    if (st === "Won") converted++;

    return {
      id:          lead._id.toString(),
      name:        clientName,
      mobile:      lead.client?.mobile || "N/A",
      email:       lead.client?.email  || "N/A",
      source:      lead.client?.source || "Manual",
      status:      st,
      owner:       lead.assignedTo?.name || "Unassigned",
      assignedBy:  lead.assignedBy?.name || "—",
      value:       valueMap[lead._id.toString()] != null
        ? `₹${Number(valueMap[lead._id.toString()]).toLocaleString("en-IN")}` : "N/A",
      lastContact: formatDateShort(lead.lastContactedAt),
      nextFollowup: formatDateShort(lead.followUpAt),
      talkCount:   lead.talkCount   || 0,
      createdAt:   lead.createdAt,
      avatar:      generateAvatar(clientName),
    };
  });

  const stats = {
    totalLeads: formattedLeads.length,
    newToday,
    hotLeads,
    converted,
  };

  // Unique owners and sources for filter dropdowns
  const owners  = [...new Set(leads.map(l => l.assignedTo?.name).filter(Boolean))];
  const sources = [...new Set(leads.map(l => l.client?.source).filter(Boolean))];

  return res.status(200).json(new ApiResponse(200,
    { leads: formattedLeads, stats, filters: { owners, sources } },
    "Leads fetched successfully",
  ));
});

// ─── GET /api/admin/leads/prospects ──────────────────────────────────────────

exports.getAdminProspects = catchAsync(async (req, res, next) => {
  const adminId = req.admin._id;

  const forms = await ProspectForm.find({ admin: adminId })
    .populate("lead", "status client assignedTo")
    .populate({
      path: "lead",
      populate: [
        { path: "client",     select: "name email mobile" },
        { path: "assignedTo", select: "name role" },
      ],
    })
    .populate("filledBy", "name role")
    .sort({ createdAt: -1 })
    .lean();

  let totalPipeline = 0, hotCount = 0, warmCount = 0;

  const formatted = forms.map(f => {
    const clientName = f.lead?.client?.name || f.contactPerson || "Unknown";
    const assignedTo = f.lead?.assignedTo;
    const budget     = f.value || f.proposedBudget || 0;

    totalPipeline += budget;

    // Determine heat based on lead status
    const leadStatus = f.lead?.status;
    let heat = "Warm";
    if (leadStatus === "CONVERTED")  heat = "Won";
    else if (leadStatus === "INTERESTED") heat = "Hot";
    else if (leadStatus === "TALK")  heat = "Warm";
    else if (leadStatus === "DUMP")  heat = "Cold";

    if (heat === "Hot")  hotCount++;
    if (heat === "Warm") warmCount++;

    return {
      id:          f._id.toString(),
      name:        clientName,
      mobile:      f.lead?.client?.mobile || f.contactPhone || "N/A",
      email:       f.lead?.client?.email  || f.contactEmail || "N/A",
      service:     f.serviceRequired || f.productInterested || "—",
      budget:      `₹${Number(budget).toLocaleString("en-IN")}`,
      budgetRaw:   budget,
      assignedTo:  assignedTo?.name || "—",
      assignedRole:assignedTo?.role?.replace("SALES_", "") || "—",
      filledBy:    f.filledBy?.name || "—",
      status:      heat,
      leadStatus:  mapStatus(f.lead?.status || ""),
      notes:       f.notes || "",
      createdAt:   f.createdAt,
      avatar:      generateAvatar(clientName),
    };
  });

  const stats = {
    total:        formatted.length,
    totalPipeline:`₹${Number(totalPipeline).toLocaleString("en-IN")}`,
    hotCount,
    warmCount,
    coldCount:    formatted.filter(f => f.status === "Cold").length,
    wonCount:     formatted.filter(f => f.status === "Won").length,
  };

  return res.status(200).json(new ApiResponse(200,
    { prospects: formatted, stats },
    "Prospects fetched successfully",
  ));
});

// ─── GET /api/admin/leads/followups ──────────────────────────────────────────

exports.getAdminFollowUps = catchAsync(async (req, res, next) => {
  const adminId = req.admin._id;
  const now     = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = new Date(todayStart); todayEnd.setHours(23, 59, 59, 999);

  // Leads with a followUpAt set (pending follow-ups)
  const leads = await Lead.find({
    admin: adminId,
    isDumped: false,
    followUpAt: { $ne: null },
  })
    .populate("client", "name email mobile")
    .populate("assignedTo", "name role")
    .sort({ followUpAt: 1 })
    .lean();

  let dueToday = 0, overdue = 0, upcoming = 0, completed = 0;

  const formatted = leads.map(l => {
    const clientName = l.client?.name || "Unknown";
    const fDate      = new Date(l.followUpAt);
    let followUpStatus = "Upcoming";

    if (l.followUpMissed || fDate < todayStart) {
      followUpStatus = "Overdue"; overdue++;
    } else if (fDate <= todayEnd) {
      followUpStatus = "Due Today"; dueToday++;
    } else {
      upcoming++;
    }

    return {
      id:             l._id.toString(),
      name:           clientName,
      mobile:         l.client?.mobile || "N/A",
      email:          l.client?.email  || "N/A",
      assignedTo:     l.assignedTo?.name || "Unassigned",
      assignedRole:   (l.assignedTo?.role || "").replace("SALES_", ""),
      leadStatus:     mapStatus(l.status),
      followUpAt:     l.followUpAt,
      followUpDate:   formatDateShort(l.followUpAt),
      followUpStatus,
      talkCount:      l.talkCount || 0,
      notTalkCount:   l.notTalkCount || 0,
      lastContact:    formatDateShort(l.lastContactedAt),
      avatar:         generateAvatar(clientName),
    };
  });

  const stats = { total: formatted.length, dueToday, overdue, upcoming };

  return res.status(200).json(new ApiResponse(200,
    { followUps: formatted, stats },
    "Follow-ups fetched successfully",
  ));
});

// ─── GET /api/admin/leads/dump ───────────────────────────────────────────────

exports.getAdminDump = catchAsync(async (req, res, next) => {
  const adminId = req.admin._id;

  const leads = await Lead.find({
    admin: adminId,
    $or: [{ isDumped: true }, { status: "DUMP" }],
  })
    .populate("client", "name email mobile source")
    .populate("assignedTo", "name role")
    .sort({ dumpedAt: -1, createdAt: -1 })
    .lean();

  let thisMonth = 0, notTalkDump = 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const formatted = leads.map(l => {
    const clientName = l.client?.name || "Unknown";
    const dumpDate   = l.dumpedAt || l.createdAt;
    if (new Date(dumpDate) >= monthStart) thisMonth++;
    if (l.dumpReason === "NOT_TALK_EXCEEDED" || l.notTalkCount >= 3) notTalkDump++;

    return {
      id:           l._id.toString(),
      name:         clientName,
      mobile:       l.client?.mobile || "N/A",
      email:        l.client?.email  || "N/A",
      source:       l.client?.source || "Manual",
      assignedTo:   l.assignedTo?.name || "Unassigned",
      dumpReason:   l.dumpReason || "Manually Dumped",
      notTalkCount: l.notTalkCount || 0,
      dumpedAt:     formatDateShort(dumpDate),
      dumpedAtRaw:  dumpDate,
      avatar:       generateAvatar(clientName),
    };
  });

  const stats = {
    total:    formatted.length,
    thisMonth,
    notTalkDump,
    manualDump: formatted.length - notTalkDump,
  };

  return res.status(200).json(new ApiResponse(200,
    { leads: formatted, stats },
    "Dump data fetched successfully",
  ));
});

// ─── GET /api/admin/sales/analytics ──────────────────────────────────────────

exports.getAdminSalesAnalytics = catchAsync(async (req, res, next) => {
  const adminId     = req.admin._id;
  const mongoAdminId = new mongoose.Types.ObjectId(adminId);
  const now         = new Date();
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalLeads, convertedLeads, prospectsThisMonth,
    revenueAgg, revenueThisMonthAgg, monthlyRevenueAgg,
    sourceAgg, statusAgg,
  ] = await Promise.all([
    Lead.countDocuments({ admin: adminId, isDumped: false }),
    Lead.countDocuments({ admin: adminId, status: "CONVERTED" }),
    ProspectForm.countDocuments({ admin: adminId, createdAt: { $gte: monthStart } }),
    Payment.aggregate([
      { $match: { admin: mongoAdminId, status: "SUCCESS" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { admin: mongoAdminId, status: "SUCCESS", paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { admin: mongoAdminId, status: "SUCCESS", paidAt: { $type: "date" } } },
      { $project: { month: { $month: "$paidAt" }, year: { $year: "$paidAt" }, amount: 1 } },
      { $match: { year: now.getFullYear() } },
      { $group: { _id: "$month", total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
    Lead.aggregate([
      { $match: { admin: mongoAdminId } },
      { $lookup: { from: "clients", localField: "client", foreignField: "_id", as: "client" } },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$client.source", count: { $sum: 1 } } },
      { $project: { _id: 0, name: { $ifNull: ["$_id", "Manual"] }, value: "$count" } },
      { $sort: { value: -1 } },
    ]),
    Lead.aggregate([
      { $match: { admin: mongoAdminId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: "$count" } },
    ]),
  ]);

  const totalRevenue      = revenueAgg[0]?.total || 0;
  const revenueThisMonth  = revenueThisMonthAgg[0]?.total || 0;
  const conversionRate    = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

  // Monthly revenue trend (₹ in thousands)
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueTrend = MONTHS.map((name, idx) => {
    const found = monthlyRevenueAgg.find(m => m._id === idx + 1);
    return { name, revenue: found ? Math.round(found.total / 1000) : 0 };
  });

  // Status labels
  const statusLabelMap = {
    UNTOUCHED: "New", TALK: "Contacted", NOT_TALK: "Not Interested",
    INTERESTED: "Interested", CONVERTED: "Won", DUMP: "Lost",
  };
  const statusData = statusAgg.map(s => ({
    name: statusLabelMap[s.name] || s.name, value: s.value,
  }));

  // Funnel
  const funnelOrder  = ["New","Contacted","Interested","Proposal","Won"];
  const statusTotals = {};
  statusData.forEach(s => { statusTotals[s.name] = s.value; });
  const funnelTotal = totalLeads || 1;
  const funnelStages = funnelOrder.map(stage => ({
    stage,
    count: statusTotals[stage] || 0,
    pct:   Math.round(((statusTotals[stage] || 0) / funnelTotal) * 100),
  }));

  // Top performers (Sales Executives by CONVERTED leads)
  const sePerf = await Lead.aggregate([
    { $match: { admin: mongoAdminId, status: "CONVERTED" } },
    { $group: { _id: "$assignedTo", dealsWon: { $sum: 1 } } },
    { $sort: { dealsWon: -1 } },
    { $limit: 10 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, name: { $ifNull: ["$user.name", "Unknown"] }, role: "$user.role", deals: "$dealsWon" } },
  ]);

  const maxDeals = sePerf[0]?.deals || 1;
  const topPerformers = sePerf.map(p => ({
    name:    p.name,
    role:    (p.role || "").replace("SALES_", ""),
    deals:   p.deals,
    revenue: "—",
    pct:     Math.round((p.deals / maxDeals) * 100),
  }));

  // Team radar — by role group
  const roleGroups = await Lead.aggregate([
    { $match: { admin: mongoAdminId } },
    { $lookup: { from: "users", localField: "assignedTo", foreignField: "_id", as: "user" } },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    { $group: {
      _id:       "$user.role",
      total:     { $sum: 1 },
      converted: { $sum: { $cond: [{ $eq: ["$status", "CONVERTED"] }, 1, 0] } },
      contacted: { $sum: { $cond: [{ $eq: ["$status", "TALK"] },      1, 0] } },
    }},
  ]);

  const kpiData = {
    totalLeads,
    convertedLeads,
    conversionRate:   `${conversionRate}%`,
    totalRevenue:     `₹${Number(totalRevenue).toLocaleString("en-IN")}`,
    revenueThisMonth: `₹${Number(revenueThisMonth).toLocaleString("en-IN")}`,
    prospectsThisMonth,
  };

  return res.status(200).json(new ApiResponse(200, {
    kpiData, revenueTrend, sourceData: sourceAgg,
    statusData, funnelStages, topPerformers, roleGroups,
  }, "Sales analytics fetched"));
});

// ─── GET /api/admin/sales/targets ────────────────────────────────────────────

exports.getAdminTargets = catchAsync(async (req, res, next) => {
  const adminId = req.admin._id;
  const month   = parseInt(req.query.month) || (new Date().getMonth() + 1);
  const year    = parseInt(req.query.year)  || new Date().getFullYear();

  const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const to   = new Date(year, month,     0, 23, 59, 59, 999);

  const targets = await SalesTarget.find({
    admin: adminId,
    fromDate: { $gte: from },
    toDate:   { $lte: to },
  })
    .populate("user",  "name role email")
    .populate("setBy", "name role")
    .sort({ createdAt: -1 })
    .lean();

  let completed = 0, inProgress = 0, pending = 0, overdue = 0;

  const computeStatus = (tgt) => {
    const salesPct = tgt.targetSales > 0 ? (tgt.achievedSales / tgt.targetSales) * 100 : 0;
    const callsPct = tgt.targetCalls > 0 ? (tgt.achievedCalls / tgt.targetCalls) * 100 : 0;
    const avgPct   = (salesPct + callsPct) / (tgt.targetSales > 0 && tgt.targetCalls > 0 ? 2 : 1);

    if (avgPct >= 100) return 'Completed';
    if (avgPct > 0)    return 'In Progress';
    if (new Date() > new Date(tgt.toDate)) return 'Overdue';
    return 'Pending';
  };

  const formatted = targets.map(t => {
    const status = computeStatus(t);
    if (status === "Completed")  completed++;
    else if (status === "In Progress") inProgress++;
    else if (status === "Overdue")     overdue++;
    else pending++;

    const callPct  = t.targetCalls > 0 ? Math.min(100, Math.round((t.achievedCalls  / t.targetCalls)  * 100)) : 0;
    const salesPct = t.targetSales > 0 ? Math.min(100, Math.round((t.achievedSales / t.targetSales) * 100)) : 0;
    const overallPct = Math.round((callPct + salesPct) / 2);

    const mVal = new Date(t.fromDate).getMonth() + 1;
    const yVal = new Date(t.fromDate).getFullYear();

    return {
      id:             t._id.toString(),
      memberName:     t.user?.name   || "—",
      memberRole:     (t.user?.role  || "").replace("SALES_", ""),
      setBy:          t.setBy?.name  || "—",
      month:          mVal,
      year:           yVal,
      period:         `${["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][mVal]} ${yVal}`,
      targetCalls:    t.targetCalls,
      achievedCalls:  t.achievedCalls,
      remainingCalls: Math.max(0, t.targetCalls  - t.achievedCalls),
      targetSales:    t.targetSales,
      achievedSales:  t.achievedSales,
      remainingSales: Math.max(0, t.targetSales - t.achievedSales),
      callPct,
      salesPct,
      overallPct,
      status,
      notes:          t.notes || "",
    };
  });

  const stats = {
    total:      formatted.length,
    completed,
    inProgress,
    pending,
    overdue,
    avgProgress: formatted.length > 0
      ? Math.round(formatted.reduce((s, t) => s + t.overallPct, 0) / formatted.length) : 0,
  };

  // Comparison chart data for GBarChart
  const chartData = formatted.map(t => ({
    name:        t.memberName,
    targetCalls: t.targetCalls,
    calls:       t.achievedCalls,
    targetSales: t.targetSales,
    sales:       t.achievedSales,
  }));

  return res.status(200).json(new ApiResponse(200,
    { targets: formatted, stats, chartData },
    "Admin sales targets fetched",
  ));
});
