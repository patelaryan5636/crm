const express = require('express');
const financeController = require('./finance.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware, allowRoles('ADMIN', 'FINANCE', 'MANAGER'));

router.get('/', financeController.getFinanceEntries);
router.get('/:id', financeController.getFinanceEntry);
router.post('/', financeController.createFinanceEntry);
router.patch('/:id', financeController.updateFinanceEntry);
router.delete('/:id', allowRoles('ADMIN', 'FINANCE'), financeController.deleteFinanceEntry);

module.exports = router;
