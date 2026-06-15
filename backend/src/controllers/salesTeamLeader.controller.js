"use strict";

const {
  Lead,
  LeadAssignmentHistory,
  Team,
  ProspectForm,
  Reminder,
  AuditLog,
} = require("../models");
const bulkLeadUploadService = require("../services/bulkLeadUpload.service");
const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/apiResponse");

/**
 * GET /api/sales-team-leader/workspace
 * Returns all data required for the Sales TL Dashboard in one request.
 */
exports.getWorkspace = catchAsync(async (req, res) => {
  const adminId = req.admin._id;
  const userId = req.user._id;

  // 1. Resolve the TL's Team (Gracefully handle if none exists)
  const team = await Team.findOne({
    admin: adminId,
    leader: userId,
    isDeleted: false,
  });
  const memberIds = team ? team.members.map((m) => m.user).filter(Boolean) : [];

  // 2. Fetch Pool (Leads assigned directly to the TL OR assigned to their team but no specific member)
  const poolQuery = {
    admin: adminId,
    $or: [{ assignedTo: userId }],
    isDeleted: { $ne: true },
    isDumped: { $ne: true },
  };

  // If the TL has a team, also include leads assigned to that team but not yet to a specific member
  if (team?._id) {
    poolQuery.$or.push({ team: team._id, assignedTo: null });
  }

  // 3. Fetch Assigned (Leads assigned to members of this team, excluding the TL themselves)
  // If no team, this will naturally be empty
  const assignedQuery = {
    admin: adminId,
    assignedTo: {
      $in: memberIds.filter((id) => String(id) !== String(userId)),
    },
    isDeleted: { $ne: true },
    isDumped: { $ne: true },
  };

  // Only run assigned query if there are members
  const fetchAssigned =
    memberIds.length > 0
      ? Lead.find(assignedQuery)
          .populate({ path: "client", select: "name email mobile companyName" })
          .populate("assignedTo", "name email role")
          .populate("assignedBy", "name")
          .populate("team", "name")
          .sort({ updatedAt: -1 })
      : Promise.resolve([]);

  const [poolLeads, assignedLeads, targets] = await Promise.all([
    Lead.find(poolQuery)
      .populate({ path: "client", select: "name email mobile companyName" })
      .populate("assignedBy", "name")
      .populate("team", "name")
      .sort({ createdAt: -1 }),
    fetchAssigned,
    bulkLeadUploadService
      .getAssignmentTargets(adminId, req.user, "SALES_EXECUTIVE")
      .catch(() => ({ targets: [] })),
  ]);

  // Shared history lookup
  const allLeadIds = [
    ...poolLeads.map((l) => l._id),
    ...assignedLeads.map((l) => l._id),
  ];
  const assignmentHistory = await LeadAssignmentHistory.find({
    admin: adminId,
    lead: { $in: allLeadIds },
  })
    .sort({ assignedAt: -1 })
    .lean();

  const latestAssignmentByLead = new Map();
  for (const entry of assignmentHistory) {
    const leadId = String(entry.lead);
    if (!latestAssignmentByLead.has(leadId)) {
      latestAssignmentByLead.set(leadId, entry);
    }
  }

  const mapLead = (l, isPool = false) => ({
    id: l._id,
    name: l.client?.name || "",
    email: l.client?.email || "",
    mobile: l.client?.mobile || "",
    companyName: l.client?.companyName || "",
    status: l.status,
    isDumped: Boolean(l.isDumped),
    dumpReason: l.dumpReason || null,
    createdAt: l.createdAt.toISOString().split("T")[0],
    assignedTo: isPool ? "Unassigned" : l.assignedTo?.name || "Unassigned",
    assignedBy: l.assignedBy?.name || "Unassigned",
    isRedistributable: isPool,
    team: l.team?.name || (team ? team.name : "No Team"),
    assignedAt: latestAssignmentByLead.get(String(l._id))?.assignedAt
      ? new Date(latestAssignmentByLead.get(String(l._id)).assignedAt)
          .toISOString()
          .split("T")[0]
      : l.updatedAt.toISOString().split("T")[0],
    assignmentReason: latestAssignmentByLead.get(String(l._id))?.reason || null,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        pool: poolLeads.map((l) => mapLead(l, true)),
        assigned: assignedLeads.map((l) => mapLead(l, false)),
        targets: targets.targets || [],
      },
      "Workspace data retrieved successfully",
    ),
  );
});

