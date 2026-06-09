const express  = require('express');
const router   = express.Router();
const teamCtrl = require('../controllers/managementTL.controller');
const projCtrl = require('../controllers/managementTLProjects.controller');
const { requireUser } = require('../middleware/auth');

// All routes mounted at /api/management-tl
// Role enforced inside each controller (MANAGEMENT_TL only)

// ── Team endpoints ──
router.get('/teams/overview', requireUser, teamCtrl.getOverview);
router.get('/teams/members',  requireUser, teamCtrl.getMyTeamMembers);

// ── Projects ──
router.get('/projects/form-data',   requireUser, projCtrl.getFormData);
router.get('/projects',             requireUser, projCtrl.listMyProjects);
router.get('/projects/:id',         requireUser, projCtrl.getProject);
router.get('/projects/:id/tasks',   requireUser, projCtrl.getProjectTasks);
router.post('/projects/:id/tasks',  requireUser, projCtrl.createTask);

// ── Tasks (cross-project task board) ──
router.get('/tasks',                requireUser, projCtrl.getAllTasks);
router.put('/tasks/:taskId',        requireUser, projCtrl.updateTask);
router.delete('/tasks/:taskId',     requireUser, projCtrl.deleteTask);

module.exports = router;
