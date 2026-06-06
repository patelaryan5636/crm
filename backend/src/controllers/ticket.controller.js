/**
 * TICKET CONTROLLER — Support Ticket Management API
 * Production-level endpoints with comprehensive business logic
 * Handles: Create, Read, Update, Escalate, Resolve, Close tickets
 */

'use strict';

const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const { Ticket, User, AuditLog, Notification, Team } = require('../models');
const ticketService = require('../services/ticket.service');
const notificationService = require('../services/notification.service');

// ─────────────────────────────────────────────────────────────
// POST: Create New Support Ticket
// Any authenticated user can raise a ticket
// Auto-assigns to appropriate level based on hierarchy
// ─────────────────────────────────────────────────────────────
exports.createTicket = catchAsync(async (req, res, next) => {
  const { subject, message, priority, refType, refId } = req.body;
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!userId || !adminId) {
    return next(new AppError('Authentication required', 401));
  }

  // Validate user exists and is active
  const raiser = await User.findOne({
    _id: userId,
    admin: adminId,
    isDeleted: false,
    isActive: true,
  }).select('_id name email role department');

  if (!raiser) {
    return next(new AppError('User not found or is inactive', 404));
  }

  // Determine initial assignee based on role hierarchy
  const assigneeId = await ticketService.determineInitialAssignee(userId, req.admin);

  // Create ticket
  const newTicket = await Ticket.create({
    admin: adminId,
    raisedBy: userId,
    assignedTo: assigneeId,
    subject: subject.trim(),
    message: message.trim(),
    priority: priority || 'NORMAL',
    refType: refType || null,
    refId: refId || null,
    status: 'OPEN',
  });

  // Populate references
  await newTicket.populate([
    { path: 'raisedBy', select: 'name email role' },
    { path: 'assignedTo', select: 'name email role' },
  ]);

  // Create audit log
  await AuditLog.create({
    admin: adminId,
    performedBy: userId,
    performerType: 'USER',
    action: 'TICKET_CREATED',
    targetModel: 'Ticket',
    targetId: newTicket._id,
    after: {
      subject,
      priority,
      assignedTo: assigneeId,
    },
  });

  // Send notification to assignee
  if (assigneeId) {
    try {
      await notificationService.createNotification({
        admin: adminId,
        recipient: assigneeId,
        type: 'TICKET_CREATED',
        title: 'New Support Ticket',
        body: `${raiser.name} raised ticket: "${subject}"`,
        refType: 'Ticket',
        refId: newTicket._id,
        priority: priority || 'NORMAL',
      });

      // Send push notification if user has FCM token
      const assignee = await User.findById(assigneeId).select('fcmToken');
      if (assignee?.fcmToken) {
        await notificationService.sendPushNotification(
          assignee.fcmToken,
          'New Support Ticket Assigned',
          `${raiser.name}: "${subject}"`
        );
      }
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  }

  res.status(201).json(
    new ApiResponse(
      201,
      { ticket: newTicket },
      'Support ticket created successfully'
    )
  );
});