exports.getProspects = catchAsync(async (req, res) => {
  const adminId = req.admin._id;
  const userId = req.user._id;

  const team = await Team.findOne({
    admin: adminId,
    leader: userId,
    isDeleted: false,
  });
  const memberIds = team ? team.members.map((m) => m.user).filter(Boolean) : [];

  const prospects = await ProspectForm.find({
    admin: adminId,
    filledBy: { $in: memberIds },
  })
    .populate("client", "name email mobile companyName")
    .populate("lead", "status")
    .populate("filledBy", "name");

  const stats = {
    total: prospects.length,
    interested: prospects.filter((p) => p.stage === "Interested").length,
    open: prospects.filter((p) => p.status === "OPEN").length,
    negotiation: prospects.filter((p) => p.status === "IN_NEGOTIATION").length,
    won: prospects.filter((p) => p.status === "WON").length,
    lost: prospects.filter((p) => p.status === "LOST").length,
  };

  const formatted = prospects.map((p) => ({
    id: p._id,
    name: p.contactPerson || p.client?.name || "",
    companyName: p.company || p.client?.companyName || "",
    priority: p.priority,
    stage: p.stage,
    value: p.value || p.totalAmount || 0,
    expectedClose: p.expectedClose
      ? p.expectedClose.toISOString().split("T")[0]
      : null,
    status: p.status,
    service: p.requirement || p.suggestedServices?.[0]?.name || "",
    budget: p.budget || 0,
    assignedTo: p.filledBy?.name || "Unknown",
    assignedToId: p.filledBy?._id || "",
    email: p.client?.email || "",
    mobile: p.client?.mobile || "",
    createdAt: p.createdAt ? p.createdAt.toISOString().split("T")[0] : "",
    executive: {
      id: p.filledBy?._id || "",
      name: p.filledBy?.name || "Unknown",
    },
    lead: {
      id: p.lead?._id || "",
      status: p.lead?.status || "",
    },
    client: {
      name: p.client?.name || "",
      email: p.client?.email || "",
      mobile: p.client?.mobile || "",
      companyName: p.client?.companyName || "",
    },
  }));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { prospects: formatted, stats },
        "Prospects fetched successfully",
      ),
    );
});

exports.updateProspect = catchAsync(async (req, res) => {
  const adminId = req.admin._id;
  const userId = req.user._id;
  const prospectId = req.params.id;

  const team = await Team.findOne({
    admin: adminId,
    leader: userId,
    isDeleted: false,
  });
  const memberIds = team ? team.members.map((m) => m.user).filter(Boolean) : [];

  const prospect = await ProspectForm.findOne({
    _id: prospectId,
    admin: adminId,
    filledBy: { $in: memberIds },
  });

  if (!prospect) {
    return res
      .status(404)
      .json(
        new ApiResponse(404, null, "Prospect not found or not in your team"),
      );
  }

  const {
    stage,
    priority,
    expectedClose,
    status,
    budget,
    requirement,
    contactPerson,
    company,
  } = req.body;
  if (stage !== undefined) prospect.stage = stage;
  if (priority !== undefined) prospect.priority = priority;
  if (expectedClose !== undefined) prospect.expectedClose = expectedClose;
  if (status !== undefined) prospect.status = status;
  if (budget !== undefined) prospect.budget = budget;
  if (requirement !== undefined) prospect.requirement = requirement;
  if (contactPerson !== undefined) prospect.contactPerson = contactPerson;
  if (company !== undefined) prospect.company = company;
  prospect.updatedBy = userId;

  await prospect.save();

  await AuditLog.create({
    admin: adminId,
    performedBy: userId,
    performerType: "USER",
    action: "PROSPECT_UPDATED",
    targetModel: "ProspectForm",
    targetId: prospect._id,
    note: "Team Leader updated prospect details",
  });

  res
    .status(200)
    .json(new ApiResponse(200, prospect, "Prospect updated successfully"));
});

