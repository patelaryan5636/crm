const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const { 
  SuperAdmin, 
  SuperAdminLoginLog, 
  AdminLoginLog,
  Admin,
  AuditLog
} = require('../models/index');
const { 
  comparePassword, 
  hashPassword,
  generateAccessToken, 
  generateRefreshToken 
} = require('../services/auth.service');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

/**
 * SUPER ADMIN LOGIN
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = req.get('user-agent') || 'unknown';

  // 1. Find Super Admin
  const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
  
  if (!superAdmin) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // 2. Verify Password
  const isMatch = await comparePassword(password, superAdmin.password);
  
  // Log attempt
  await SuperAdminLoginLog.create({
    superAdmin: superAdmin._id,
    email: email.toLowerCase(),
    ipAddress,
    userAgent,
    isSuccess: isMatch,
    failReason: isMatch ? null : 'INVALID_CREDENTIALS'
  });

  if (!isMatch) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!superAdmin.isActive) {
    return next(new AppError('Account is deactivated.', 403));
  }

  // 3. Generate Tokens
  const accessToken = generateAccessToken({
    id: superAdmin._id,
    email: superAdmin.email,
    role: 'SUPER_ADMIN',
    type: 'SUPER_ADMIN'
  });

  const refreshToken = generateRefreshToken({
    id: superAdmin._id,
    email: superAdmin.email,
    role: 'SUPER_ADMIN',
    type: 'SUPER_ADMIN'
  });

  res.status(200).json(
    new ApiResponse(
      200, 
      {
        superAdmin: {
          id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: 'SUPER_ADMIN'
        },
        accessToken,
        refreshToken
      },
      'Super Admin login successful'
    )
  );
});

/**
 * VIEW ALL ADMIN LOGIN LOGS
 * Requirement: Can see AdminLoginLog (all admins)
 */
exports.getAdminLoginLogs = catchAsync(async (req, res, next) => {
  const logs = await AdminLoginLog.find()
    .populate('admin', 'name company.name')
    .sort({ loginAt: -1 })
    .limit(100); // Limit to latest 100 for performance

  res.status(200).json(
    new ApiResponse(200, { logs }, 'Admin login logs retrieved successfully')
  );
});

/**
 * GET ALL ADMINS (PAGINATED)
 */
exports.getAllAdmins = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Find all active admins (excluding soft deleted)
  const query = { isDeleted: false };
  
  const admins = await Admin.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('_id name email phone company userLimit clientLimit planStatus isActive createdAt');

  const total = await Admin.countDocuments(query);
  const pages = Math.ceil(total / limit);

  res.status(200).json(
    new ApiResponse(200, {
      admins,
      pagination: { total, page, pages }
    }, 'Admins retrieved successfully')
  );
});

/**
 * CREATE NEW ADMIN (TENANT)
 */
exports.createAdmin = catchAsync(async (req, res, next) => {
  const { name, email, phone, password, companyName, userLimit, clientLimit } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email, and password are required', 400));
  }

  // Check unique email
  const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    return next(new AppError('Email is already registered', 400));
  }

  const hashedPassword = await hashPassword(password);

  const newAdmin = await Admin.create({
    name,
    email,
    phone,
    password: hashedPassword,
    company: {
      name: companyName || ''
    },
    userLimit: userLimit || 40,
    clientLimit: clientLimit || 5000,
    superAdmin: req.user._id,
    isActive: true
  });

  // Audit Log
  await AuditLog.create({
    performedBy: req.user._id,
    performerType: 'SUPER_ADMIN',
    action: 'ADMIN_CREATED',
    targetModel: 'Admin',
    targetId: newAdmin._id,
    ipAddress: getClientIp(req),
    note: `Super Admin created tenant ${name}`
  });

  res.status(201).json(
    new ApiResponse(201, { admin: newAdmin }, 'Admin created successfully')
  );
});

/**
 * TOGGLE ADMIN STATUS
 */
exports.toggleAdminStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return next(new AppError('isActive boolean is required', 400));
  }

  const admin = await Admin.findOne({ _id: id, isDeleted: false });
  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  admin.isActive = isActive;
  await admin.save();

  // Audit Log
  await AuditLog.create({
    performedBy: req.user._id,
    performerType: 'SUPER_ADMIN',
    action: isActive ? 'ADMIN_UPDATED' : 'ADMIN_DEACTIVATED',
    targetModel: 'Admin',
    targetId: admin._id,
    ipAddress: getClientIp(req),
    note: `Super Admin ${isActive ? 'activated' : 'deactivated'} admin ${admin.name}`
  });

  res.status(200).json(
    new ApiResponse(200, { admin }, `Admin ${isActive ? 'activated' : 'deactivated'} successfully`)
  );
});

/**
 * GET SINGLE ADMIN
 */
exports.getAdminById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const admin = await Admin.findOne({ _id: id, isDeleted: false });
  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  res.status(200).json(
    new ApiResponse(200, { admin }, 'Admin retrieved successfully')
  );
});
