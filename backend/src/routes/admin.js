const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/leads', requireAdmin, leadController.getAdminLeads);

module.exports = router;
