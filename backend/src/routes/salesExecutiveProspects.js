const express = require('express');
const router = express.Router();
const salesExecutiveProspectController = require('../controllers/salesExecutiveProspect.controller');
const { requireUser } = require('../middleware/auth');

// Base path: /api/sales-executive/prospects

router.get('/', requireUser, salesExecutiveProspectController.getMyProspects);

router.get('/:prospectId', requireUser, salesExecutiveProspectController.getProspectById);

router.put('/:prospectId', requireUser, salesExecutiveProspectController.updateProspect);

module.exports = router;
