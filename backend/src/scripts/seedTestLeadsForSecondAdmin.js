const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const {
  Admin,
  Client,
  Lead,
} = require('../models/index');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');

    const admins = await Admin.findActive({}, null, { sort: { createdAt: 1 } }).limit(2);
    if (!admins || admins.length < 2) {
      console.error('Less than 2 admins found in DB. Please ensure a second Admin exists.');
      process.exit(1);
    }

    const admin = admins[1]; // second admin (index 1)
    console.log(`Seeding for Admin: ${admin.email} (${admin._id})`);

    const baseMobile = 9100000000; // different range to avoid collisions with first admin
    const created = [];

    for (let i = 1; i <= 10; i++) {
      const mobile = (baseMobile + i).toString();
      const clientData = {
        admin: admin._id,
        name: `Test Lead 2-${i}`,
        email: `test.lead2.${i}@example.com`,
        mobile,
        companyName: `TestCorp2 ${i}`,
        source: 'MANUAL',
        addedBy: null,
      };

      const client = await Client.findOneAndUpdate(
        { admin: admin._id, mobile },
        { $setOnInsert: clientData },
        { upsert: true, returnDocument: 'after' }
      );

      const leadData = {
        admin: admin._id,
        client: client._id,
        status: 'UNTOUCHED',
      };

      const lead = await Lead.findOneAndUpdate(
        { admin: admin._id, client: client._id },
        { $setOnInsert: leadData },
        { upsert: true, returnDocument: 'after' }
      );

      created.push({ mobile, clientId: client._id.toString(), leadId: lead._id.toString() });
      console.log(`Created/Found lead ${i}: mobile=${mobile} lead=${lead._id}`);
    }

    console.log('Summary:');
    console.table(created);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding test leads for second admin:', err.message);
    process.exit(1);
  }
};

run();
