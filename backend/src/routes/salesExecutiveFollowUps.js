'use strict';

const express = require('express');
const router  = express.Router();
const followUpController = require('../controllers/followUp.controller');
const { requireUser } = require('../middleware/auth');

// Base path: /api/sales-executive/follow-ups

/**
 * GET /api/sales-executive/follow-ups
 * Fetch all follow-up reminders for the current Sales Executive.
 * Scoped to: admin (tenant) + user (this executive)
 * Query params: type, status, dateFrom, dateTo
 */
router.get('/', requireUser, followUpController.getMyFollowUps);

/**
 * PATCH /api/sales-executive/follow-ups/:id/done
 * Mark a follow-up reminder as done.
 * Only the owner can mark their own reminder done.
 */
router.patch('/:id/done', requireUser, followUpController.markFollowUpDone);

module.exports = router;
