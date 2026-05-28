const express = require('express');
const router = express.Router();
const financeProspectController = require('../controllers/financeProspect.controller');
const { requireUser } = require('../middleware/auth');

// Base: /api/finance/prospects
router.get('/', requireUser, financeProspectController.getProspects);
router.post('/:prospectId/send', requireUser, financeProspectController.sendToClient);

module.exports = router;
