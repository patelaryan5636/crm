const express = require('express');
const router = express.Router();
const bulkLeadUploadController = require('../controllers/bulkLeadUpload.controller');
const { requireUser } = require('../middleware/auth');

// Base path: /api/sales-executive/leads

/**
 * GET /api/sales-executive/leads
 * Fetch all leads assigned to the current Sales Executive
 * Production-level endpoint with status statistics
 */
router.get(
  '/',
  requireUser,
  bulkLeadUploadController.getMyAssignedLeads
);

/**
 * POST /api/sales-executive/leads/:leadId/status
 * Update lead status (TALK, INTERESTED, NOT_TALK, DUMPED)
 * Body: { status: string }
 */
router.post(
  '/:leadId/status',
  requireUser,
  bulkLeadUploadController.updateLeadStatus
);

/**
 * POST /api/sales-executive/leads/:leadId/prospect
 * Create or update prospect form for an interested lead
 */
router.post(
  '/:leadId/prospect',
  requireUser,
  bulkLeadUploadController.saveLeadProspect
);

/**
 * POST /api/sales-executive/leads/:leadId/comment
 * Add follow-up comment to a lead
 * Body: { comment: string, nextFollowUpDate?: ISO string }
 */
router.post(
  '/:leadId/comment',
  requireUser,
  bulkLeadUploadController.addLeadComment
);

/**
 * POST /api/sales-executive/leads/:leadId/reminder
 * Set reminder/follow-up date for a lead
 * Body: { reminderDate: ISO string, description?: string }
 */
router.post(
  '/:leadId/reminder',
  requireUser,
  bulkLeadUploadController.setLeadReminder
);

module.exports = router;
