const mongoose = require('mongoose');
const { Attendance, User, Team } = require('../models/index');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * Helper: Normalize date to start of day
 */
const getTodayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * @desc    Clock In
 * @route   POST /api/attendance/clock-in
 * @access  Private (User)
 */
exports.clockIn = catchAsync(async (req, res, next) => {
  const today = getTodayDate();
  
  // Check if already clocked in for today
  let attendance = await Attendance.findOne({ user: req.user._id, date: today });

  if (attendance && attendance.clockIn) {
    return next(new AppError('Already clocked in for today.', 400));
  }

  if (!attendance) {
    attendance = new Attendance({
      admin: req.admin._id,
      user: req.user._id,
      date: today,
      clockIn: new Date(),
      isAbsent: false,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
    });
  } else {
    attendance.clockIn = new Date();
    attendance.isAbsent = false;
    attendance.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  }

  await attendance.save();

  res.status(200).json(
    new ApiResponse(200, attendance, 'Clocked in successfully.')
  );
});

/**
 * @desc    Clock Out
 * @route   POST /api/attendance/clock-out
 * @access  Private (User)
 */
exports.clockOut = catchAsync(async (req, res, next) => {
  const today = getTodayDate();
  let targetUserId = req.user._id;

  // Allow Managers/TLs to clock out others if targetUserId is provided in body
  if (req.body.userId && String(req.body.userId) !== String(req.user._id)) {
    if (req.user.role === 'SALES_MANAGER' || req.user.role === 'SALES_TL' || req.user.role === 'ADMIN') {
      targetUserId = req.body.userId;
    } else {
      return next(new AppError('You are not authorized to clock out other users.', 403));
    }
  }

  const attendance = await Attendance.findOne({ user: targetUserId, date: today });

  if (!attendance || !attendance.clockIn) {
    return next(new AppError('No active session found. Please clock in first.', 400));
  }

  if (attendance.clockOut) {
    return next(new AppError('Already clocked out for today.', 400));
  }

  attendance.clockOut = new Date();

  // 1. Calculate Total duration (ms)
  const totalMs = attendance.clockOut - attendance.clockIn;

  // 2. Calculate Break duration (ms)
  let breakMs = 0;
  attendance.breaks.forEach(b => {
    if (b.startedAt && b.endedAt) {
      breakMs += (new Date(b.endedAt) - new Date(b.startedAt));
    } else if (b.startedAt && !b.endedAt) {
      // If user forgot to resume before clocking out, auto-end the break now
      b.endedAt = attendance.clockOut;
      breakMs += (new Date(b.endedAt) - new Date(b.startedAt));
    }
  });

  // 3. Set derived fields
  const netMs = totalMs - breakMs;
  const netMinutes = netMs / 60000;

  attendance.breakMinutes = Number((breakMs / 60000).toFixed(2));
  attendance.hoursWorked = Number((netMs / 3600000).toFixed(2));

  // 4. Overtime (target 8h = 480 mins)
  const TARGET_MINS = 480;
  attendance.overtimeMinutes = netMinutes > TARGET_MINS ? Number((netMinutes - TARGET_MINS).toFixed(2)) : 0;

  // 5. Half Day (e.g. less than 4h = 240 mins)
  attendance.isHalfDay = netMinutes > 0 && netMinutes < 240;

  // 6. Final absence check
  attendance.isAbsent = false;


  await attendance.save();

  res.status(200).json(
    new ApiResponse(200, attendance, 'Clocked out successfully.')
  );
});

/**
 * @desc    Toggle Break (Pause/Resume)
 * @route   POST /api/attendance/break-toggle
 * @access  Private (User)
 */
exports.toggleBreak = catchAsync(async (req, res, next) => {
  if (!req.body || !req.body.action) {
    return next(new AppError("Please provide an action ('pause' or 'resume') in the request body.", 400));
  }
  const { action } = req.body; // 'pause' or 'resume'
  const today = getTodayDate();
  const attendance = await Attendance.findOne({ user: req.user._id, date: today });

  if (!attendance || !attendance.clockIn || attendance.clockOut) {
    return next(new AppError('Attendance session is not in a valid state to toggle break.', 400));
  }

  const activeBreak = attendance.breaks.find(b => !b.endedAt);

  if (action === 'pause') {
    if (activeBreak) {
      return next(new AppError('A break is already in progress.', 400));
    }
    attendance.breaks.push({ startedAt: new Date() });
  } else if (action === 'resume') {
    if (!activeBreak) {
      return next(new AppError('No active break found to resume from.', 400));
    }
    activeBreak.endedAt = new Date();

    // Recalculate breakMinutes so far
    let totalBreakMs = 0;
    attendance.breaks.forEach(b => {
      if (b.startedAt && b.endedAt) {
        totalBreakMs += (new Date(b.endedAt) - new Date(b.startedAt));
      }
    });
    attendance.breakMinutes = Number((totalBreakMs / 60000).toFixed(2));
  } else {
    return next(new AppError("Invalid action. Use 'pause' or 'resume'.", 400));
  }



  await attendance.save();

  res.status(200).json(
    new ApiResponse(
      200, 
      attendance, 
      `Break ${action === 'pause' ? 'started' : 'ended'} successfully.`
    )
  );
});

