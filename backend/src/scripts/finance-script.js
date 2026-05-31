const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const { Admin, Department, User } = require("../models");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const admin = await Admin.findOne({
      email: "admin@test.com",
    });

    if (!admin) {
      console.log("Admin not found");
      process.exit(1);
    }

    let financeDept = await Department.findOne({
      admin: admin._id,
      name: "FINANCE",
    });

    // Create FINANCE department if missing
    if (!financeDept) {
      financeDept = await Department.create({
        admin: admin._id,
        name: "FINANCE",
        displayName: "Finance",
        isActive: true,
      });

      console.log("FINANCE department created");
    }

    // Prevent duplicate finance manager
    const existingUser = await User.findOne({
      admin: admin._id,
      email: "finance@test.com",
    });

    if (existingUser) {
      console.log("Finance Manager already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Finance@123", 10);

    const financeManager = await User.create({
      admin: admin._id,
      department: financeDept._id,

      name: "Finance Manager",
      email: "finance@test.com",
      password: hashedPassword,

      phone: "8888888888",

      role: "FINANCE_MANAGER",

      isActive: true,
      approvalStatus: "APPROVED",

      // Skip onboarding
      mustChangePassword: false,
      isFirstLogin: false,

      isProfileComplete: true,
      prereqCompleted: true,
      prereqStep: "completed",

      bankDetails: {
        beneficiaryName: "Finance Manager",
        bankName: "State Bank of India",
        accountNumber: "1234567890",
        ifscCode: "SBIN0001234",
        verified: true,
      },
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
