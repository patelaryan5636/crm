const express = require('express');
const leadController = require('./lead.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', allowRoles('ADMIN', 'MANAGER', 'SALES'), leadController.getLeads);
router.get('/:id', allowRoles('ADMIN', 'MANAGER', 'SALES'), leadController.getLead);
router.post('/', allowRoles('ADMIN', 'MANAGER', 'SALES'), leadController.createLead);
router.patch('/:id', allowRoles('ADMIN', 'MANAGER', 'SALES'), leadController.updateLead);
router.delete('/:id', allowRoles('ADMIN', 'MANAGER'), leadController.deleteLead);

module.exports = router;
