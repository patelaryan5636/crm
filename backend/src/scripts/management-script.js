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

    let managementDept = await Department.findOne({
      admin: admin._id,
      name: "MANAGEMENT",
    });

    // Create MANAGEMENT department if missing
    if (!managementDept) {
      managementDept = await Department.create({
        admin: admin._id,
        name: "MANAGEMENT",
        displayName: "Management",
        isActive: true,
      });

      console.log("MANAGEMENT department created");
    }

    // Prevent duplicate seeding
    const existingManager = await User.findOne({
      admin: admin._id,
      email: "management.manager@test.com",
    });

    if (existingManager) {
      console.log("Management hierarchy already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Management@123", 10);

    // =====================================================
    // MANAGEMENT MANAGER
    // =====================================================
    const manager = await User.create({
      admin: admin._id,
      department: managementDept._id,

      name: "Management Manager",
      email: "management.manager@test.com",
      password: hashedPassword,

      phone: "9000000001",

      role: "MANAGEMENT_MANAGER",

      isActive: true,
      approvalStatus: "APPROVED",

      mustChangePassword: false,
      isFirstLogin: false,

      isProfileComplete: true,
      prereqCompleted: true,
      prereqStep: "completed",

      bankDetails: {
        beneficiaryName: "Management Manager",
        bankName: "State Bank of India",
        accountNumber: "1234567891",
        ifscCode: "SBIN0001234",
        verified: true,
      },
    });

    console.log("Management Manager created");

    // =====================================================
    // MANAGEMENT TEAM LEADER
    // =====================================================
    const teamLeader = await User.create({
      admin: admin._id,
      department: managementDept._id,

      name: "Management Team Leader",
      email: "management.tl@test.com",
      password: hashedPassword,

      phone: "9000000002",

      role: "MANAGEMENT_TL",

      manager: manager._id,

      isActive: true,
      approvalStatus: "APPROVED",

      mustChangePassword: false,
      isFirstLogin: false,

      isProfileComplete: true,
      prereqCompleted: true,
      prereqStep: "completed",

      bankDetails: {
        beneficiaryName: "Management TL",
        bankName: "State Bank of India",
        accountNumber: "1234567892",
        ifscCode: "SBIN0001234",
        verified: true,
      },
    });

    console.log("Management TL created");

    // =====================================================
    // MANAGEMENT EMPLOYEE
    // =====================================================
    const employee = await User.create({
      admin: admin._id,
      department: managementDept._id,

      name: "Management Employee",
      email: "management.employee@test.com",
      password: hashedPassword,

      phone: "9000000003",

      role: "MANAGEMENT_EMPLOYEE",

      manager: teamLeader._id,

      isActive: true,
      approvalStatus: "APPROVED",

      mustChangePassword: false,
      isFirstLogin: false,

      isProfileComplete: true,
      prereqCompleted: true,
      prereqStep: "completed",

      bankDetails: {
        beneficiaryName: "Management Employee",
        bankName: "State Bank of India",
        accountNumber: "1234567893",
        ifscCode: "SBIN0001234",
        verified: true,
      },
    });

    console.log("Management Employee created");

    console.log("\nManagement hierarchy seeded successfully");
    console.log({
      manager: manager.email,
      teamLeader: teamLeader.email,
      employee: employee.email,
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
