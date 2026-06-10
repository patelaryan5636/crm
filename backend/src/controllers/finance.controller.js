const { Expense, Payment, Invoice, AuditLog, ProspectForm, User, Client, WorkOrder } = require("../models/index");
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
    id: String(p._id),
    client: p.client?.name || p.prospectForm?.contactPerson || "Client",
    invoiceId: p.razorpayOrderId || "N/A",
    amount: `₹${(p.amount || 0).toLocaleString()}`,
    paymentType: p.paymentType === "PARTIAL" ? "Partial" : "Full",
    method: p.paymentProvider === "OFFLINE" ? "Global Payment" : (p.paymentProvider || "Razorpay"),
    status: p.status === "SUCCESS" ? "Successful" : p.status.charAt(0) + p.status.slice(1).toLowerCase(),
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
    AuditLog.find({ admin: adminId }).sort({ createdAt: -1 }).limit(10).populate("performedBy", "name").lean(),
    WorkOrder.find({ admin: adminId }).sort({ createdAt: -1 }).limit(10).lean(),
    Expense.find({ admin: adminId, isDeleted: false }).sort({ createdAt: -1 }).limit(10).populate("addedBy", "name").lean(),
  ]);

  let activities = [];

  // From Audit Logs
  auditLogs.forEach(log => {
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
      _timestamp: log.createdAt
    });
  });

  // From Payments
  recentPayments.slice(0, 5).forEach(p => {
    activities.push({
      id: String(p._id).slice(-6).toUpperCase(),
      activity: `Payment of ₹${(p.amount || 0).toLocaleString()} ${p.status === 'SUCCESS' ? 'received from' : 'status updated for'} ${p.client?.name || p.prospectForm?.contactPerson || 'Client'}`,
      type: "Payment",
      user: "System",
      date: formatDate(p.createdAt),
      status: p.status === 'SUCCESS' ? "Completed" : "Pending",
      _timestamp: p.createdAt
    });
  });

  // From Invoices
  recentInvoices.slice(0, 5).forEach(inv => {
    activities.push({
      id: String(inv._id).slice(-6).toUpperCase(),
      activity: `Invoice ${inv.invoiceNumber} created for ${inv.clientName || inv.client?.name || 'Client'}`,
      type: "Invoice",
      user: "Finance Manager",
      date: formatDate(inv.createdAt),
      status: "Completed",
      _timestamp: inv.createdAt
    });
  });

  // From Work Orders
  latestWorkOrders.forEach(wo => {
    activities.push({
      id: String(wo._id).slice(-6).toUpperCase(),
      activity: `Work Order ${wo.woNumber} ${wo.isApproved ? 'approved' : 'generated'} for ${wo.clientName || 'Client'}`,
      type: "Work Order",
      user: "Finance Manager",
      date: formatDate(wo.createdAt),
      status: wo.isApproved ? "Completed" : "Pending",
      _timestamp: wo.createdAt
    });
  });

  // From Expenses
  latestExpenses.forEach(exp => {
    activities.push({
      id: String(exp._id).slice(-6).toUpperCase(),
      activity: `Expense "${exp.title}" of ₹${(exp.amount || 0).toLocaleString()} added to ${exp.category}`,
      type: "Expense",
      user: exp.addedBy?.name || "Finance Manager",
      date: formatDate(exp.expenseDate || exp.createdAt),
      status: exp.status === 'Paid' ? "Completed" : "Pending",
      _timestamp: exp.createdAt
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

  const pendingPaymentsCount = await Payment.countDocuments({ admin: adminId, status: "PENDING" });
  const failedPaymentsCount = await Payment.countDocuments({ admin: adminId, status: "FAILED" });

  const totalExpensesAgg = await Expense.aggregate([
    { $match: { admin: mongoAdminId, isDeleted: false, status: "Paid" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalExpenses = totalExpensesAgg[0]?.total || 0;

  const totalInvoicesCount = await Invoice.countDocuments({ admin: adminId });
  const paidInvoicesCount = await Invoice.countDocuments({ admin: adminId, status: "PAID" });

  const kpiData = [
    { title: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(2)}L`, sub: "Total settled" },
    { title: "Pending Payments", value: String(pendingPaymentsCount), sub: "Awaiting clearance" },
    { title: "Failed Payments", value: String(failedPaymentsCount), sub: "Needs attention" },
    { title: "Total Expenses", value: `₹${(totalExpenses / 100000).toFixed(2)}L`, sub: "Paid expenses" },
    { title: "Net Profit", value: `₹${((totalRevenue - totalExpenses) / 100000).toFixed(2)}L`, sub: "Revenue - Expenses" },
    { title: "Total Invoices", value: String(totalInvoicesCount), sub: "All time" },
    { title: "Paid Invoices", value: String(paidInvoicesCount), sub: "Fully settled" },
    { title: "Unpaid Invoices", value: String(totalInvoicesCount - paidInvoicesCount), sub: "Awaiting payment" },
  ];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        recentPayments: formattedPayments,
        recentInvoices: formattedInvoices,
        recentActivities: sortedActivities,
        kpiData: kpiData,
      },
      "Dashboard data fetched successfully"
    )
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

  return res.status(200).json(
    new ApiResponse(
      200,
      { expenses, stats },
      "Expenses fetched successfully"
    )
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

  return res.status(201).json(
    new ApiResponse(201, { expense }, "Expense created successfully")
  );
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
  const updatableFields = ["category", "title", "amount", "status", "expenseDate", "notes"];
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

  return res.status(200).json(
    new ApiResponse(200, { expense }, "Expense updated successfully")
  );
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

  return res.status(200).json(
    new ApiResponse(200, null, "Expense deleted successfully")
  );
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

  return res.status(200).json(
    new ApiResponse(200, chartData, "Expense chart data fetched successfully")
  );
});
