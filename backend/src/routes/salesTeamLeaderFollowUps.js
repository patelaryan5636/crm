const express = require('express');
const router = express.Router();
const salesTeamLeaderController = require('../controllers/salesTeamLeader.controller');
const { requireUser } = require('../middleware/auth');

router.use(requireUser);

router.get('/', salesTeamLeaderController.getFollowUps);
router.post('/', salesTeamLeaderController.addFollowUp);
router.patch('/:id/done', salesTeamLeaderController.markFollowUpDone);
router.put('/:id/reschedule', salesTeamLeaderController.rescheduleFollowUp);

module.exports = router;
