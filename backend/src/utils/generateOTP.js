/**
 * GENERATE OTP — Secure 6-digit OTP generation
 * Used for email verification and password reset flows
 */
const generateOTP = () => {
  // Generate random 6-digit number between 100000-999999
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * OTP Expiry — 10 minutes in milliseconds
 */
const OTP_EXPIRY = 10 * 60 * 1000;

module.exports = { generateOTP, OTP_EXPIRY };
