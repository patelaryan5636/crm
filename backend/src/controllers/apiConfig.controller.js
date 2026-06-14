const { ApiConfig } = require('../models/index');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const { encrypt, decrypt } = require('../utils/encrypt');
const crypto = require('crypto');

console.log('API Config Controller Loaded');

/**
 * Update Razorpay Configuration (Dual-Key System)
 * POST /api/api-config/razorpay
 */
exports.updateRazorpayConfig = catchAsync(async (req, res, next) => {
  console.log('Update Razorpay Config Request:', req.body);
  const { mode, keyId, keySecret, webhookSecret, isActive } = req.body;

  if (!mode || !['test', 'live'].includes(mode)) {
    return next(new AppError('Invalid or missing mode (must be test or live)', 400));
  }

  try {
    const prefix = `RAZORPAY_${mode.toUpperCase()}_`;
    const configs = [
      { key: `${prefix}KEY_ID`, value: keyId, description: `Razorpay ${mode} API Key ID` }
    ];

    // Only update secret if it's provided and NOT a hint (••••)
    if (keySecret && !keySecret.includes('•') && String(keySecret).trim() !== '') {
      configs.push({ key: `${prefix}KEY_SECRET`, value: keySecret, description: `Razorpay ${mode} API Key Secret` });
    }

    if (webhookSecret && !webhookSecret.includes('•') && String(webhookSecret).trim() !== '') {
      configs.push({ key: `${prefix}WEBHOOK_SECRET`, value: webhookSecret, description: `Razorpay ${mode} Webhook Secret` });
    }

    // If isActive is explicitly passed, update the active mode
    if (isActive === true) {
      configs.push({ key: 'RAZORPAY_ACTIVE_MODE', value: mode, description: 'Currently active Razorpay mode' });
    }

    for (const config of configs) {
      await ApiConfig.findOneAndUpdate(
        { admin: req.admin._id, key: config.key },
        { 
          admin: req.admin._id,
          value: encrypt(config.value),
          description: config.description,
          isEncrypted: true,
          updatedBy: req.user?._id
        },
        { upsert: true, new: true, runValidators: true }
      );
    }

    console.log(`Razorpay ${mode} configuration updated successfully`);
    res.status(200).json(new ApiResponse(200, null, `Razorpay ${mode} configuration updated successfully`));
  } catch (error) {
    console.error('Error in updateRazorpayConfig:', error);
    return next(new AppError(error.message, 500));
  }
});
/**
 * Helper to mask sensitive secrets for UI display
 * Returns ••••••••last4 if long enough, else just dots
 */
const maskSecret = (secret) => {
  if (!secret) return '';
  const s = String(secret);
  if (s.length <= 4) return '••••••••';
  return '••••••••••••••••' + s.slice(-4);
};

console.log('API Config Controller Loaded');

/**
 * Get Razorpay Configuration (Dual-Key System)
 * GET /api/api-config/razorpay
 */
exports.getRazorpayConfig = catchAsync(async (req, res, next) => {
  if (!req.admin?._id) {
    return next(new AppError('Admin context is required to load API configuration', 403));
  }

  const keys = [
    'RAZORPAY_TEST_KEY_ID', 'RAZORPAY_TEST_KEY_SECRET', 'RAZORPAY_TEST_WEBHOOK_SECRET',
    'RAZORPAY_LIVE_KEY_ID', 'RAZORPAY_LIVE_KEY_SECRET', 'RAZORPAY_LIVE_WEBHOOK_SECRET',
    'RAZORPAY_ACTIVE_MODE'
  ];
  
  const configs = await ApiConfig.find({ admin: req.admin._id, key: { $in: keys } });

  const configMap = {};
  configs.forEach(c => {
    configMap[c.key] = decrypt(c.value);
  });

  const responseData = {
    activeMode: configMap['RAZORPAY_ACTIVE_MODE'] || 'test',
    test: {
      keyId: configMap['RAZORPAY_TEST_KEY_ID'] || '',
      keySecret: maskSecret(configMap['RAZORPAY_TEST_KEY_SECRET']),
      webhookSecret: maskSecret(configMap['RAZORPAY_TEST_WEBHOOK_SECRET'])
    },
    live: {
      keyId: configMap['RAZORPAY_LIVE_KEY_ID'] || '',
      keySecret: maskSecret(configMap['RAZORPAY_LIVE_KEY_SECRET']),
      webhookSecret: maskSecret(configMap['RAZORPAY_LIVE_WEBHOOK_SECRET'])
    }
  };

  res.status(200).json(new ApiResponse(200, responseData, 'Razorpay dual-key configuration retrieved'));
});

/**
 * POST /api/api-config/razorpay/generate-secret
 * Generate a new webhook secret for the current admin (one-time reveal)
 */
exports.generateRazorpaySecret = catchAsync(async (req, res, next) => {
  if (!req.admin?._id) return next(new AppError('Admin context required', 403));
  const { ApiConfig, AuditLog } = require('../models');

  // Generate 32-byte hex secret
  const secret = crypto.randomBytes(32).toString('hex');

  // Persist encrypted
  const doc = await ApiConfig.findOneAndUpdate(
    { admin: req.admin._id, key: 'RAZORPAY_WEBHOOK_SECRET' },
    {
      admin: req.admin._id,
      value: encrypt(secret),
      description: 'Razorpay Webhook Secret',
      isEncrypted: true,
      updatedBy: req.user?._id
    },
    { upsert: true, new: true, runValidators: true }
  );

  // Audit
  try {
    await AuditLog.create({
      admin: req.admin._id,
      performedBy: req.user?._id,
      performerType: req.user ? 'ADMIN' : 'SUPER_ADMIN',
      action: 'API_CONFIG_UPDATE',
      targetModel: 'ApiConfig',
      targetId: doc._id,
      note: 'Generated new Razorpay webhook secret via admin UI'
    });
  } catch (err) {
    // audit failure shouldn't block the response
    console.warn('Failed to write audit log for webhook secret generation', err.message || err);
  }

  // Return plaintext secret once — admin must copy it now
  res.status(200).json(new ApiResponse(200, { secret }, 'Webhook secret generated — copy it now'));
});
