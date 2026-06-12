'use strict';

const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/salesTarget.controller');
const { requireUser } = require('../middleware/auth');

// Base path: /api/targets

// ── TL routes ─────────────────────────────────────────────────────────────────
router.get('/tl/team-members', requireUser, ctrl.getTeamMembers);
router.get('/tl/team',         requireUser, ctrl.getTeamTargets);
router.post('/tl',             requireUser, ctrl.createTarget);
router.put('/tl/:id',          requireUser, ctrl.updateTarget);
router.delete('/tl/:id',       requireUser, ctrl.deleteTarget);

// ── SE routes ─────────────────────────────────────────────────────────────────
router.get('/se/my', requireUser, ctrl.getMyTargets);

// ── Sync (TL / Admin manual trigger) ─────────────────────────────────────────
router.post('/sync', requireUser, ctrl.syncTargetProgress);

module.exports = router;
