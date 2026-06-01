const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workOrder.controller');
const { requireUser } = require('../middleware/auth');

// Base: /api/management/work-orders  (Management Manager / TL / Employee)
router.get('/',     requireUser, ctrl.listForManagement);
router.get('/:id',  requireUser, ctrl.getForManagement);

module.exports = router;
