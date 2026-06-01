const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentSuccess.controller');

// PUBLIC — no auth required on any of these routes.
// Razorpay redirects the client (not logged in) to /api/payments/razorpay-success
// after payment. We verify the callback signature and redirect to the frontend.
router.get('/razorpay-success', controller.razorpaySuccess);

// Frontend polls this to check payment status (client is not logged in)
router.get('/status/:prospectId', controller.checkPaymentStatus);

module.exports = router;
