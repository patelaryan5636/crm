require('dotenv').config();
const mongoose = require('mongoose');
(async()=>{
  try{
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DBNAME || undefined });
    const models = require('../src/models');
    const WebhookLog = models.WebhookLog;
    const doc = await WebhookLog.findOne().sort({ createdAt:-1 }).lean();
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  }catch(e){console.error(e);process.exit(1)}
})();
