'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/financeNotification.controller');
const { requireUser } = require('../middleware/auth');

// Base: /api/finance/notifications

router.get ('/',              requireUser, ctrl.getNotifications);
router.get ('/summary',       requireUser, ctrl.getSummary);
router.patch('/read-all',     requireUser, ctrl.markAllRead);
router.patch('/:id/read',     requireUser, ctrl.markRead);
router.delete('/clear-all',   requireUser, ctrl.clearAll);
router.delete('/:id',         requireUser, ctrl.dismiss);

module.exports = router;
