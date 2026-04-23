/**
 * AUTH CONTROLLER — Admin registration and authentication flows
 * Handles multi-step registration with email OTP verification
 * Production-level validation, error handling, and security
 */
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const { generateOTP, OTP_EXPIRY } = require('../utils/generateOTP');
const { sendOTPEmail, sendRegistrationConfirmationEmail } = require('../services/email.service');
const { hashPassword, generateAccessToken, generateRefreshToken } = require('../services/auth.service');
const { Admin, EmailVerification, RefreshToken, Department, InvoiceCounter } = require('../models/index');
const logger = require('../utils/logger');

// ────────────────────────────────────────────────────────────
// STEP 1: Send OTP to Email
// ────────────────────────────────────────────────────────────
/**
 * Send OTP email for registration
 * Prevents re-use within cooldown period
 */
exports.sendOTP = catchAsync(async (req, res, next) => {
  const { email, adminName } = req.body;

  // Check if email is already registered as Admin
  const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    return next(new AppError('Email is already registered. Please sign in instead.', 409));
  }

  // Check if OTP already sent recently (cooldown: 2 minutes)
  const recentOTP = await EmailVerification.findOne({
    email: email.toLowerCase(),
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }, // Within 2 minutes
  });

  if (recentOTP) {
    return next(new AppError(
      'OTP already sent. Please check your email or wait 2 minutes before requesting a new one.',
      429
    ));
  }

  // Generate OTP
  const otp = generateOTP();
  logger.debug(`Generated OTP for ${email}: ${otp}`);

  // Store OTP in database (TTL will auto-delete after 10 minutes)
  await EmailVerification.updateOne(
    { email: email.toLowerCase() },
    {
      email: email.toLowerCase(),
      otp,
      attempts: 0,
      isVerified: false,
    },
    { upsert: true }
  );

  // Send OTP email
  try {
    await sendOTPEmail(email.toLowerCase(), otp, adminName || 'Admin');
    logger.info(`OTP email sent to ${email}`);
  } catch (emailError) {
    logger.error('Email sending failed', emailError.message);
    return next(new AppError('Failed to send OTP. Please try again later.', 500));
  }

  res.status(200).json(
    new ApiResponse(200, { email: email.toLowerCase() }, 'OTP sent successfully')
  );
});

// ────────────────────────────────────────────────────────────
// STEP 2: Verify OTP
// ────────────────────────────────────────────────────────────
/**
 * Verify OTP entered by user
 * Prevents brute force with attempt limits
 */
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  // Find OTP record
  const verification = await EmailVerification.findOne({
    email: email.toLowerCase(),
  });

  if (!verification) {
    return next(new AppError('OTP expired or not found. Please request a new OTP.', 400));
  }

  // Check if OTP is already verified (one-time use)
  if (verification.isVerified) {
    return next(new AppError('This OTP has already been used. Request a new one.', 400));
  }

  // Check attempt limit (max 5 attempts)
  if (verification.attempts >= 5) {
    await EmailVerification.deleteOne({ email: email.toLowerCase() });
    return next(new AppError(
      'Too many failed attempts. Please request a new OTP.',
      429
    ));
  }

  // Verify OTP
  if (verification.otp !== otp) {
    verification.attempts += 1;
    await verification.save();
    return next(new AppError(`Invalid OTP. ${5 - verification.attempts} attempts remaining.`, 400));
  }

  // Mark as verified
  verification.isVerified = true;
  await verification.save();
  logger.info(`OTP verified for ${email}`);

  res.status(200).json(
    new ApiResponse(
      200,
      { email: email.toLowerCase(), verified: true },
      'OTP verified successfully'
    )
  );
});

// ────────────────────────────────────────────────────────────
// STEP 3: Create Admin Account
// ────────────────────────────────────────────────────────────
/**
 * Complete registration and create Admin account
 * Creates default departments and invoice counter
 * Sets up multi-tenant structure
 */
