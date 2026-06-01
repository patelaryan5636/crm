require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DBNAME || undefined });
    const models = require('../src/models');
    const WebhookLog = models.WebhookLog;
    const doc = await WebhookLog.findOne().sort({ createdAt: -1 }).lean();
    if (!doc) return console.log('No webhook logs');
    const raw = typeof doc.payload === 'string' ? doc.payload : JSON.stringify(doc.payload);
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const expected = crypto.createHmac('sha256', String(secret).trim()).update(raw).digest('hex');
    console.log('Stored signature:', doc.signature);
    console.log('Computed expected:', expected);
    console.log('Raw payload:', raw);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
