"use strict";

const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * Razorpay webhook handler
 * Verifies signature, logs webhook, and updates Payment/Prospect/Project atomically
 */

exports.razorpay = catchAsync(async (req, res, next) => {
  const models = require('../models');
  const { WebhookLog, Payment, ProspectForm, Project } = models;

  const ApiConfig = require('../models').ApiConfig;
  const { decrypt } = require('../utils/encrypt');
  const signatureHeader = req.headers['x-razorpay-signature'] || req.headers['x-razorpay-signature'.toLowerCase()];
  const raw = req.rawBody
    ? req.rawBody.toString('utf8')
    : Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : JSON.stringify(req.body || {});
  let isVerified = false;

  const tryVerify = (secret) => {
    try {
      if (!secret) return false;
      const expected = crypto.createHmac('sha256', String(secret).trim()).update(raw).digest('hex');
      return expected === String(signatureHeader || '').trim();
    } catch (err) {
      logger.error('Webhook signature verification attempt failed', err.message || err);
      return false;
    }
  };

  // Try global secrets first
  const globalCandidates = [process.env.RAZORPAY_WEBHOOK_SECRET, process.env.RAZORPAY_KEY_SECRET];
  for (const s of globalCandidates) {
    if (s && tryVerify(s)) {
      isVerified = true;
      break;
    }
  }

  const payload = (() => { try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return req.body || {}; } })();
  // If not verified yet, attempt tenant-scoped secret lookup by finding associated Payment -> admin
  if (!isVerified) {
    try {
      const paymentEntity = payload?.payload?.payment?.entity;
      const linkEntity = payload?.payload?.payment_link?.entity;
      let adminId = null;
      if (paymentEntity) {
        const p = await Payment.findOne({ $or: [{ razorpayPaymentId: paymentEntity.id }, { razorpayOrderId: paymentEntity.order_id }] });
        if (p) adminId = p.admin;
      }
      if (!adminId && linkEntity) {
        const linkId = linkEntity?.id || linkEntity?.short_url;
        const p = await Payment.findOne({ paymentLinkId: linkId });
        if (p) adminId = p.admin;
      }
      if (adminId) {
        const configs = await ApiConfig.find({ admin: adminId, key: { $in: ['RAZORPAY_WEBHOOK_SECRET', 'RAZORPAY_KEY_SECRET'] } });
        const configMap = {};
        (configs || []).forEach((c) => { configMap[c.key] = c.isEncrypted ? decrypt(c.value) : c.value; });
        const tenantCandidates = [configMap.RAZORPAY_WEBHOOK_SECRET, configMap.RAZORPAY_KEY_SECRET];
        for (const s of tenantCandidates) {
          if (s && tryVerify(s)) {
            isVerified = true;
            break;
          }
        }
      }
    } catch (err) {
      logger.error('Tenant secret verification attempt failed', err.message || err);
    }
  }
  const event = payload?.event || (payload?.payload ? Object.keys(payload.payload)[0] : 'razorpay.unknown');

  // Persist webhook log
  const wlog = await WebhookLog.create({ source: 'RAZORPAY', event, payload, rawBody: raw, signature: signatureHeader, isVerified });

  if (!isVerified) {
    wlog.error = 'Signature verification failed';
    await wlog.save();
    logger.warn('Razorpay webhook signature failed');
    return res.status(400).send('signature verification failed');
  }

  // Process known events
  try {
    // Payment captured (classic)
    const paymentEntity = payload?.payload?.payment?.entity;
    const linkEntity = payload?.payload?.payment_link?.entity;

    if (paymentEntity) {
      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id;
      // Find associated Payment
      const payment = await Payment.findOne({ $or: [{ razorpayPaymentId }, { razorpayOrderId }] });
      if (payment) {
        if (payment.status !== 'SUCCESS') {
          payment.status = 'SUCCESS';
          payment.razorpayPaymentId = razorpayPaymentId;
          payment.paidAt = paymentEntity?.created_at ? new Date(paymentEntity.created_at * 1000) : new Date();
          payment.signatureVerified = true;
          payment.webhookVerified = true;
          await payment.save();

          // Mirror to prospect and project atomically
          if (payment.prospectForm) {
            const prospect = await ProspectForm.findById(payment.prospectForm);
            if (prospect) {
              prospect.paymentStatus = 'SUCCESS';
              prospect.paymentVerifiedAt = payment.paidAt || new Date();
              prospect.razorpayPaymentId = razorpayPaymentId;
              prospect.updatedBy = null;
              await prospect.save();
              // Update project paidAmount if there's a project referencing this prospect
              await Project.updateOne({ prospectForm: prospect._id }, { $inc: { paidAmount: payment.amount } });
            }
          }
        }
        wlog.isProcessed = true;
        wlog.processedAt = new Date();
        wlog.razorpayPaymentId = razorpayPaymentId;
        wlog.razorpayOrderId = razorpayOrderId;
        await wlog.save();
        return res.status(200).json({ success: true });
      }
    }

    // Payment link paid event
    if (linkEntity) {
      const linkId = linkEntity?.id || linkEntity?.short_url;
      const payments = await Payment.find({ paymentLinkId: linkId });
      if (payments && payments.length > 0) {
        for (const payment of payments) {
          if (payment.status !== 'SUCCESS') {
            payment.status = 'SUCCESS';
            payment.paidAt = new Date();
            payment.webhookVerified = true;
            await payment.save();
            if (payment.prospectForm) {
              const prospect = await ProspectForm.findById(payment.prospectForm);
              if (prospect) {
                prospect.paymentStatus = 'SUCCESS';
                prospect.paymentVerifiedAt = payment.paidAt;
                prospect.updatedBy = null;
                await prospect.save();
              }
            }
          }
        }
        wlog.isProcessed = true;
        wlog.processedAt = new Date();
        await wlog.save();
        return res.status(200).json({ success: true });
      }
    }

    // Unknown event — mark processed to avoid retries
    wlog.isProcessed = true;
    wlog.processedAt = new Date();
    await wlog.save();
    return res.status(200).json({ success: true, note: 'event noted' });
  } catch (err) {
    logger.error('Failed processing webhook', err.message || err);
    wlog.error = String(err.message || err);
    await wlog.save();
    return res.status(500).json({ success: false });
  }
});
