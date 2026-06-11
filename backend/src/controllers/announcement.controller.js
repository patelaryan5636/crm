const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const { Announcement, Team, ManagementTeam, User, Department, AuditLog, Notification } = require('../models/index');

const ANNOUNCEMENT_TYPE_MAP = {
  Announcement: 'ANNOUNCEMENT',
  Warning: 'WARNING',
  Appreciation: 'APPRECIATION',
};

const ANNOUNCEMENT_TYPE_LABELS = {
  INFO: 'Announcement',
  ANNOUNCEMENT: 'Announcement',
  WARNING: 'Warning',
  APPRECIATION: 'Appreciation',
};

// Audience options per sender role
const AUDIENCE_OPTIONS_BY_ROLE = {
  SALES_MANAGER: ['All', 'Team', 'Team Leaders', 'Executive'],
  SALES_TL: ['Team', 'Executive'],
  MANAGEMENT_MANAGER: ['All', 'Team', 'Team Leaders', 'Employee'],
  MANAGEMENT_TL: ['Team', 'Employee'],
  ADMIN: ['All', 'Team', 'Team Leaders', 'Executive', 'Employee'],
  SUPER_ADMIN: ['All', 'Team', 'Team Leaders', 'Executive', 'Employee'],
};

const TARGET_ROLE_BY_AUDIENCE_AND_SENDER = {
  SALES_MANAGER: {
    'Team Leaders': 'SALES_TL',
    Executive: 'SALES_EXECUTIVE',
  },
  SALES_TL: {
    Executive: 'SALES_EXECUTIVE',
  },
  MANAGEMENT_MANAGER: {
    'Team Leaders': 'MANAGEMENT_TL',
    Employee: 'MANAGEMENT_EMPLOYEE',
  },
  MANAGEMENT_TL: {
    Employee: 'MANAGEMENT_EMPLOYEE',
  },
};

// Roles that can create announcements
const SENDER_ROLES = ['SALES_MANAGER', 'SALES_TL', 'MANAGEMENT_MANAGER', 'MANAGEMENT_TL', 'ADMIN', 'SUPER_ADMIN'];

const BROADCAST_RECIPIENT_ROLES = [
  'SALES_TL',
  'SALES_EXECUTIVE',
  'FINANCE_MANAGER',
  'FINANCE_EXECUTIVE',
  'MANAGEMENT_MANAGER',
  'MANAGEMENT_TL',
  'MANAGEMENT_EMPLOYEE',
  'ADMIN',
  'SUPER_ADMIN',
];

const isManagementRole = (role) => role === 'MANAGEMENT_MANAGER' || role === 'MANAGEMENT_TL';
const getTeamModelName = (role) => isManagementRole(role) ? 'ManagementTeam' : 'Team';
const getTeamModel = (modelName) => modelName === 'ManagementTeam' ? ManagementTeam : Team;
const getAudienceOptions = (role) => AUDIENCE_OPTIONS_BY_ROLE[role] || [];
const getTargetRole = (senderRole, audience) => {
  if (senderRole === 'ADMIN' || senderRole === 'SUPER_ADMIN') {
    return audience === 'Employee' ? 'MANAGEMENT_EMPLOYEE'
      : audience === 'Team Leaders' ? 'SALES_TL'
      : audience === 'Executive' ? 'SALES_EXECUTIVE'
      : null;
  }
  return TARGET_ROLE_BY_AUDIENCE_AND_SENDER[senderRole]?.[audience] || null;
};

// ─────────────────────────────────────────────────────────────
// INTERNAL: Fan-out notifications to all resolved recipients
// Called after an Announcement is created.
// ─────────────────────────────────────────────────────────────
async function fanOutNotifications(announcement, adminId) {
  try {
    let recipientIds = [];

    if (announcement.targetType === 'ALL') {
      // Everyone in the tenant with a receivable role
      const users = await User.find({
        admin: adminId,
        role: { $in: BROADCAST_RECIPIENT_ROLES },
        isDeleted: false,
        isActive: true,
      }).select('_id').lean();
      recipientIds = users.map((u) => u._id);

    } else if (announcement.targetType === 'ROLE') {
      const users = await User.find({
        admin: adminId,
        role: announcement.targetRole,
        isDeleted: false,
        isActive: true,
      }).select('_id').lean();
      recipientIds = users.map((u) => u._id);

    } else if (announcement.targetType === 'USER') {
      recipientIds = [announcement.targetUser];

    } else if (announcement.targetType === 'DEPARTMENT') {
      const users = await User.find({
        admin: adminId,
        department: announcement.targetDepartment,
        role: { $in: BROADCAST_RECIPIENT_ROLES },
        isDeleted: false,
        isActive: true,
      }).select('_id').lean();
      recipientIds = users.map((u) => u._id);

    } else if (announcement.targetType === 'TEAM') {
      const TeamModel = getTeamModel(announcement.targetTeamModel);
      const team = await TeamModel.findById(announcement.targetTeam)
        .select('leader members')
        .lean();
      if (team) {
        const memberIds = (team.members || []).map((m) => m.user);
        if (team.leader) memberIds.push(team.leader);
        recipientIds = memberIds;
      }
    }

    if (recipientIds.length === 0) return;

    // Deduplicate
    const uniqueIds = [...new Set(recipientIds.map(String))];

    const notifDocs = uniqueIds.map((userId) => ({
      admin:   adminId,
      user:    userId,
      title:   announcement.title,
      body:    announcement.message,
      type:    'ANNOUNCEMENT',
      refId:   announcement._id,
      refType: 'Announcement',
      isRead:  false,
    }));

    // insertMany with ordered:false so one failure doesn't block others
    await Notification.insertMany(notifDocs, { ordered: false });
  } catch (err) {
    // Non-fatal — log but don't crash the request
    console.error('[fanOutNotifications] Error:', err.message);
  }
}