exports.getFollowUps = catchAsync(async (req, res) => {
  const adminId = req.admin._id;
  const userId = req.user._id;

  const team = await Team.findOne({
    admin: adminId,
    leader: userId,
    isDeleted: false,
  });
  const memberIds = team ? team.members.map((m) => m.user).filter(Boolean) : [];

  const {
    status,
    priority,
    type,
    executiveId,
    search,
    page = 1,
    pageSize = 10,
  } = req.query;
  const limit = parseInt(pageSize, 10) || 10;
  const skip = (parseInt(page, 10) - 1) * limit;

  let query = { admin: adminId, user: { $in: memberIds } };

  if (executiveId) {
    if (memberIds.some((id) => String(id) === String(executiveId))) {
      query.user = executiveId;
    } else {
      const matchNameUser = await require("../models").User.findOne({
        admin: adminId,
        name: executiveId,
      });
      if (
        matchNameUser &&
        memberIds.some((id) => String(id) === String(matchNameUser._id))
      ) {
        query.user = matchNameUser._id;
      } else {
        return res
          .status(403)
          .json(new ApiResponse(403, null, "Executive not in your team"));
      }
    }
  }

  if (priority) query.priority = priority;
  if (type) query.type = type;
  if (status === "Done") {
    query.isDone = true;
  } else if (status === "Overdue") {
    query.isDone = false;
    query.remindAt = { $lt: new Date() };
  } else if (status === "Pending") {
    query.isDone = false;
    query.remindAt = { $gte: new Date() };
  }

  let followUps = await Reminder.find(query)
    .populate("user", "name email role")
    .populate({
      path: "lead",
      select: "status assignedTo client",
      populate: { path: "client", select: "name mobile companyName" },
    })
    .sort({ remindAt: 1 })
    .lean();

  if (search) {
    const s = search.toLowerCase();
    followUps = followUps.filter(
      (f) =>
        (f.title && f.title.toLowerCase().includes(s)) ||
        (f.note && f.note.toLowerCase().includes(s)) ||
        (f.lead?.client?.name &&
          f.lead.client.name.toLowerCase().includes(s)) ||
        (f.lead?.client?.companyName &&
          f.lead.client.companyName.toLowerCase().includes(s)) ||
        (f.user?.name && f.user.name.toLowerCase().includes(s)),
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const totalCount = followUps.length;

  const stats = {
    total: totalCount,
    pending: followUps.filter(
      (f) => !f.isDone && new Date(f.remindAt) >= new Date(),
    ).length,
    completed: followUps.filter((f) => f.isDone).length,
    missed: followUps.filter((f) => f.isMissed).length,
    overdue: followUps.filter(
      (f) => !f.isDone && new Date(f.remindAt) < new Date(),
    ).length,
    today: followUps.filter((f) => {
      const d = new Date(f.remindAt).toISOString().split("T")[0];
      return d === todayStr && !f.isDone;
    }).length,
  };

  const paginated = followUps.slice(skip, skip + limit);

  const formatted = paginated.map((f) => {
    let rawDate = new Date(f.remindAt);
    let d = rawDate.toISOString().split("T")[0];
    let timeStr = rawDate.toTimeString().substring(0, 5); // "HH:MM"

    let fStatus = "Pending";
    if (f.isDone) fStatus = "Done";
    else if (f.isMissed) fStatus = "Missed";
    else if (rawDate < new Date()) fStatus = "Overdue";

    return {
      id: f._id,
      leadName: f.lead?.client?.name || f.title || "",
      date: d,
      time: timeStr,
      type: f.type || "Call",
      priority: f.priority || "Medium",
      assignedExec: f.user?.name || "Unknown",
      status: fStatus,
      notes: f.note || "",
      title: f.title || f.note || "",
      remindAt: f.remindAt,
      executive: {
        id: f.user?._id || "",
        name: f.user?.name || "Unknown",
      },
      lead: {
        id: f.lead?._id || "",
        status: f.lead?.status || "",
      },
      client: {
        name: f.lead?.client?.name || "",
        mobile: f.lead?.client?.mobile || "",
        companyName: f.lead?.client?.companyName || "",
      },
    };
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        followUps: formatted,
        stats,
        pagination: {
          total: totalCount,
          page: parseInt(page, 10),
          pageSize: limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      "Follow-ups fetched successfully",
    ),
  );
});

exports.markFollowUpDone = catchAsync(async (req, res) => {
  const adminId = req.admin._id;
  const userId = req.user._id;
  const { id } = req.params;

  const team = await Team.findOne({
    admin: adminId,
    leader: userId,
    isDeleted: false,
  });
  const memberIds = team ? team.members.map((m) => m.user).filter(Boolean) : [];

  const reminder = await Reminder.findOne({ _id: id, admin: adminId });
  if (!reminder)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Reminder not found"));

  if (!memberIds.some((mId) => String(mId) === String(reminder.user))) {
    return res
      .status(403)
      .json(
        new ApiResponse(403, null, "Not authorized to modify this reminder"),
      );
  }

  reminder.isDone = true;
  reminder.doneAt = new Date();
  await reminder.save();

  await AuditLog.create({
    admin: adminId,
    performedBy: userId,
    performerType: "USER",
    action: "LEAD_REMINDER_SET",
    targetModel: "Reminder",
    targetId: reminder._id,
    note: "Follow-up marked done by Team Leader",
  });

  res.status(200).json(new ApiResponse(200, reminder, "Follow-up marked done"));
});

exports.addFollowUp = catchAsync(async (req, res) => {
  const adminId = req.admin._id;
  const userId = req.user._id;

  const team = await Team.findOne({
    admin: adminId,
    leader: userId,
    isDeleted: false,
  });
  const memberIds = team
    ? team.members.map((m) => String(m.user)).filter(Boolean)
    : [];

  const { title, note, remindAt, type, priority, executiveId, leadId } =
    req.body;

  let targetUser = executiveId;
  const User = require("../models").User;
  // If the executiveId might be a name
  if (!memberIds.includes(String(executiveId))) {
    const byName = await User.findOne({ admin: adminId, name: executiveId });
    if (byName && memberIds.includes(String(byName._id))) {
      targetUser = byName._id;
    } else {
      return res
        .status(403)
        .json(new ApiResponse(403, null, "Executive not in your team"));
    }
  }

  const reminder = await Reminder.create({
    admin: adminId,
    user: targetUser,
    lead: leadId || null,
    title: title || "Follow-up",
    note: note || "",
    remindAt,
    type: type || "Call",
    priority: priority || "Medium",
  });

  await AuditLog.create({
    admin: adminId,
    performedBy: userId,
    performerType: "USER",
    action: "LEAD_REMINDER_SET",
    targetModel: "Reminder",
    targetId: reminder._id,
    note: "Follow-up created by Team Leader",
  });

  res.status(201).json(new ApiResponse(201, reminder, "Follow-up created"));
});

exports.rescheduleFollowUp = catchAsync(async (req, res) => {
  const adminId = req.admin._id;
  const userId = req.user._id;
  const { id } = req.params;
  const { remindAt } = req.body;

  const team = await Team.findOne({
    admin: adminId,
    leader: userId,
    isDeleted: false,
  });
  const memberIds = team ? team.members.map((m) => m.user).filter(Boolean) : [];

  const reminder = await Reminder.findOne({ _id: id, admin: adminId });
  if (!reminder)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Reminder not found"));

  if (!memberIds.some((mId) => String(mId) === String(reminder.user))) {
    return res
      .status(403)
      .json(
        new ApiResponse(403, null, "Not authorized to modify this reminder"),
      );
  }

  reminder.remindAt = remindAt;
  reminder.isDone = false;
  reminder.isMissed = false;
  await reminder.save();

  await AuditLog.create({
    admin: adminId,
    performedBy: userId,
    performerType: "USER",
    action: "LEAD_REMINDER_SET",
    targetModel: "Reminder",
    targetId: reminder._id,
    note: "Follow-up rescheduled by Team Leader",
  });
  res.status(200).json(new ApiResponse(200, reminder, "Follow-up rescheduled"));
});
