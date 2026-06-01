/**
 * EMAIL SERVICE — Send OTPs and verification emails
 * Uses Brevo (Sendinblue) for production email delivery
 * Can fallback to nodemailer for development
 */
const axios = require('axios');
const logger = require('../utils/logger');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const getSender = () => ({
  name: process.env.BREVO_SENDER_NAME || 'Graphura CRM',
  email: process.env.BREVO_SENDER_EMAIL || 'noreply@graphura.com',
});

/**
 * Send OTP Email via Brevo API
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} adminName - Admin's name for personalization
 */
const sendOTPEmail = async (email, otp, adminName = 'User') => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    // Using Brevo API v3
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Graphura CRM',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@graphura.com',
        },
        to: [
          {
            email,
            name: adminName,
          },
        ],
        subject: 'Your Graphura CRM Registration OTP',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Graphura CRM, ${adminName}!</h2>
            <p>Your OTP for email verification is:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="letter-spacing: 5px; color: #333; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666;">This OTP is valid for 10 minutes only.</p>
            <p style="color: #999; font-size: 12px;">
              If you didn't request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Graphura CRM | Create Bold. Edit Smart. Design Loud.
            </p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    logger.info(`OTP email sent successfully to ${email}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    logger.error('Failed to send OTP email', error.response?.data?.message || error.message);
    throw new Error('Unable to send OTP email. Please try again.');
  }
};

/**
 * Send Registration Confirmation Email
 * @param {string} email - Admin email
 * @param {string} adminName - Admin's name
 * @param {string} companyName - Company name
 */
const sendRegistrationConfirmationEmail = async (email, adminName, companyName) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Graphura CRM',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@graphura.com',
        },
        to: [
          {
            email,
            name: adminName,
          },
        ],
        subject: `${companyName} is now live on Graphura CRM!`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Graphura CRM!</h2>
            <p>Hi ${adminName},</p>
            <p>Your company account <strong>${companyName}</strong> has been successfully created and is now live on Graphura CRM.</p>
            
            <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">Getting Started:</h3>
              <ul style="color: #1b5e20;">
                <li>Log in to your admin dashboard</li>
                <li>Create your team members and departments</li>
                <li>Start managing leads and projects</li>
                <li>Configure your subscription settings</li>
              </ul>
            </div>

            <p>
              <a href="${process.env.FRONTEND_URL}/login" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Go to Dashboard
              </a>
            </p>

            <p style="color: #666;">
              If you have any questions or need assistance, our support team is here to help.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Graphura CRM | Create Bold. Edit Smart. Design Loud.
            </p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Registration confirmation email sent to ${email}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    logger.error('Failed to send confirmation email', error.message);
    // Don't throw here — registration is already complete
  }
};

/**
 * Send Password Reset Link Email
 * @param {string} email - User email
 * @param {string} token - Reset token
 * @param {string} name - User's name
 */
const sendPasswordResetEmail = async (email, token, name = 'User') => {
  try {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Graphura CRM',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@graphura.com',
        },
        to: [
          {
            email,
            name,
          },
        ],
        subject: 'Reset Your Graphura CRM Password',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the link below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666;">This link expires in 30 minutes.</p>
            <p style="color: #d32f2f;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Graphura CRM | Create Bold. Edit Smart. Design Loud.
            </p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Password reset email sent to ${email}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    logger.error('Failed to send password reset email', error.message);
    // Silent fail per requirements to prevent enumeration
    return { success: false, error: 'Brevo API error' };
  }
};

/**
 * Send Password Reset Confirmation Email
 * @param {string} email - User email
 * @param {string} name - User's name
 */
const sendPasswordResetConfirmationEmail = async (email, name = 'User') => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Graphura CRM',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@graphura.com',
        },
        to: [
          {
            email,
            name,
          },
        ],
        subject: 'Your Password Has Been Reset Successfully',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Successful</h2>
            <p>Hi ${name},</p>
            <p>Your password for Graphura CRM has been successfully changed.</p>
            <p style="color: #666;">If you did not make this change, please contact your administrator immediately.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Login</a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Graphura CRM | Create Bold. Edit Smart. Design Loud.
            </p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    logger.info(`Password reset confirmation email sent to ${email}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    logger.error('Failed to send password reset confirmation email', error.message);
    return { success: false, error: 'Brevo API error' };
  }
};

/**
 * Send Prospect Quotation Email
 * @param {object} payload
 * @param {string} payload.email
 * @param {string} payload.clientName
 * @param {string} payload.companyName
 * @param {string} payload.serviceName
 * @param {Array<{title:string,cost:number,description?:string}>} payload.requirements
 * @param {number} payload.baseCost
 * @param {number} payload.discountAmount
 * @param {number} payload.finalAmount
 * @param {string} payload.paymentStatus
 * @param {string} payload.termsAndConditions
 */
