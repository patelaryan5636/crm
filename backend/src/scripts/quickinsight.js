const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const { Admin, Client, Payment, Invoice } = require("../models");

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

    // Cleanup existing test data
    await Payment.deleteMany({ admin: admin._id });
    await Invoice.deleteMany({ admin: admin._id });

    const existingClients = await Client.find({
      admin: admin._id,
      mobile: {
        $in: ["9000000001", "9000000002", "9000000003"],
      },
    });

    let clients = existingClients;

    if (clients.length < 3) {
      clients = await Client.insertMany([
        {
          admin: admin._id,
          name: "TCS",
          mobile: "9000000001",
          email: "tcs@test.com",
          companyName: "TCS",
          source: "MANUAL",
        },
        {
          admin: admin._id,
          name: "Infosys",
          mobile: "9000000002",
          email: "infosys@test.com",
          companyName: "Infosys",
          source: "MANUAL",
        },
        {
          admin: admin._id,
          name: "Wipro",
          mobile: "9000000003",
          email: "wipro@test.com",
          companyName: "Wipro",
          source: "MANUAL",
        },
      ]);
    }

    const [tcs, infosys, wipro] = clients;

    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // ------------------------------------------------
    // PAYMENTS
    // ------------------------------------------------

    await Payment.insertMany([
      // TCS Total = ₹450,000
      {
        admin: admin._id,
        client: tcs._id,
        amount: 200000,
        paymentType: "FULL",
        paymentProvider: "RAZORPAY",
        status: "SUCCESS",
        signatureVerified: true,
        paidAt: today,
      },
      {
        admin: admin._id,
        client: tcs._id,
        amount: 250000,
        paymentType: "FULL",
        paymentProvider: "RAZORPAY",
        status: "SUCCESS",
        signatureVerified: true,
        paidAt: today,
      },

      // Infosys Total = ₹200,000
      {
        admin: admin._id,
        client: infosys._id,
        amount: 200000,
        paymentType: "FULL",
        paymentProvider: "RAZORPAY",
        status: "SUCCESS",
        signatureVerified: true,
        paidAt: today,
      },

      // Wipro Total = ₹100,000
      {
        admin: admin._id,
        client: wipro._id,
        amount: 100000,
        paymentType: "FULL",
        paymentProvider: "OFFLINE",
        status: "SUCCESS",
        signatureVerified: true,
        paidAt: today,
      },

      // Failed payment (should NOT affect Top Paying Client)
      {
        admin: admin._id,
        client: wipro._id,
        amount: 1000000,
        paymentType: "FULL",
        paymentProvider: "OFFLINE",
        status: "FAILED",
      },

      // Yesterday's huge payment
      // Should NOT affect Highest Payment Today
      {
        admin: admin._id,
        client: infosys._id,
        amount: 500000,
        paymentType: "FULL",
        paymentProvider: "RAZORPAY",
        status: "SUCCESS",
        signatureVerified: true,
        paidAt: yesterday,
      },
    ]);

    // ------------------------------------------------
    // INVOICES
    // ------------------------------------------------

    await Invoice.insertMany([
      {
        admin: admin._id,
        client: tcs._id,

        invoiceNumber: "INV-TEST-001",

        clientName: "TCS",
        clientEmail: "tcs@test.com",
        clientMobile: "9000000001",

        amount: 100000,
        gstAmount: 18000,
        totalAmount: 118000,

        status: "PAID",
      },

      {
        admin: admin._id,
        client: infosys._id,

        invoiceNumber: "INV-TEST-002",

        clientName: "Infosys",
        clientEmail: "infosys@test.com",
        clientMobile: "9000000002",

        amount: 200000,
        gstAmount: 36000,
        totalAmount: 236000,

        status: "PAID",
      },

      {
        admin: admin._id,
        client: wipro._id,

        invoiceNumber: "INV-TEST-003",

        clientName: "Wipro",
        clientEmail: "wipro@test.com",
        clientMobile: "9000000003",

        amount: 300000,
        gstAmount: 54000,
        totalAmount: 354000,

        status: "SENT",
      },
    ]);

    console.log("Quick Insights seed completed successfully");

    console.log(`
Expected Results:

Top Paying Client:
TCS → ₹450000

Most Used Payment Method:
RAZORPAY → 4 payments
(or 3 if counting only SUCCESS payments)

Average Invoice Value:
₹236000

Highest Payment Today:
₹250000 (TCS)
`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