exports.registerAdmin = catchAsync(async (req, res, next) => {
  const {
    companyName,
    companyEmail,
    companyPhone,
    companyAddress,
    adminName,
    ownerName,
    adminEmail,
    adminPhone,
    password,
  } = req.body;

  const resolvedAdminName = (adminName || ownerName || '').trim();
  const resolvedAdminEmail = (adminEmail || companyEmail || '').toLowerCase();
  const resolvedAdminPhone = adminPhone || companyPhone;

  if (!resolvedAdminName) {
    return next(new AppError('Admin/Owner name is required.', 400));
  }

  if (!resolvedAdminEmail) {
    return next(new AppError('Admin email is required.', 400));
  }

  const normalizedEmail = resolvedAdminEmail;
  const normalizedCompanyEmail = companyEmail.toLowerCase();

  // Verify email is OTP-verified
  const verification = await EmailVerification.findOne({
    email: normalizedEmail,
    isVerified: true,
  });

  if (!verification) {
    return next(new AppError('Email not verified. Please verify OTP first.', 400));
  }

  // Double-check email is not already registered
  const existingAdmin = await Admin.findOne({ email: normalizedEmail });
  if (existingAdmin) {
    return next(new AppError('Email already registered.', 409));
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create Admin document
  const admin = new Admin({
    name: resolvedAdminName,
    email: normalizedEmail,
    password: hashedPassword,
    phone: resolvedAdminPhone,
    company: {
      name: companyName,
      email: normalizedCompanyEmail,
      phone: companyPhone,
      address: companyAddress ? { line1: companyAddress } : undefined,
    },
    isActive: true,
    isProfileComplete: false,
    planStatus: 'TRIAL',
    userLimit: 40, // Default user limit
    clientLimit: 6000, // Default client/lead limit
  });

  await admin.save();
  logger.info(`New Admin registered: ${normalizedEmail}`);

  // ──────────────────────────────────────────────────────────────
  // AUTO-SETUP: Create Default Departments
  // ──────────────────────────────────────────────────────────────
  const defaultDepts = [
    { name: 'SALES', displayName: 'Sales Department', isDefault: true },
    { name: 'FINANCE', displayName: 'Finance Department', isDefault: true },
    { name: 'MANAGEMENT', displayName: 'Management Department', isDefault: true },
  ];

  const deptData = defaultDepts.map(d => ({
    ...d,
    admin: admin._id,
  }));

  await Department.insertMany(deptData);
  logger.info(`Default departments created for admin: ${admin._id}`);

  // ──────────────────────────────────────────────────────────────
  // AUTO-SETUP: Create Invoice Counter
  // ──────────────────────────────────────────────────────────────
  await InvoiceCounter.create({
    admin: admin._id,
    seq: 0,
    prefix: 'INV',
  });
  logger.info(`Invoice counter created for admin: ${admin._id}`);

  // ──────────────────────────────────────────────────────────────
  // Generate Tokens
  // ──────────────────────────────────────────────────────────────
  const accessToken = generateAccessToken({
    id: admin._id,
    email: admin.email,
    role: 'ADMIN',
    type: 'ADMIN',
  });

  const refreshToken = generateRefreshToken({
    id: admin._id,
    email: admin.email,
    role: 'ADMIN',
    type: 'ADMIN',
  });

  // Store refresh token in database
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

  await RefreshToken.create({
    token: refreshToken,
    holderType: 'ADMIN',
    holderId: admin._id,
    expiresAt: refreshTokenExpiry,
  });

  // ──────────────────────────────────────────────────────────────
  // Send Confirmation Email (async, don't wait)
  // ──────────────────────────────────────────────────────────────
  sendRegistrationConfirmationEmail(normalizedEmail, resolvedAdminName, companyName).catch(err =>
    logger.error('Failed to send confirmation email', err.message)
  );

  // ──────────────────────────────────────────────────────────────
  // Delete OTP record
  // ──────────────────────────────────────────────────────────────
  await EmailVerification.deleteOne({ email: normalizedEmail });

  // ──────────────────────────────────────────────────────────────
  // Response
  // ──────────────────────────────────────────────────────────────
  res.status(201).json(
    new ApiResponse(
      201,
      {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          company: admin.company.name,
        },
        accessToken,
        refreshToken,
      },
      'Registration successful. Welcome to Graphura CRM!'
    )
  );
});

// ────────────────────────────────────────────────────────────
// RESEND OTP
// ────────────────────────────────────────────────────────────
/**
 * Resend OTP if user didn't receive it
 */
exports.resendOTP = catchAsync(async (req, res, next) => {
  const { email, adminName } = req.body;

  // Delete old OTP
  await EmailVerification.deleteOne({ email: email.toLowerCase() });

  // Generate new OTP
  const otp = generateOTP();

  // Store new OTP
  await EmailVerification.create({
    email: email.toLowerCase(),
    otp,
    attempts: 0,
    isVerified: false,
  });

  // Send OTP email
  try {
    await sendOTPEmail(email.toLowerCase(), otp, adminName || 'Admin');
  } catch (emailError) {
    return next(new AppError('Failed to send OTP. Please try again later.', 500));
  }

  res.status(200).json(
    new ApiResponse(200, { email: email.toLowerCase() }, 'OTP resent successfully')
  );
});

module.exports = exports;
