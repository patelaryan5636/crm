const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { hashPassword } = require('../services/auth.service');
const { SuperAdmin } = require('../models/index');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedSuperAdmin = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const email = 'superadmin@graphura.com';
    const password = 'SuperAdmin@2026'; // You can change this later

    const existing = await SuperAdmin.findOne({ email });
    if (existing) {
      console.log('⚠️ Super Admin already exists.');
      process.exit(0);
    }

    const hashedPassword = await hashPassword(password);

    await SuperAdmin.create({
      name: 'Main Super Admin',
      email: email,
      password: hashedPassword,
      isActive: true,
    });

    console.log('-----------------------------------------------');
    console.log('✅ Super Admin Seeded Successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('-----------------------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
