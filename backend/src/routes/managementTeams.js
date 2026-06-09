const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/managementTeam.controller');
const { requireUser } = require('../middleware/auth');

// All routes: /api/management/teams
// Require MANAGEMENT_MANAGER role (enforced inside controller)

router.get('/overview',                     requireUser, ctrl.getOverview);
router.get('/leaders',                      requireUser, ctrl.getLeaders);
router.get('/employees',                    requireUser, ctrl.getEmployees);

router.get('/',                             requireUser, ctrl.listTeams);
router.post('/',                            requireUser, ctrl.createTeam);
router.get('/:id',                          requireUser, ctrl.getTeam);
router.put('/:id',                          requireUser, ctrl.updateTeam);
router.delete('/:id',                       requireUser, ctrl.deleteTeam);
router.post('/:id/members',                 requireUser, ctrl.addMember);
router.delete('/:id/members/:userId',       requireUser, ctrl.removeMember);
router.get('/:id/available-employees',      requireUser, ctrl.getAvailableEmployees);

module.exports = router;
