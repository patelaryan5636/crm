const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// GET /api/logs/login - Get dynamic, role-scoped login logs and KPIs
router.get('/login', logController.getLoginLogs);

module.exports = router;
