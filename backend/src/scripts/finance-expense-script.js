const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const { Admin, User, Expense } = require("../models/index.js");

const EXPENSES = [
  {
    category: "Operations",
    title: "Office Rent",
    amount: 35000,
    status: "Paid",
    notes: "Monthly office rent",
  },
  {
    category: "Marketing",
    title: "Google Ads",
    amount: 18000,
    status: "Paid",
    notes: "Lead generation campaign",
  },
  {
    category: "Technology",
    title: "AWS Hosting",
    amount: 12500,
    status: "Paid",
    notes: "Production infrastructure",
  },
  {
    category: "Technology",
    title: "Software Licenses",
    amount: 8500,
    status: "Unpaid",
    notes: "Annual renewal pending",
  },
  {
    category: "Travel",
    title: "Client Meeting Travel",
    amount: 7200,
    status: "Paid",
    notes: "Delhi client visit",
  },
  {
    category: "Utilities",
    title: "Electricity Bill",
    amount: 6500,
    status: "Paid",
    notes: "Office electricity",
  },
  {
    category: "Utilities",
    title: "Internet Bill",
    amount: 2800,
    status: "Paid",
    notes: "Fiber connection",
  },
  {
    category: "Miscellaneous",
    title: "Stationery",
    amount: 1200,
    status: "Returned",
    notes: "Damaged supplies returned",
  },
  {
    category: "Marketing",
    title: "Facebook Ads",
    amount: 14500,
    status: "Paid",
    notes: "Awareness campaign",
  },
  {
    category: "Salaries",
    title: "Finance Team Salary",
    amount: 90000,
    status: "Paid",
    notes: "Monthly payroll",
  },
];

function randomDateWithin90Days() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 90);

  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);

  return date;
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const admin = await Admin.findOne({
      email: "admin@test.com",
    });

    if (!admin) {
      throw new Error("admin@test.com not found");
    }

    const financeManager = await User.findOne({
      admin: admin._id,
      email: "finance@test.com",
    });

    if (!financeManager) {
      throw new Error("finance@test.com not found");
    }

    const existingExpenses = await Expense.countDocuments({
      admin: admin._id,
      isDeleted: false,
    });

    if (existingExpenses > 0) {
      console.log(
        `Found ${existingExpenses} existing expenses. Skipping seed.`,
      );
      process.exit(0);
    }

    const docs = [];

    for (let i = 0; i < 25; i++) {
      const template = EXPENSES[i % EXPENSES.length];

      docs.push({
        admin: admin._id,
        addedBy: financeManager._id,

        category: template.category,
        title: `${template.title} ${Math.floor(i / 10) + 1}`,
        amount: template.amount + Math.floor(Math.random() * 5000),

        status: template.status,

        expenseDate: randomDateWithin90Days(),

        notes: template.notes,
      });
    }

    await Expense.insertMany(docs);

    console.log("Finance expenses seeded successfully");
    console.log(`Created ${docs.length} expenses`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
