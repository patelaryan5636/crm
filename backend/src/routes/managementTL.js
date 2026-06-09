const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/managementTL.controller');
const { requireUser } = require('../middleware/auth');

// All routes: /api/management-tl/teams
// Require MANAGEMENT_TL role (enforced inside controller)

router.get('/overview', requireUser, ctrl.getOverview);
router.get('/members',  requireUser, ctrl.getMyTeamMembers);

module.exports = router;