// ─────────────────────────────────────────────────────────────
// GET: Fetch All Tickets (With Filtering & Pagination)
// view=assigned  → only tickets assigned to me (Team Tickets for TL/Manager)
// view=raised    → only tickets I raised (My Tickets)
// default        → both assigned + raised (combined view)
// Admin sees all tickets in organization
// ─────────────────────────────────────────────────────────────
exports.getAllTickets = catchAsync(async (req, res, next) => {
  const { status, priority, assignedTo, sortBy, page = 1, limit = 20, showEscalated, view } = req.query;
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!adminId) {
    return next(new AppError('Authentication required', 401));
  }

  // Ensure ObjectIds for aggregation match
  const adminObjectId = new mongoose.Types.ObjectId(adminId);
  const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

  const user = await User.findById(userId).select('role');

  // Build filter
  const filter = { admin: adminObjectId };

  if (user?.role && !['ADMIN'].includes(user.role)) {
    if (view === 'assigned') {
      if (['SALES_MANAGER', 'FINANCE_MANAGER', 'MANAGEMENT_MANAGER'].includes(user.role)) {
        // 1. Direct subordinates of the Manager
        const directSubordinates = await User.find({
          admin: adminObjectId,
          manager: userObjectId,
          isDeleted: false,
        }).select('_id');
        const directSubordinateIds = directSubordinates.map(u => u._id);

        // 2. Indirect subordinates (e.g. Executives managed by Team Leaders under the Manager)
        let indirectSubordinateIds = [];
        if (directSubordinateIds.length > 0) {
          const indirectSubordinates = await User.find({
            admin: adminObjectId,
            manager: { $in: directSubordinateIds },
            isDeleted: false,
          }).select('_id');
          indirectSubordinateIds = indirectSubordinates.map(u => u._id);
        }

        // 3. Teams led by the manager or any subordinate
        const leadIds = [userObjectId, ...directSubordinateIds, ...indirectSubordinateIds];
        const departmentTeams = await Team.find({
          admin: adminObjectId,
          leader: { $in: leadIds },
          isActive: true,
          isDeleted: false
        });
        const teamMemberIds = departmentTeams.flatMap(t => (t.members || []).map(m => m.user));

        // Combine all subordinate/team member IDs
        const allUnderIds = Array.from(new Set([
          ...directSubordinateIds.map(id => id.toString()),
          ...indirectSubordinateIds.map(id => id.toString()),
          ...teamMemberIds.map(id => id && id.toString())
        ].filter(Boolean))).map(id => new mongoose.Types.ObjectId(id));

        filter.$or = [
          { assignedTo: userObjectId },
          { assignedTo: { $in: allUnderIds } },
          { raisedBy: { $in: allUnderIds } }
        ];
        filter.raisedBy = { $ne: userObjectId };
      } else if (['SALES_TL', 'MANAGEMENT_TL'].includes(user.role)) {
        // Team Leader views tickets of team members (from Team model or manager field)
        const teams = await Team.find({
          admin: adminObjectId,
          leader: userObjectId,
          isActive: true,
          isDeleted: false
        });
        const teamMemberIdsFromTeams = teams.flatMap(t => (t.members || []).map(m => m.user));

        const teamUsers = await User.find({
          admin: adminObjectId,
          manager: userObjectId,
          isDeleted: false,
        }).select('_id');
        const teamMemberIdsFromManager = teamUsers.map(u => u._id);

        const allTeamMemberIds = Array.from(new Set([
          ...teamMemberIdsFromTeams.map(id => id && id.toString()),
          ...teamMemberIdsFromManager.map(id => id.toString())
        ].filter(Boolean))).map(id => new mongoose.Types.ObjectId(id));

        filter.raisedBy = { $in: allTeamMemberIds };
      } else {
        // Executive / Employee: only tickets assigned to them
        filter.assignedTo = userObjectId;
        filter.raisedBy = { $ne: userObjectId };
      }
    } else if (view === 'raised') {
      // My Tickets: only tickets raised by this user
      filter.raisedBy = userObjectId;
    } else {
      // Default: tickets assigned to OR raised by this user
      filter.$or = [
        { assignedTo: userObjectId },
        { raisedBy: userObjectId },
      ];
    }
  }

  // Apply status filter
  if (status) {
    filter.status = status;
  }

  // Apply priority filter
  if (priority) {
    filter.priority = priority;
  }

  // Apply assignee filter (admin only)
  if (assignedTo && ['ADMIN'].includes(user?.role)) {
    filter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  }

  // Show escalated only
  if (showEscalated === 'true') {
    filter.isEscalated = true;
  }

  // Pagination calculation
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Sort options — Tiered Priority (High Group > Medium Group > Low Group) then Time (Oldest First - FIFO)
  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        priorityWeight: {
          $switch: {
            branches: [
              { case: { $in: [{ $toUpper: "$priority" }, ["URGENT", "HIGH"]] }, then: 3 },
              { case: { $in: [{ $toUpper: "$priority" }, ["MEDIUM", "NORMAL"]] }, then: 2 },
              { case: { $in: [{ $toUpper: "$priority" }, ["LOW"]] }, then: 1 },
            ],
            default: 2,
          },
        },
      },
    },
  ];

  // Primary Sort: priorityWeight (DESC: High first)
  // Secondary Sort: createdAt (ASC: Oldest first - FIFO)
  let sortObj = { priorityWeight: -1, createdAt: 1 };

  // Handle specific sort requests while maintaining priority as primary
  if (sortBy === 'escalatedAt') {
    sortObj = { escalatedAt: -1, priorityWeight: -1, createdAt: 1 };
  } else if (sortBy === 'createdAt') {
    // Even if user sorts by date, we keep priority as the grouping factor
    sortObj = { priorityWeight: -1, createdAt: 1 };
  }

  pipeline.push({ $sort: sortObj });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: parseInt(limit) });

  // Fetch tickets with pagination using aggregation
  const tickets = await Ticket.aggregate(pipeline);

  // Populate references on aggregated results
  await Ticket.populate(tickets, [
    { path: 'raisedBy', select: 'name email role' },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'resolvedBy', select: 'name email' },
    { path: 'replies.user', select: 'name email role' },
  ]);

  // Get total count for pagination
  const total = await Ticket.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        tickets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
      'Tickets fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────────────────────