/**
 * @desc    Get Today's Attendance Status
 * @route   GET /api/attendance/today
 * @access  Private (User)
 */
exports.getTodayStatus = catchAsync(async (req, res) => {
  const today = getTodayDate();
  const attendance = await Attendance.findOne({ 
    user: req.user._id, 
    date: today 
  });

  res.status(200).json(
    new ApiResponse(200, attendance || null, 'Today\'s status fetched.')
  );
});

const getEffectiveAdminId = (req) => {
  const admin = req.user?.admin || req.admin;
  if (!admin) return null;
  if (typeof admin === 'string') return admin;
  if (typeof admin === 'object') {
    return admin._id || admin.id || admin.toString();
  }
  return String(admin);
};

/**
 * @desc    Get Team Attendance (For Managers/TLs)
 * @route   GET /api/attendance/team
 * @access  Private (Manager/TL)
 */
exports.getTeamAttendance = catchAsync(async (req, res, next) => {
  const adminId = getEffectiveAdminId(req);
  const userId = req.user?._id || req.admin?._id;
  const role = req.user?.role || req.userType; 
  const today = getTodayDate();

  if (!adminId) {
    return next(new AppError('Organization context not found.', 401));
  }

  const adminIdObj = new mongoose.Types.ObjectId(String(adminId));
  const userIdObj = new mongoose.Types.ObjectId(String(userId));

  let targetUserIds = [];

  if (role === 'ADMIN') {
    // Admins see everyone in their organization
    const users = await User.find({ admin: adminIdObj, isDeleted: false, isActive: true }).select('_id');
    targetUserIds = users.map(u => u._id);
  } else if (role === 'SALES_MANAGER') {
    // Managers see all TLs and Executives
    const users = await User.find({
      admin: adminIdObj,
      role: { $in: ['SALES_TL', 'SALES_EXECUTIVE'] },
      isDeleted: false,
      isActive: true
    }).select('_id');
    targetUserIds = users.map(u => u._id);
  } else if (role === 'SALES_TL') {
    // TLs see members of ALL teams they lead OR users who report to them directly
    const teams = await Team.find({ admin: adminIdObj, leader: userIdObj, isDeleted: false, isActive: true });
    const teamMemberIds = teams.flatMap(t => t.members.map(m => m.user)).filter(id => id && String(id) !== String(userId));
    
    // Also check for users where manager = TL (direct reports)
    const directReports = await User.find({ admin: adminIdObj, manager: userIdObj, isDeleted: false, isActive: true }).select('_id');
    const reportIds = directReports.map(u => u._id);

    // Merge and deduplicate
    targetUserIds = [...new Set([...teamMemberIds.map(String), ...reportIds.map(String)])];
  } else {
    return next(new AppError('You are not authorized to view team attendance.', 403));
  }

  // If no targets, return empty early
  if (targetUserIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], 'No team members found.'));
  }

  const targetIdsObj = targetUserIds.map(id => new mongoose.Types.ObjectId(id));

  // Fetch users details
  const users = await User.find({ _id: { $in: targetIdsObj } })
    .select('_id name role email phone manager')
    .populate('manager', 'name');

  // Fetch attendance for these users for today
  const attendanceRecords = await Attendance.find({
    admin: adminIdObj,
    user: { $in: targetIdsObj },
    date: today
  }).lean();

  // Merge data
  const result = users.map(u => {
    const attendance = attendanceRecords.find(a => String(a.user) === String(u._id));
    
    // Calculate current session duration if active
    let hoursWorked = attendance?.hoursWorked || 0;
    if (attendance && attendance.clockIn && !attendance.clockOut) {
      const now = new Date();
      const start = new Date(attendance.clockIn);
      
      // Subtract breaks
      let breakMs = 0;
      attendance.breaks?.forEach(b => {
        if (b.startedAt && b.endedAt) {
          breakMs += (new Date(b.endedAt) - new Date(b.startedAt));
        } else if (b.startedAt && !b.endedAt) {
          breakMs += (now - new Date(b.startedAt));
        }
      });
      
      const netMs = Math.max(0, now - start - breakMs);
      hoursWorked = Number((netMs / 3600000).toFixed(2));
    }

    return {
      id: u._id,
      name: u.name,
      role: u.role,
      email: u.email,
      phone: u.phone,
      teamLeader: u.manager?.name || "Self",
      attendance: attendance ? {
        ...attendance,
        hoursWorked // Use our live calculated value
      } : null
    };
  });

  res.status(200).json(new ApiResponse(200, result, 'Team attendance fetched successfully.'));
});
