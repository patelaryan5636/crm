const express = require('express');
const router = express.Router();
const hrmController = require('../controllers/hrm.controller');
const { requireUser } = require('../middleware/auth');

/**
 * All attendance routes require a USER token
 */
router.use(requireUser);

router.get('/today', hrmController.getTodayStatus);
router.get('/team', hrmController.getTeamAttendance);
router.post('/clock-in', hrmController.clockIn);
router.post('/clock-out', hrmController.clockOut);
router.post('/break-toggle', hrmController.toggleBreak);

module.exports = router;