// GET: Fetch Single Ticket by ID
// User can only view if assigned to them or they raised it
// Admin can view any ticket
// ─────────────────────────────────────────────────────────────
exports.getTicketById = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!adminId) {
    return next(new AppError('Authentication required', 401));
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return next(new AppError('Invalid ticket ID format', 400));
  }

  // NOTE: TicketSchema does not use softDeletePlugin, no isDeleted field
  const ticket = await Ticket.findOne({
    _id: ticketId,
    admin: adminId,
  })
    .populate('raisedBy', 'name email role department')
    .populate('assignedTo', 'name email role department')
    .populate('resolvedBy', 'name email')
    .populate('replies.user', 'name email role');

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  // Authorization: User can only view their own tickets (unless admin)
  const user = await User.findById(userId).select('role');
  if (!['ADMIN'].includes(user?.role)) {
    if (!ticket.raisedBy._id.equals(userId) && !ticket.assignedTo?._id.equals(userId)) {
      return next(new AppError('You do not have permission to view this ticket', 403));
    }
  }

  res.status(200).json(
    new ApiResponse(200, { ticket }, 'Ticket fetched successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// POST: Add Reply to Ticket
// Team members add comments/updates
// ─────────────────────────────────────────────────────────────
exports.addReply = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!adminId || !userId) {
    return next(new AppError('Authentication required', 401));
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return next(new AppError('Invalid ticket ID format', 400));
  }

  const ticket = await Ticket.findOne({
    _id: ticketId,
    admin: adminId,
  });

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  // Authorization:
  // - ADMIN can always reply
  // - The ASSIGNEE (team leader / manager) can reply — this is the "official" reply
  // - The RAISER (sales executive) CANNOT send additional messages after creation
  //   (their initial message is the ticket description itself)
  const user = await User.findById(userId).select('role name');
  if (!['ADMIN'].includes(user?.role)) {
    if (!ticket.assignedTo?.equals(userId)) {
      return next(new AppError('Only the assigned handler can reply to this ticket', 403));
    }
  }

  // Add reply and update status to IN_PROGRESS when assignee first replies
  const updatedTicket = await ticketService.addReplyToTicket(ticket, message, user);

  // Mark ticket as IN_PROGRESS when assignee replies (if still OPEN)
  if (ticket.status === 'OPEN') {
    updatedTicket.status = 'IN_PROGRESS';
    await updatedTicket.save();
  }

  // Create audit log
  await AuditLog.create({
    admin: adminId,
    performedBy: userId,
    performerType: 'USER',
    action: 'TICKET_UPDATED',
    targetModel: 'Ticket',
    targetId: ticketId,
    changes: { replyAdded: true },
  });

  // Notify the ticket raiser that their ticket has been replied to
  try {
    if (!ticket.raisedBy.equals(userId)) {
      await notificationService.createNotification({
        admin: adminId,
        recipient: ticket.raisedBy,
        type: 'TICKET_UPDATED',
        title: 'Ticket Replied',
        body: `${user.name} replied to your ticket: "${ticket.subject}"`,
        refType: 'Ticket',
        refId: ticketId,
      });
    }
  } catch (err) {
    console.error('Error sending notification:', err);
  }

  await updatedTicket.populate([
    { path: 'raisedBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
  ]);

  res.status(200).json(
    new ApiResponse(200, { ticket: updatedTicket }, 'Reply added successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// POST: Escalate Ticket
// Move ticket to next level in hierarchy
// Can only be done by current assignee or admin
// ─────────────────────────────────────────────────────────────
exports.escalateTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { escalationReason } = req.body;
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!adminId || !userId) {
    return next(new AppError('Authentication required', 401));
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return next(new AppError('Invalid ticket ID format', 400));
  }

  const ticket = await Ticket.findOne({
    _id: ticketId,
    admin: adminId,
  });

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  // Authorization: Only assignee or admin can escalate
  const user = await User.findById(userId).select('role');
  if (!['ADMIN'].includes(user?.role) && !ticket.assignedTo?.equals(userId)) {
    return next(new AppError('Only the assignee or admin can escalate this ticket', 403));
  }

  try {
    const { ticket: updatedTicket, nextAssignee } = await ticketService.escalateTicket(
      ticket,
      user,
      req.admin
    );

    // Add escalation note
    if (escalationReason) {
      await ticketService.addReplyToTicket(
        updatedTicket,
        `ESCALATION: ${escalationReason}`,
        user
      );
    }

    // Notify next assignee
    if (nextAssignee) {
      try {
        await notificationService.createNotification({
          admin: adminId,
          recipient: nextAssignee._id,
          type: 'TICKET_ESCALATED',
          title: 'Ticket Escalated',
          body: `Ticket escalated: "${updatedTicket.subject}"`,
          refType: 'Ticket',
          refId: ticketId,
          priority: updatedTicket.priority,
        });

        const assigneeUser = await User.findById(nextAssignee._id).select('fcmToken');
        if (assigneeUser?.fcmToken) {
          await notificationService.sendPushNotification(
            assigneeUser.fcmToken,
            'Ticket Escalated',
            updatedTicket.subject
          );
        }
      } catch (err) {
        console.error('Error sending escalation notification:', err);
      }
    }

    await updatedTicket.populate([
      { path: 'raisedBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        { ticket: updatedTicket, escalatedTo: nextAssignee },
        'Ticket escalated successfully'
      )
    );
  } catch (error) {
    return next(new AppError(error.message || 'Cannot escalate ticket further', 400));
  }
});

// ─────────────────────────────────────────────────────────────
// POST: Resolve Ticket
// Mark ticket as resolved
// Only assignee or admin can resolve
// ─────────────────────────────────────────────────────────────
exports.resolveTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { resolutionMessage } = req.body;
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!adminId || !userId) {
    return next(new AppError('Authentication required', 401));
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return next(new AppError('Invalid ticket ID format', 400));
  }

  const ticket = await Ticket.findOne({
    _id: ticketId,
    admin: adminId,
  });

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  // Authorization: Only assignee or admin can resolve
  const user = await User.findById(userId).select('role name');
  if (!['ADMIN'].includes(user?.role) && !ticket.assignedTo?.equals(userId)) {
    return next(new AppError('Only the assignee or admin can resolve this ticket', 403));
  }

  // Resolve ticket
  const resolvedTicket = await ticketService.resolveTicket(
    ticket,
    resolutionMessage,
    user,
    req.admin
  );

  // Notify raiser
  try {
    await notificationService.createNotification({
      admin: adminId,
      recipient: resolvedTicket.raisedBy,
      type: 'TICKET_RESOLVED',
      title: 'Ticket Resolved',
      body: `Your ticket "${resolvedTicket.subject}" has been resolved`,
      refType: 'Ticket',
      refId: ticketId,
    });
  } catch (err) {
    console.error('Error sending resolution notification:', err);
  }

  await resolvedTicket.populate([
    { path: 'raisedBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'resolvedBy', select: 'name email' },
  ]);

  res.status(200).json(
    new ApiResponse(200, { ticket: resolvedTicket }, 'Ticket resolved successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// POST: Close Ticket
// Final closure after resolution
// Only admin or resolver can close
// ─────────────────────────────────────────────────────────────
exports.closeTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { closureNotes } = req.body;
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!adminId || !userId) {
    return next(new AppError('Authentication required', 401));
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return next(new AppError('Invalid ticket ID format', 400));
  }

  const ticket = await Ticket.findOne({
    _id: ticketId,
    admin: adminId,
  });

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  const user = await User.findById(userId).select('role name');

  try {
    const closedTicket = await ticketService.closeTicket(
      ticket,
      closureNotes,
      user,
      req.admin
    );

    // Notify raiser of closure
    try {
      await notificationService.createNotification({
        admin: adminId,
        recipient: closedTicket.raisedBy,
        type: 'TICKET_CLOSED',
        title: 'Ticket Closed',
        body: `Your ticket "${closedTicket.subject}" has been closed`,
        refType: 'Ticket',
        refId: ticketId,
      });
    } catch (err) {
      console.error('Error sending closure notification:', err);
    }

    await closedTicket.populate([
      { path: 'raisedBy', select: 'name email' },
      { path: 'resolvedBy', select: 'name email' },
    ]);

    res.status(200).json(
      new ApiResponse(200, { ticket: closedTicket }, 'Ticket closed successfully')
    );
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// ─────────────────────────────────────────────────────────────
// PUT: Reassign Ticket
// Manual reassignment (Admin/Manager only)
// ─────────────────────────────────────────────────────────────
exports.reassignTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { assignedTo, reason } = req.body;
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!adminId || !userId) {
    return next(new AppError('Authentication required', 401));
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return next(new AppError('Invalid ticket ID format', 400));
  }

  const ticket = await Ticket.findOne({
    _id: ticketId,
    admin: adminId,
  });

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  // Authorization: Only admin can reassign
  const user = await User.findById(userId).select('role');
  if (!['ADMIN'].includes(user?.role)) {
    return next(new AppError('Only admin can reassign tickets', 403));
  }

  try {
    const { ticket: updatedTicket, newAssignee } = await ticketService.reassignTicket(
      ticket,
      assignedTo,
      user,
      req.admin,
      reason
    );

    // Notify new assignee
    try {
      await notificationService.createNotification({
        admin: adminId,
        recipient: newAssignee._id,
        type: 'TICKET_CREATED',
        title: 'Ticket Assigned',
        body: `Ticket assigned to you: "${updatedTicket.subject}"`,
        refType: 'Ticket',
        refId: ticketId,
        priority: updatedTicket.priority,
      });
    } catch (err) {
      console.error('Error sending reassignment notification:', err);
    }

    await updatedTicket.populate([
      { path: 'raisedBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        { ticket: updatedTicket, assignedTo: newAssignee },
        'Ticket reassigned successfully'
      )
    );
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// ─────────────────────────────────────────────────────────────
// GET: Ticket Statistics
// Dashboard stats for admin/manager
// ─────────────────────────────────────────────────────────────
exports.getTicketStats = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;
  const adminId = req.admin?._id;

  if (!adminId) {
    return next(new AppError('Authentication required', 401));
  }

  const user = await User.findById(userId).select('role');

  // Get stats for the user or entire organization
  const stats = await ticketService.getTicketStats(
    req.admin,
    ['ADMIN'].includes(user?.role) ? null : userId
  );

  res.status(200).json(
    new ApiResponse(200, { stats }, 'Ticket statistics fetched successfully')
  );
});

// ─────────────────────────────────────────────────────────────
// GET: Get Assignee Options (For Manual Assignment)
// Returns list of users that can be assigned tickets
// ─────────────────────────────────────────────────────────────
exports.getAssigneeOptions = catchAsync(async (req, res, next) => {
  const adminId = req.admin?._id;

  if (!adminId) {
    return next(new AppError('Authentication required', 401));
  }

  // Get all active team leaders and managers
  const managerRoles = ['SALES_TL', 'SALES_MANAGER', 'MANAGEMENT_TL', 'MANAGEMENT_MANAGER', 'FINANCE_MANAGER'];
  const assignees = await ticketService.getAssigneesByRole(req.admin, managerRoles);

  res.status(200).json(
    new ApiResponse(200, { assignees }, 'Assignee options fetched successfully')
  );
});

module.exports = exports;