const getContext = async (req) => {
  const adminId = req.admin?._id || req.admin?.id;
  const user = req.user;

  if (!adminId) {
    throw new AppError('Admin scope is required', 401);
  }

  if (!user?._id) {
    throw new AppError('Authentication required', 401);
  }

  const department = await Department.findOne({
    _id: user.department,
    admin: adminId,
    isDeleted: false,
    isActive: true,
  }).select('_id name displayName');

  if (!department) {
    throw new AppError('Department context not found for this user', 403);
  }

  return { adminId, user, department };
};

const toDisplayType = (type) => ANNOUNCEMENT_TYPE_LABELS[type] || type;

const computeStatus = (expiryDate) => {
  if (!expiryDate) return 'Active';
  return new Date(expiryDate) >= new Date() ? 'Active' : 'Expired';
};

const formatDateOnly = (date) => {
  if (!date) return null;
  const resolvedDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(resolvedDate.getTime())) return null;
  return resolvedDate.toISOString().slice(0, 10);
};

const hydrateTargetTeams = async (announcements) => {
  const rows = Array.isArray(announcements) ? announcements : [announcements];
  const salesIds = [];
  const managementIds = [];

  rows.forEach((announcement) => {
    if (announcement?.targetType !== 'TEAM' || !announcement.targetTeam) return;
    const id = announcement.targetTeam._id || announcement.targetTeam;
    if ((announcement.targetTeamModel || 'Team') === 'ManagementTeam') {
      managementIds.push(id);
    } else {
      salesIds.push(id);
    }
  });

  const [salesTeams, managementTeams] = await Promise.all([
    salesIds.length ? Team.find({ _id: { $in: salesIds } }).select('name department').lean() : [],
    managementIds.length ? ManagementTeam.find({ _id: { $in: managementIds } }).select('name department').lean() : [],
  ]);

  const byId = new Map([...salesTeams, ...managementTeams].map((team) => [team._id.toString(), team]));
  rows.forEach((announcement) => {
    if (announcement?.targetType !== 'TEAM' || !announcement.targetTeam) return;
    const id = (announcement.targetTeam._id || announcement.targetTeam).toString();
    announcement.targetTeam = byId.get(id) || announcement.targetTeam;
  });

  return Array.isArray(announcements) ? rows : rows[0];
};

const formatAnnouncement = (announcement) => {
  const audience = (() => {
    if (announcement.targetType === 'ALL') return 'All';
    if (announcement.targetType === 'TEAM') return 'Team';
    if (announcement.targetType === 'ROLE' || announcement.targetType === 'USER') {
      const role = announcement.targetRole || announcement.targetUser?.role;
      if (role === 'SALES_TL') return 'Team Leaders';
      if (role === 'SALES_EXECUTIVE') return 'Executive';
      if (role === 'MANAGEMENT_TL') return 'Team Leaders';
      if (role === 'MANAGEMENT_EMPLOYEE') return 'Employee';
      return 'Role';
    }
    if (announcement.targetType === 'DEPARTMENT') return 'All';
    return 'All';
  })();

  const audienceDetail = (() => {
    if (announcement.targetType === 'TEAM') {
      return announcement.targetTeam?.name || '';
    }
    if (announcement.targetType === 'ROLE' || announcement.targetType === 'USER') {
      return announcement.targetUser?.name || '';
    }
    if (announcement.targetType === 'DEPARTMENT') {
      return announcement.targetDepartment?.displayName || announcement.targetDepartment?.name || '';
    }
    return '';
  })();

  return {
    id: announcement._id,
    title: announcement.title,
    type: toDisplayType(announcement.type),
    audience,
    audienceDetail,
    sentDate: formatDateOnly(announcement.createdAt),
    expiryDate: formatDateOnly(announcement.expiryDate),
    body: announcement.message,
    status: computeStatus(announcement.expiryDate),
  };
};

