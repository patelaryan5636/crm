'use strict';

/**
 * SALES EXECUTIVE DASHBOARD ROUTES
 * Base path: /api/sales-executive/dashboard
 *
 * All routes require:
 *  - Valid JWT (requireUser middleware)
 *  - Role: SALES_EXECUTIVE (enforced inside each controller)
 */

const express    = require('express');
const router     = express.Router();
const { requireUser } = require('../middleware/auth');
const ctrl       = require('../controllers/salesExecutiveDashboard.controller');

// ── Apply auth middleware to all dashboard routes ──
router.use(requireUser);

/**
 * GET /api/sales-executive/dashboard/summary
 * KPI cards: totalLeads, todayCalls, conversionRate, pendingFollowUps, dumpLeads
 */
router.get('/summary', ctrl.getSummary);

/**
 * GET /api/sales-executive/dashboard/weekly-trend
 * Line chart: last 7 days — newProspects vs conversions
 */
router.get('/weekly-trend', ctrl.getWeeklyTrend);

/**
 * GET /api/sales-executive/dashboard/prospect-distribution
 * Donut chart: lead status distribution (New / Contacted / Qualified / Closed)
 */
router.get('/prospect-distribution', ctrl.getProspectDistribution);

/**
 * GET /api/sales-executive/dashboard/calls-vs-conversion
 * Horizontal bar chart: last 4 weeks — totalCalls vs conversions
 */
router.get('/calls-vs-conversion', ctrl.getCallsVsConversion);

/**
 * GET /api/sales-executive/dashboard/daily-target
 * Progress bars: calls, prospects, reminders vs daily target
 */
router.get('/daily-target', ctrl.getDailyTarget);

/**
 * GET /api/sales-executive/dashboard/recent-prospects
 * Paginated data table: recent prospect activity
 * Query: page, pageSize, search, status, sortBy, sortDir
 */
router.get('/recent-prospects', ctrl.getRecentProspects);

/**
 * GET /api/sales-executive/dashboard/upcoming-reminders
 * Bottom banner: next N upcoming reminders
 * Query: limit (default 3)
 */
router.get('/upcoming-reminders', ctrl.getUpcomingReminders);

module.exports = router;