const sendProspectQuotationEmail = async (payload) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }
    if (!isValidEmail(payload.email)) {
      throw new Error('Client email is missing or invalid');
    }

    const requirementsRows = (payload.requirements || [])
      .map((item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${item.title || 'Requirement'}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${Number(item.cost || 0).toLocaleString('en-IN')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${item.description || '—'}</td>
        </tr>`)
      .join('');

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: getSender(),
        to: [{ email: payload.email, name: payload.clientName || 'Client' }],
        subject: `${payload.companyName || payload.clientName || 'Your'} quotation from Graphura CRM`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:24px;color:#1f2937;">
            <div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0;">
              <h2 style="margin:0;font-size:22px;">Quotation from Graphura CRM</h2>
              <p style="margin:8px 0 0;color:#cbd5e1;">Prepared for ${payload.clientName || 'your team'}</p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 14px 14px;padding:24px;background:#fff;">
              <p style="margin:0 0 12px;">Hi ${payload.clientName || 'there'},</p>
              <p style="margin:0 0 20px;line-height:1.6;">We reviewed the requirements shared by our finance team and prepared the following scope for ${payload.companyName || 'your project'}.</p>

              <div style="margin:20px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;">
                <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
                  <div><strong>Service</strong><div>${payload.serviceName || 'Custom service package'}</div></div>
                  <div><strong>Payment Status</strong><div>${payload.paymentStatus || 'Unpaid'}</div></div>
                </div>
              </div>

              <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <thead>
                  <tr style="background:#1e293b;color:#fff;">
                    <th style="padding:12px;text-align:left;">Requirement</th>
                    <th style="padding:12px;text-align:right;">Cost</th>
                    <th style="padding:12px;text-align:left;">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${requirementsRows || '<tr><td colspan="3" style="padding:12px;">No detailed requirements were added.</td></tr>'}
                </tbody>
              </table>

              <div style="margin-top:18px;display:grid;gap:8px;">
                <div style="display:flex;justify-content:space-between;"><span>Base Cost</span><strong>₹${Number(payload.baseCost || 0).toLocaleString('en-IN')}</strong></div>
                <div style="display:flex;justify-content:space-between;"><span>Discount</span><strong>- ₹${Number(payload.discountAmount || 0).toLocaleString('en-IN')}</strong></div>
                <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #e5e7eb;"><span>Final Amount</span><strong>₹${Number(payload.finalAmount || 0).toLocaleString('en-IN')}</strong></div>
              </div>

              ${payload.termsAndConditions ? `<div style="margin-top:24px;padding:16px;border-left:4px solid #2563eb;background:#eff6ff;border-radius:8px;"><strong>Terms & Conditions</strong><div style="margin-top:8px;white-space:pre-line;line-height:1.6;">${payload.termsAndConditions}</div></div>` : ''}

              <p style="margin:24px 0 0;line-height:1.6;color:#475569;">Please review and reply if you would like any adjustments. Our team will coordinate the next step promptly.</p>
            </div>
          </div>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const messageId = response.data.messageId || response.data.id || null;
    logger.info(`Prospect quotation email sent to ${payload.email} (${messageId || 'no message id'})`);
    return { success: true, messageId };
  } catch (error) {
    const details = error.response?.data?.message || error.response?.data || error.message;
    logger.error('Failed to send prospect quotation email', details);
    throw new Error(typeof details === 'string' ? details : 'Unable to send prospect quotation email. Please try again.');
  }
};

/**
 * Send Razorpay Payment Link Email
 * @param {object} payload
 * @param {string} payload.email
 * @param {string} payload.clientName
 * @param {string} payload.companyName
 * @param {string} payload.linkUrl
 * @param {number} payload.amount
 * @param {string} payload.referenceId
 */
const sendRazorpayLinkEmail = async (payload) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }
    if (!isValidEmail(payload.email)) {
      throw new Error('Client email is missing or invalid');
    }

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: getSender(),
        to: [{ email: payload.email, name: payload.clientName || 'Client' }],
        subject: `Payment link for ${payload.companyName || payload.clientName || 'your project'}`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#1f2937;">
            <div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0;">
              <h2 style="margin:0;font-size:22px;">Your payment link is ready</h2>
              <p style="margin:8px 0 0;color:#cbd5e1;">Reference: ${payload.referenceId || 'N/A'}</p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 14px 14px;padding:24px;background:#fff;">
              <p style="margin:0 0 12px;">Hi ${payload.clientName || 'there'},</p>
              <p style="margin:0 0 16px;line-height:1.6;">Please use the secure Razorpay link below to complete the payment for ${payload.companyName || 'your project'}.</p>
              <div style="margin:24px 0;text-align:center;">
                <a href="${payload.linkUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;">Pay ${Number(payload.amount || 0).toLocaleString('en-IN')}</a>
              </div>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">If the button doesn't work, copy this link: ${payload.linkUrl}</p>
            </div>
          </div>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const messageId = response.data.messageId || response.data.id || null;
    logger.info(`Razorpay link email sent to ${payload.email} (${messageId || 'no message id'})`);
    return { success: true, messageId };
  } catch (error) {
    const details = error.response?.data?.message || error.response?.data || error.message;
    logger.error('Failed to send Razorpay link email', details);
    throw new Error(typeof details === 'string' ? details : 'Unable to send Razorpay payment link email. Please try again.');
  }
};

module.exports = {
  sendOTPEmail,
  sendRegistrationConfirmationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendProspectQuotationEmail,
  sendRazorpayLinkEmail,
};
