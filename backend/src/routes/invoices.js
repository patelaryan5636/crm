const express = require('express');
const router = express.Router();
const controller = require('../controllers/invoice.controller');
const { requireUser } = require('../middleware/auth');

// Base: /api/finance/invoices
router.get('/', requireUser, controller.listInvoices);
router.post('/', requireUser, controller.createInvoice);
router.get('/:id', requireUser, controller.getInvoice);
router.put('/:id', requireUser, controller.updateInvoice);
router.delete('/:id', requireUser, controller.cancelInvoice);
router.post('/:id/send', requireUser, controller.sendInvoice);
router.get('/:id/pdf-data', requireUser, controller.getPdfData);

module.exports = router;
