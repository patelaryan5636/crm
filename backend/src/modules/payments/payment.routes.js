const express = require('express');
const paymentController = require('./payment.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware, allowRoles('ADMIN', 'MANAGER', 'FINANCE'));

router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPayment);
router.post('/', paymentController.createPayment);
router.patch('/:id', paymentController.updatePayment);
router.delete('/:id', allowRoles('ADMIN', 'FINANCE'), paymentController.deletePayment);

module.exports = router;
