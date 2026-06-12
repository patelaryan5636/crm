const {
  Expense,
  Payment,
  Invoice,
  AuditLog,
  ProspectForm,
  User,
  Client,
  WorkOrder,
} = require("../models/index");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ApiResponse = require("../utils/apiResponse");
const mongoose = require("mongoose");

exports.getDashboardData = catchAsync(async (req, res, next) => {
  // Use a more robust way to get adminId
  const adminId = req.admin?._id || req.user?.admin?._id || req.user?.admin;
  if (!adminId) return next(new AppError("Admin context not found", 400));

  const mongoAdminId = new mongoose.Types.ObjectId(adminId);
  console.log(`[FinanceDashboard] Fetching data for adminId: ${adminId}`);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // 1. Recent Payments - Fetch directly from Payment model for accuracy
  const recentPayments = await Payment.find({ admin: adminId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("client", "name")
    .populate("prospectForm", "contactPerson")
    .lean();

  console.log(`[FinanceDashboard] Found ${recentPayments.length} payments`);

  const formattedPayments = recentPayments.map((p) => ({
    client: p.client?.name || p.prospectForm?.contactPerson || "Client",
    invoiceId: p.razorpayOrderId || "N/A",
    amount: `₹${(p.amount || 0).toLocaleString()}`,
    paymentType: p.paymentType === "PARTIAL" ? "Partial" : "Full",
    method:
      p.paymentProvider === "OFFLINE"
        ? "Global Payment"
        : p.paymentProvider || "Razorpay",
    status:
      p.status === "SUCCESS"
        ? "Successful"
        : p.status.charAt(0) + p.status.slice(1).toLowerCase(),
    date: formatDate(p.paidAt || p.createdAt),
  }));

  // 2. Recent Invoices
  const recentInvoices = await Invoice.find({ admin: adminId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("client", "name")
    .lean();

  const formattedInvoices = recentInvoices.map((inv) => ({
    id: inv.invoiceNumber,
    client: inv.clientName || inv.client?.name || "Unknown",
    amount: `₹${(inv.amount || 0).toLocaleString()}`,
    gst: `₹${(inv.gstAmount || 0).toLocaleString()}`,
    total: `₹${(inv.totalAmount || 0).toLocaleString()}`,
    paymentType: "Full",
    status: inv.status.charAt(0) + inv.status.slice(1).toLowerCase(),
    dueDate: formatDate(inv.dueDate),
    date: formatDate(inv.createdAt),
  }));

  // 3. Recent Activities (Merged from multiple sources)
  const [auditLogs, latestWorkOrders, latestExpenses] = await Promise.all([
    AuditLog.find({ admin: adminId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("performedBy", "name")
      .lean(),
    WorkOrder.find({ admin: adminId }).sort({ createdAt: -1 }).limit(10).lean(),
    Expense.find({ admin: adminId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("addedBy", "name")
      .lean(),
  ]);

  let activities = [];

  // From Audit Logs
  auditLogs.forEach((log) => {
    let type = "General";
    if (log.action.includes("PAYMENT")) type = "Payment";
    else if (log.action.includes("INVOICE")) type = "Invoice";
    else if (log.action.includes("WORK_ORDER")) type = "Work Order";
    else if (log.action.includes("PROJECT")) type = "Project";
    else if (log.action.includes("EXPENSE")) type = "Expense";

    activities.push({
      id: String(log._id).slice(-6).toUpperCase(),
      activity: log.note || log.action.replace(/_/g, " "),
      type,
      user: log.performedBy?.name || "System",
      date: formatDate(log.createdAt),
      status: "Completed",
      _timestamp: log.createdAt,
    });
  });

  // From Payments
  recentPayments.slice(0, 5).forEach((p) => {
    activities.push({
      id: String(p._id).slice(-6).toUpperCase(),
      activity: `Payment of ₹${(p.amount || 0).toLocaleString()} ${p.status === "SUCCESS" ? "received from" : "status updated for"} ${p.client?.name || p.prospectForm?.contactPerson || "Client"}`,
      type: "Payment",
      user: "System",
      date: formatDate(p.createdAt),
      status: p.status === "SUCCESS" ? "Completed" : "Pending",
      _timestamp: p.createdAt,
    });
  });

  // From Invoices
  recentInvoices.slice(0, 5).forEach((inv) => {
    activities.push({
      id: String(inv._id).slice(-6).toUpperCase(),
      activity: `Invoice ${inv.invoiceNumber} created for ${inv.clientName || inv.client?.name || "Client"}`,
      type: "Invoice",
      user: "Finance Manager",
      date: formatDate(inv.createdAt),
      status: "Completed",
      _timestamp: inv.createdAt,
    });
  });

  // From Work Orders
  latestWorkOrders.forEach((wo) => {
    activities.push({
      id: String(wo._id).slice(-6).toUpperCase(),
      activity: `Work Order ${wo.woNumber} ${wo.isApproved ? "approved" : "generated"} for ${wo.clientName || "Client"}`,
      type: "Work Order",
      user: "Finance Manager",
      date: formatDate(wo.createdAt),
      status: wo.isApproved ? "Completed" : "Pending",
      _timestamp: wo.createdAt,
    });
  });

  // From Expenses
  latestExpenses.forEach((exp) => {
    activities.push({
      id: String(exp._id).slice(-6).toUpperCase(),
      activity: `Expense "${exp.title}" of ₹${(exp.amount || 0).toLocaleString()} added to ${exp.category}`,
      type: "Expense",
      user: exp.addedBy?.name || "Finance Manager",
      date: formatDate(exp.expenseDate || exp.createdAt),
      status: exp.status === "Paid" ? "Completed" : "Pending",
      _timestamp: exp.createdAt,
    });
  });

  const sortedActivities = activities
    .sort((a, b) => new Date(b._timestamp) - new Date(a._timestamp))
    .slice(0, 10);

  // 4. KPIs
  const totalRevenueAgg = await Payment.aggregate([
    { $match: { admin: mongoAdminId, status: "SUCCESS" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  const pendingPaymentsCount = await Payment.countDocuments({
    admin: adminId,
    status: "PENDING",
  });
  const failedPaymentsCount = await Payment.countDocuments({
    admin: adminId,
    status: "FAILED",
  });

  const totalExpensesAgg = await Expense.aggregate([
    { $match: { admin: mongoAdminId, isDeleted: false, status: "Paid" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalExpenses = totalExpensesAgg[0]?.total || 0;

  const totalInvoicesCount = await Invoice.countDocuments({ admin: adminId });
  const paidInvoicesCount = await Invoice.countDocuments({
    admin: adminId,
    status: "PAID",
  });

  const kpiData = [
    {
      title: "Total Revenue",
      value: `₹${Number(totalRevenue).toLocaleString("en-IN")}`,
      sub: "Total settled",
    },
    {
      title: "Pending Payments",
      value: String(pendingPaymentsCount),
      sub: "Awaiting clearance",
    },
    {
      title: "Failed Payments",
      value: String(failedPaymentsCount),
      sub: "Needs attention",
    },
    {
      title: "Total Expenses",
      value: `₹${Number(totalExpenses).toLocaleString("en-IN")}`,
      sub: "Paid expenses",
    },
    {
      title: "Net Profit",
      value: `₹${Number(totalRevenue - totalExpenses).toLocaleString("en-IN")}`,
      sub: "Revenue - Expenses",
    },
    {
      title: "Total Invoices",
      value: String(totalInvoicesCount),
      sub: "All time",
    },
    {
      title: "Paid Invoices",
      value: String(paidInvoicesCount),
      sub: "Fully settled",
    },
    {
      title: "Unpaid Invoices",
      value: String(totalInvoicesCount - paidInvoicesCount),
      sub: "Awaiting payment",
    },
  ];

  // 5. Chart Data: Expense by Category
  const expenseByCat = await Expense.aggregate([
    { $match: { admin: mongoAdminId, isDeleted: false } },
    { $group: { _id: "$category", value: { $sum: "$amount" } } },
    { $project: { _id: 0, name: "$_id", value: 1 } },
  ]);

  // 6. Chart Data: Payment Status
  const paymentStatusAgg = await Payment.aggregate([
    { $match: { admin: mongoAdminId } },
    { $group: { _id: "$status", value: { $sum: 1 } } },
    { $project: { _id: 0, name: "$_id", value: 1 } },
  ]);

  const statusMap = {
    SUCCESS: "Successful Payments",
    PENDING: "Pending Payments",
    FAILED: "Failed Payments",
    PARTIAL: "Partial Payments",
  };

  const paymentStatusData = paymentStatusAgg.map((item) => ({
    name: statusMap[item.name] || item.name,
    value: item.value,
  }));

  // 7. Chart Data: Monthly Revenue, Expense, and Profit comparison (in ₹ Lakhs)
  const currentYear = new Date().getFullYear();

  const monthlyRevenueAgg = await Payment.aggregate([
    {
      $match: {
        admin: mongoAdminId,
        status: "SUCCESS",
      },
    },
    {
      $project: {
        month: { $month: { $ifNull: ["$paidAt", "$createdAt"] } },
        year: { $year: { $ifNull: ["$paidAt", "$createdAt"] } },
        amount: 1,
      },
    },
    {
      $match: {
        year: currentYear,
      },
    },
    {
      $group: {
        _id: "$month",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const monthlyExpensesAgg = await Expense.aggregate([
    {
      $match: {
        admin: mongoAdminId,
        isDeleted: false,
        status: "Paid",
      },
    },
    {
      $project: {
        month: { $month: { $ifNull: ["$expenseDate", "$createdAt"] } },
        year: { $year: { $ifNull: ["$expenseDate", "$createdAt"] } },
        amount: 1,
      },
    },
    {
      $match: {
        year: currentYear,
      },
    },
    {
      $group: {
        _id: "$month",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyDataMap = {};
  monthNames.forEach((name, index) => {
    monthlyDataMap[index + 1] = {
      name,
      revenue: 0,
      expense: 0,
      profit: 0,
    };
  });

  monthlyRevenueAgg.forEach((item) => {
    const monthNum = item._id;
    if (monthlyDataMap[monthNum]) {
      monthlyDataMap[monthNum].revenue = Number(
        (item.total / 100000).toFixed(2),
      );
    }
  });

  monthlyExpensesAgg.forEach((item) => {
    const monthNum = item._id;
    if (monthlyDataMap[monthNum]) {
      monthlyDataMap[monthNum].expense = Number(
        (item.total / 100000).toFixed(2),
      );
    }
  });

  monthNames.forEach((_, index) => {
    const monthNum = index + 1;
    const rev = monthlyDataMap[monthNum].revenue;
    const exp = monthlyDataMap[monthNum].expense;
    monthlyDataMap[monthNum].profit = Number((rev - exp).toFixed(2));
  });

  const revenueExpenseData = Object.values(monthlyDataMap);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        recentPayments: formattedPayments,
        recentInvoices: formattedInvoices,
        recentActivities: sortedActivities,
        kpiData: kpiData,
        expenseByCat,
        paymentStatusData,
        revenueExpenseData,
      },
      "Dashboard data fetched successfully",
    ),
  );
});

exports.getExpenses = catchAsync(async (req, res, next) => {
  const expenses = await Expense.find({
    admin: req.admin._id,
    isDeleted: false,
  })
    .sort({ expenseDate: -1 })
    .populate("addedBy", "name");

  let totalExpenses = expenses.length;
  let paid = 0;
  let unpaid = 0;
  let returned = 0;
  let monthlyExpense = 0;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  expenses.forEach((expense) => {
    if (expense.status === "Paid") paid++;
    if (expense.status === "Unpaid") unpaid++;
    if (expense.status === "Returned") returned++;

    const expDate = new Date(expense.expenseDate);
    if (
      expDate.getMonth() === currentMonth &&
      expDate.getFullYear() === currentYear
    ) {
      monthlyExpense += expense.amount;
    }
  });

  const stats = {
    totalExpenses,
    paid,
    unpaid,
    returned,
    monthlyExpense,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { expenses, stats },
        "Expenses fetched successfully",
      ),
    );
});

exports.createExpense = catchAsync(async (req, res, next) => {
  const { category, title, amount, status, expenseDate, notes } = req.body;

  if (!category || !title || amount === undefined || !expenseDate) {
    return next(new AppError("Missing required fields", 400));
  }

  const expense = await Expense.create({
    admin: req.admin._id,
    addedBy: req.user._id,
    category,
    title,
    amount,
    status: status || "Unpaid",
    expenseDate,
    notes: notes || "",
  });

  await AuditLog.create({
    admin: req.admin._id,
    performedBy: req.user._id,
    performerType: req.userType,
    action: "EXPENSE_CREATED",
    targetModel: "Expense",
    targetId: expense._id,
    note: `Expense "${title}" of ₹${Number(amount).toLocaleString()} created in ${category}`,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { expense }, "Expense created successfully"));
});

exports.updateExpense = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const expense = await Expense.findOne({
    _id: id,
    admin: req.admin._id,
    isDeleted: false,
  });

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  const oldStatus = expense.status;
  const updatableFields = [
    "category",
    "title",
    "amount",
    "status",
    "expenseDate",
    "notes",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      expense[field] = req.body[field];
    }
  });

  await expense.save();

  await AuditLog.create({
    admin: req.admin._id,
    performedBy: req.user._id,
    performerType: req.userType,
    action: "EXPENSE_UPDATED",
    targetModel: "Expense",
    targetId: expense._id,
    note: `Expense "${expense.title}" updated. Status changed from ${oldStatus} to ${expense.status}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { expense }, "Expense updated successfully"));
});

exports.deleteExpense = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const expense = await Expense.findOne({
    _id: id,
    admin: req.admin._id,
    isDeleted: false,
  });

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  expense.isDeleted = true;
  await expense.save();

  await AuditLog.create({
    admin: req.admin._id,
    performedBy: req.user._id,
    performerType: req.userType,
    action: "EXPENSE_DELETED",
    targetModel: "Expense",
    targetId: expense._id,
    note: `Expense "${expense.title}" of ₹${Number(expense.amount).toLocaleString()} deleted`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Expense deleted successfully"));
});

exports.getExpenseChart = catchAsync(async (req, res, next) => {
  const chartData = await Expense.aggregate([
    {
      $match: {
        admin: req.admin._id,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$category",
        value: { $sum: "$amount" },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        value: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        chartData,
        "Expense chart data fetched successfully",
      ),
    );
});

exports.getQuickInsights = catchAsync(async (req, res, next) => {
  const adminId = req.admin?._id || req.user?.admin?._id || req.user?.admin;
  if (!adminId) return next(new AppError("Admin context not found", 400));

  const mongoAdminId = new mongoose.Types.ObjectId(adminId);

  // Helper to get today's start and end date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Top Paying Client
  const topClientAgg = await Payment.aggregate([
    { $match: { admin: mongoAdminId, status: "SUCCESS" } },
    { $group: { _id: "$client", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: "clients",
        localField: "_id",
        foreignField: "_id",
        as: "clientData",
      },
    },
  ]);

  let topClientLabel = "Top Paying Client";
  let topClientValue = "N/A";
  let topClientSub = "₹0 paid";

  if (
    topClientAgg.length > 0 &&
    topClientAgg[0].clientData &&
    topClientAgg[0].clientData.length > 0
  ) {
    const clientName =
      topClientAgg[0].clientData[0].companyName ||
      topClientAgg[0].clientData[0].name ||
      topClientAgg[0].clientData[0].email ||
      "Unknown Client";
    topClientValue = clientName;
    topClientSub = `₹${topClientAgg[0].total.toLocaleString("en-IN")} paid`;
  }

  // 2. Most Used Payment Method
  const topMethodAgg = await Payment.aggregate([
    { $match: { admin: mongoAdminId, status: "SUCCESS" } },
    { $group: { _id: "$paymentProvider", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  let topMethodLabel = "Most Used Payment Method";
  let topMethodValue = "N/A";
  let topMethodSub = "Used in 0 payments";

  if (topMethodAgg.length > 0 && topMethodAgg[0]._id) {
    let method = topMethodAgg[0]._id;
    if (method === "OFFLINE") method = "Global Payment";
    topMethodValue = method;
    topMethodSub = `Used in ${topMethodAgg[0].count} payments`;
  }

  // 3. Average Invoice Value
  const avgInvoiceAgg = await Invoice.aggregate([
    { $match: { admin: mongoAdminId } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    },
  ]);

  let avgInvoiceLabel = "Average Invoice";
  let avgInvoiceValue = "₹0";
  let avgInvoiceSub = "Per Invoice";

  if (avgInvoiceAgg.length > 0 && avgInvoiceAgg[0].count > 0) {
    const avg = Math.round(
      avgInvoiceAgg[0].totalAmount / avgInvoiceAgg[0].count,
    );
    avgInvoiceValue = `₹${avg.toLocaleString("en-IN")}`;
  }

  // 4. Highest Payment Today
  const highestPaymentTodayAgg = await Payment.aggregate([
    {
      $match: {
        admin: mongoAdminId,
        status: "SUCCESS",
        paidAt: { $gte: today, $lte: endOfDay },
      },
    },
    { $sort: { amount: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: "clients",
        localField: "client",
        foreignField: "_id",
        as: "clientData",
      },
    },
  ]);

  let highestPaymentLabel = "Highest Payment Today";
  let highestPaymentValue = "₹0";
  let highestPaymentSub = "No payments today";

  if (highestPaymentTodayAgg.length > 0) {
    const payment = highestPaymentTodayAgg[0];
    highestPaymentValue = `₹${payment.amount.toLocaleString("en-IN")}`;
    if (payment.clientData && payment.clientData.length > 0) {
      highestPaymentSub =
        payment.clientData[0].name ||
        payment.clientData[0].companyName ||
        "Unknown Client";
    } else {
      highestPaymentSub = "Client";
    }
  }

  const quickInsights = [
    { label: topClientLabel, value: topClientValue, sub: topClientSub },
    { label: topMethodLabel, value: topMethodValue, sub: topMethodSub },
    { label: avgInvoiceLabel, value: avgInvoiceValue, sub: avgInvoiceSub },
    {
      label: highestPaymentLabel,
      value: highestPaymentValue,
      sub: highestPaymentSub,
    },
  ];

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { quickInsights },
        "Quick Insights fetched successfully",
      ),
    );
});