exports.getAnnouncementMeta = catchAsync(async (req, res, next) => {
  const { user } = await getContext(req);

  if (!SENDER_ROLES.includes(user.role)) {
    return next(new AppError('You do not have permission to access announcement metadata', 403));
  }

  const audienceOptions = getAudienceOptions(user.role);

  res.status(200).json(
    new ApiResponse(200, {
      messageTypes: Object.keys(ANNOUNCEMENT_TYPE_MAP).map((label) => ({
        label,
        value: ANNOUNCEMENT_TYPE_MAP[label],
      })),
      audienceOptions,
    }, 'Announcement metadata retrieved successfully')
  );
});

exports.getAnnouncementTargets = catchAsync(async (req, res, next) => {
  const { adminId, user, department } = await getContext(req);
  const { audience } = req.query;

  if (!SENDER_ROLES.includes(user.role)) {
    return next(new AppError('You do not have permission to fetch targets', 403));
  }

  // Validate audience against role-specific options
  const allowedAudiences = getAudienceOptions(user.role);

  if (!allowedAudiences.includes(audience)) {
    return next(new AppError('Invalid audience selected', 400));
  }

  if (audience === 'All') {
    return res.status(200).json(
      new ApiResponse(200, { audience, targets: [] }, 'Audience targets retrieved successfully')
    );
  }

  if (audience === 'Team') {
    // For TL: only their own team. For Manager: all teams in department.
    const TeamModel = getTeamModel(getTeamModelName(user.role));
    let teamFilter = {
      admin: adminId,
      department: department._id,
      isDeleted: false,
      isActive: true,
    };

    if (user.role === 'SALES_TL' || user.role === 'MANAGEMENT_TL') {
      teamFilter.leader = user._id;
    }

    const teams = await TeamModel.find(teamFilter)
      .populate('leader', 'name email phone role')
      .sort({ name: 1 });

    const targets = teams.map((team) => ({
      id: team._id,
      label: team.name,
      leaderName: team.leader?.name || null,
      memberCount: Array.isArray(team.members) ? team.members.length : 0,
    }));

    return res.status(200).json(
      new ApiResponse(200, { audience, targets }, 'Team targets retrieved successfully')
    );
  }

  // Role-based targets (Team Leaders / Executive)
  const targetRole = getTargetRole(user.role, audience);
  if (!targetRole) {
    return next(new AppError('Invalid audience selected for your role', 400));
  }
  let userFilter = {
    admin: adminId,
    department: department._id,
    role: targetRole,
    isDeleted: false,
    isActive: true,
  };

  // TL can only target executives in their own team
  if ((user.role === 'SALES_TL' && audience === 'Executive') ||
      (user.role === 'MANAGEMENT_TL' && audience === 'Employee')) {
    const TeamModel = getTeamModel(getTeamModelName(user.role));
    const myTeams = await TeamModel.find({
      admin: adminId,
      leader: user._id,
      isDeleted: false,
      isActive: true,
    }).select('members').lean();

    const memberIds = myTeams.flatMap((team) => (team.members || []).map((m) => m.user));
    if (memberIds.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, { audience, targetRole, targets: [] }, `No ${audience.toLowerCase()} in your team`)
      );
    }

    userFilter._id = { $in: memberIds };
  }

  const targets = await User.find(userFilter)
    .select('name email phone role profilePic')
    .sort({ name: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        audience,
        targetRole,
        targets: targets.map((target) => ({
          id: target._id,
          label: target.name,
          email: target.email,
          phone: target.phone,
          role: target.role,
          profilePic: target.profilePic,
        })),
      },
      `${audience} targets retrieved successfully`
    )
  );
});

