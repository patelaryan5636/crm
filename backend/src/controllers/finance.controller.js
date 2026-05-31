const { Expense } = require("../models/index");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ApiResponse = require("../utils/apiResponse");

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

  const updatableFields = ["category", "title", "amount", "status", "expenseDate", "notes"];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      expense[field] = req.body[field];
    }
  });

  await expense.save();

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
