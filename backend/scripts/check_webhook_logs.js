require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DBNAME || undefined });
    const models = require('../src/models');
    const WebhookLog = models.WebhookLog;
    const docs = await WebhookLog.find().sort({ createdAt: -1 }).limit(5).lean();
    console.log('Recent WebhookLog entries:');
    docs.forEach(d => {
      console.log('---');
      console.log('id:', d._id);
      console.log('event:', d.event);
      console.log('isVerified:', d.isVerified);
      console.log('signature:', d.signature);
      console.log('error:', d.error);
      console.log('rawBody:', d.rawBody || '(none)');
      console.log('payload:', JSON.stringify(d.payload));
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
