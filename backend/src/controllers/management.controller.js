"use strict";

/**
 * MANAGEMENT CONTROLLER — Dashboard + Clients
 *
 * GET /api/management/dashboard
 *   KPIs, project status funnel, monthly throughput, per-TL load,
 *   recent projects — all computed from live DB data.
 *
 * GET /api/management/clients
 *   All clients scoped to this admin that have at least one project.
 *   Read-only for Management Manager (client master data is owned by
 *   Finance / Sales; MM sees them in context of projects).
 */

const catchAsync  = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const AppError    = require('../utils/appError');

const MGMT_ROLES = ['MANAGEMENT_MANAGER'];

const requireMgmt = (req, next) => {
  if (!req.user || !MGMT_ROLES.includes(req.user.role)) {
    next(new AppError('Only Management Manager can access this resource', 403));
    return false;
  }
  return true;
};

// ── DB → UI status label ─────────────────────────────────────────────────────
const STATUS_MAP = {
  NOT_STARTED:  'Not Started',
  WORK_STARTED: 'Work Started',
  IN_PROGRESS:  'In Progress',
  REVIEW:       'Review Stage',
  FINALIZATION: 'Finalization',
  COMPLETED:    'Completed',
  DELIVERED:    'Delivered',
  DELAYED:      'Delayed',
};

const PRIORITY_MAP = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent',
};

