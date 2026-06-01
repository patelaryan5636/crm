const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentWebhook.controller');

// POST /api/payments/webhook/razorpay
router.post('/razorpay', controller.razorpay);

module.exports = router;