exports.createAnnouncement = catchAsync(async (req, res, next) => {
  const { adminId, user, department } = await getContext(req);
  const { title, message, type, audience, targetId, expiryDate } = req.body;

  if (!SENDER_ROLES.includes(user.role)) {
    return next(new AppError('You do not have permission to create announcements', 403));
  }

  // Validate audience against role-specific options
  const allowedAudiences = getAudienceOptions(user.role);

  if (!allowedAudiences.includes(audience)) {
    return next(new AppError('Invalid audience selected for your role', 400));
  }

  const normalizedType = ANNOUNCEMENT_TYPE_MAP[type];
  if (!normalizedType) {
    return next(new AppError('Invalid announcement type selected', 400));
  }

  let targetType = 'ALL';
  let targetTeam = null;
  let targetTeamModel = getTeamModelName(user.role);
  let targetRole = null;
  let targetUser = null;
  let targetDepartment = null;

  if (audience === 'Team') {
    if (!targetId) {
      return next(new AppError('A team must be selected for Team announcements', 400));
    }

    const teamModelName = getTeamModelName(user.role);
    const TeamModel = getTeamModel(teamModelName);
    let teamFilter = {
      _id: targetId,
      admin: adminId,
      department: department._id,
      isDeleted: false,
      isActive: true,
    };

    // TL can only target their own team
    if (user.role === 'SALES_TL' || user.role === 'MANAGEMENT_TL') {
      teamFilter.leader = user._id;
    }

    targetTeam = await TeamModel.findOne(teamFilter);
    if (!targetTeam) {
      return next(new AppError('Team not found or not accessible', 404));
    }

    targetType = 'TEAM';
    targetTeamModel = teamModelName;

  } else if (audience === 'Team Leaders' || audience === 'Executive' || audience === 'Employee') {
    if (!targetId) {
      return next(new AppError(`A ${audience.toLowerCase()} member must be selected`, 400));
    }

    const expectedRole = getTargetRole(user.role, audience);
    if (!expectedRole) {
      return next(new AppError('Invalid audience selected for your role', 400));
    }
    let userFilter = {
      _id: targetId,
      admin: adminId,
      department: department._id,
      role: expectedRole,
      isDeleted: false,
      isActive: true,
    };

    // TL can only target executives in their own team
    if ((user.role === 'SALES_TL' && audience === 'Executive') ||
        (user.role === 'MANAGEMENT_TL' && audience === 'Employee')) {
      const TeamModel = getTeamModel(getTeamModelName(user.role));
      const myTeams = await TeamModel.find({
        admin: adminId,
        leader: user._id,
        isDeleted: false,
        isActive: true,
      }).select('members').lean();

      if (myTeams.length === 0) {
        return next(new AppError('You do not have a team assigned', 404));
      }

      const memberIds = myTeams.flatMap((team) => (team.members || []).map((m) => m.user.toString()));
      if (!memberIds.includes(targetId.toString())) {
        return next(new AppError(`Selected ${audience.toLowerCase()} is not in your team`, 403));
      }
    }

    targetUser = await User.findOne(userFilter);
    if (!targetUser) {
      return next(new AppError(`Selected ${audience.toLowerCase()} was not found`, 404));
    }

    targetType = 'USER';
    targetRole = expectedRole;

  } else if (audience === 'All') {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      targetType = 'ALL';
    } else {
      targetType = 'DEPARTMENT';
      targetDepartment = department._id;
    }
  } else {
    return next(new AppError('Invalid audience selected', 400));
  }

  const announcement = await Announcement.create({
    admin: adminId,
    createdBy: user._id,
    createdByAdmin: false,
    title: title.trim(),
    message: message.trim(),
    type: normalizedType,
    expiryDate: expiryDate || null,
    targetType,
    targetDepartment,
    targetTeam: targetTeam?._id || null,
    targetTeamModel,
    targetRole,
    targetUser: targetUser?._id || null,
  });

  await AuditLog.create({
    admin: adminId,
    performedBy: user._id,
    performerType: 'USER',
    action: 'ANNOUNCEMENT_SENT',
    targetModel: 'Announcement',
    targetId: announcement._id,
    after: {
      title: announcement.title,
      type: announcement.type,
      targetType: announcement.targetType,
      targetTeam: announcement.targetTeam || null,
      targetUser: announcement.targetUser || null,
    },
  });

  // Fan-out in-app notifications to all recipients (non-blocking)
  fanOutNotifications(announcement, adminId);

  const populatedAnnouncement = await Announcement.findById(announcement._id)
    .populate('targetUser', 'name email phone role department')
    .populate('targetDepartment', 'name displayName')
    .lean();
  await hydrateTargetTeams(populatedAnnouncement);

  res.status(201).json(
    new ApiResponse(
      201,
      { announcement: formatAnnouncement(populatedAnnouncement) },
      'Announcement created successfully'
    )
  );
});

exports.getAnnouncements = catchAsync(async (req, res, next) => {
  const { adminId, user } = await getContext(req);

  if (!SENDER_ROLES.includes(user.role)) {
    return next(new AppError('You do not have permission to view announcements', 403));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // TL only sees their own announcements; Manager/Admin sees all in tenant
  const filter = { admin: adminId };
  if (user.role === 'SALES_TL') {
    filter.createdBy = user._id;
  }

  const [announcements, total] = await Promise.all([
    Announcement.find(filter)
      .populate('targetUser', 'name email phone role department')
      .populate('targetDepartment', 'name displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Announcement.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      announcements: (await hydrateTargetTeams(announcements)).map(formatAnnouncement),
      total,
      page,
      pages: Math.ceil(total / limit),
    }, 'Announcements retrieved successfully')
  );
});
