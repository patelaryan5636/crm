const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const { 
  SuperAdmin, 
  SuperAdminLoginLog, 
  AdminLoginLog 
} = require('../models/index');
const { 
  comparePassword, 
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
