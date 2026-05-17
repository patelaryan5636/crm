const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// GET /api/leaves/my - Get current user's leaves
router.get('/my', leaveController.getMyLeaves);

// GET /api/leaves/team - Get department/team leaves (Manager/TL)
router.get('/team', leaveController.getTeamLeaves);

// POST /api/leaves - Apply for leave
router.post('/', leaveController.applyLeave);

// PATCH /api/leaves/:id/status - Approve/Reject leave
router.patch('/:id/status', leaveController.updateLeaveStatus);

// DELETE /api/leaves/:id - Cancel pending leave
router.delete('/:id', leaveController.deleteLeave);

module.exports = router;