// Status groups
const ACTIVE_STATUSES    = ['NOT_STARTED', 'WORK_STARTED', 'IN_PROGRESS', 'REVIEW', 'FINALIZATION'];
const COMPLETED_STATUSES = ['COMPLETED', 'DELIVERED'];
const ALL_STATUSES       = Object.keys(STATUS_MAP);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD  GET /api/management/dashboard
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboard = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { Project, User, Department } = require('../models');

  const adminId = req.admin._id;

  // Fetch all non-deleted projects for this admin in one query
  const projects = await Project.find({ admin: adminId, isDeleted: false })
    .populate('teamLeader', 'name')
    .populate('client',     'name mobile')
    .lean();

  // ── KPI stats ────────────────────────────────────────────────────────────
  const now      = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const kpis = {
    totalProjects:       projects.length,
    activeProjects:      projects.filter(p => ACTIVE_STATUSES.includes(p.status)).length,
    completedThisMonth:  projects.filter(p =>
      COMPLETED_STATUSES.includes(p.status) &&
      p.deliveredAt &&
      p.deliveredAt.toISOString().slice(0, 7) === thisMonth,
    ).length,
    delayed:             projects.filter(p => p.status === 'DELAYED').length,
    pendingHandoverLink: projects.filter(p =>
      COMPLETED_STATUSES.includes(p.status) && !p.handoverLink,
    ).length,
  };

  // On-time delivery % (completed projects delivered on or before expectedDelivery)
  const completedWithDeadline = projects.filter(p =>
    COMPLETED_STATUSES.includes(p.status) && p.expectedDelivery && p.deliveredAt,
  );
  kpis.onTimeDeliveryPct = completedWithDeadline.length === 0
    ? 0
    : Math.round(
        (completedWithDeadline.filter(p => p.deliveredAt <= p.expectedDelivery).length /
          completedWithDeadline.length) * 100,
      );

  // ── Status funnel ─────────────────────────────────────────────────────────
  const statusFunnel = ALL_STATUSES.map(s => ({
    name:  STATUS_MAP[s],
    value: projects.filter(p => p.status === s).length,
  }));

  // ── Monthly throughput — last 12 months ───────────────────────────────────
  const monthly = [];
  for (let i = 11; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const name = d.toLocaleString('en-IN', { month: 'short' });
    monthly.push({
      name,
      started:   projects.filter(p =>
        p.startDate && p.startDate.toISOString().slice(0, 7) === key,
      ).length,
      delivered: projects.filter(p =>
        p.deliveredAt && p.deliveredAt.toISOString().slice(0, 7) === key,
      ).length,
    });
  }

  // ── Per-TL load ───────────────────────────────────────────────────────────
  const dept = await Department.findOne({
    admin: adminId, name: 'MANAGEMENT', isDeleted: false,
  }).lean();

  const tls = await User.findActive(
    { admin: adminId, department: dept?._id, role: 'MANAGEMENT_TL' },
    'name',
    { sort: { name: 1 } },
  );

  const tlLoad = tls.map(tl => {
    const tlProjects = projects.filter(p =>
      p.teamLeader && String(p.teamLeader._id || p.teamLeader) === String(tl._id),
    );
    return {
      name:      tl.name.split(' ')[0],
      fullName:  tl.name,
      active:    tlProjects.filter(p => ACTIVE_STATUSES.includes(p.status)).length,
      completed: tlProjects.filter(p => COMPLETED_STATUSES.includes(p.status)).length,
      delayed:   tlProjects.filter(p => p.status === 'DELAYED').length,
    };
  });

  // ── Recent projects (last 8, sorted by updatedAt) ─────────────────────────
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8)
    .map(p => ({
      id:             String(p._id),
      projectNumber:  p.projectNumber || String(p._id).slice(-6).toUpperCase(),
      name:           p.name,
      clientName:     p.client?.name    || '',
      clientMobile:   p.client?.mobile  || '',
      assignedTLName: p.teamLeader?.name || '',
      deadline:       p.expectedDelivery ? p.expectedDelivery.toISOString().slice(0, 10) : null,
      progressPercent: p.progressPercent || 0,
      status:         STATUS_MAP[p.status]   || p.status,
      priority:       PRIORITY_MAP[p.priority] || p.priority,
      driveLink:      p.driveLink    || null,
      handoverLink:   p.handoverLink || null,
      startDate:      p.startDate   ? p.startDate.toISOString().slice(0, 10) : null,
      deliveredAt:    p.deliveredAt ? p.deliveredAt.toISOString().slice(0, 10) : null,
    }));

  return res.status(200).json(
    new ApiResponse(200, {
      kpis,
      statusFunnel,
      monthlyThroughput: monthly,
      tlLoad,
      recentProjects,
      totalTLs: tls.length,
    }, 'Dashboard loaded'),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS  GET /api/management/clients
// Returns all clients that have at least one project under this admin.
// MM views clients in context of their projects (read-only).
// ─────────────────────────────────────────────────────────────────────────────
exports.listClients = catchAsync(async (req, res, next) => {
  if (!requireMgmt(req, next)) return;
  const { Project, Client } = require('../models');

  const adminId = req.admin._id;

  // Get all projects (need client refs + status for KPIs)
  const projects = await Project.find({ admin: adminId, isDeleted: false })
    .select('client status handoverLink driveLink name projectNumber expectedDelivery progressPercent priority')
    .lean();

  // Unique client IDs across all projects
  const clientIds = [...new Set(
    projects.map(p => p.client?.toString()).filter(Boolean),
  )];

  const clients = clientIds.length === 0
    ? []
    : await Client.findActive(
        { admin: adminId, _id: { $in: clientIds } },
        'name email mobile companyName',
        { sort: { name: 1 } },
      );

  // Map clients with embedded project summary
  const STATUS_ACTIVE = new Set(ACTIVE_STATUSES);

  const mappedClients = clients.map(c => {
    const clientProjects = projects.filter(p => String(p.client) === String(c._id));
    return {
      id:          String(c._id),
      name:        c.name,
      email:       c.email  || '',
      mobile:      c.mobile || '',
      companyName: c.companyName || '',
      projectCount: clientProjects.length,
      activeCount:  clientProjects.filter(p => STATUS_ACTIVE.has(p.status)).length,
      // Summarised project list for the view modal
      projects: clientProjects.map(p => ({
        id:             String(p._id),
        projectNumber:  p.projectNumber || String(p._id).slice(-6).toUpperCase(),
        name:           p.name,
        status:         STATUS_MAP[p.status] || p.status,
        priority:       PRIORITY_MAP[p.priority] || p.priority,
        deadline:       p.expectedDelivery ? p.expectedDelivery.toISOString().slice(0, 10) : null,
        progressPercent: p.progressPercent || 0,
        driveLink:      p.driveLink    || null,
        handoverLink:   p.handoverLink || null,
      })),
    };
  });

  // KPI stats
  const stats = {
    total:        mappedClients.length,
    withActive:   mappedClients.filter(c => c.activeCount > 0).length,
    totalProjects: projects.length,
    pendingHandover: projects.filter(p =>
      ['COMPLETED', 'DELIVERED'].includes(p.status) && !p.handoverLink,
    ).length,
  };

  return res.status(200).json(
    new ApiResponse(200, { clients: mappedClients, stats }, 'Clients listed'),
  );
});
