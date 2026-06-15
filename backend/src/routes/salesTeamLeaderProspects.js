const express = require('express');
const router = express.Router();
const salesTeamLeaderController = require('../controllers/salesTeamLeader.controller');
const { requireUser } = require('../middleware/auth');

router.use(requireUser);

router.get('/', salesTeamLeaderController.getProspects);
router.put('/:id', salesTeamLeaderController.updateProspect);

module.exports = router;
