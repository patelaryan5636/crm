const express = require('express');
const apiConfigController = require('../controllers/apiConfig.controller');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require Admin privileges
router.use(requireAdmin);

router.get('/razorpay', apiConfigController.getRazorpayConfig);
router.get('/razorpay/history', apiConfigController.getRazorpayHistory);
router.post('/razorpay', apiConfigController.updateRazorpayConfig);
router.post('/razorpay/generate-secret', apiConfigController.generateRazorpaySecret);

module.exports = router;
