const express = require('express');
const superAdminController = require('../controllers/superadmin.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public route
router.post('/login', superAdminController.login);

// Protected route (Super Admin only)
// Note: You'll need to update the requireAuth middleware to handle SUPER_ADMIN
router.get('/admin-login-logs', requireAuth, superAdminController.getAdminLoginLogs);

module.exports = router;
