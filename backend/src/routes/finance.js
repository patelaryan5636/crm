const express = require("express");
const router = express.Router();

const financeController = require("../controllers/finance.controller");
const { requireUser } = require("../middleware/auth");
//these routes are for finanace expense sections
router.get("/dashboard", requireUser, financeController.getDashboardData);
router.get("/expenses", requireUser, financeController.getExpenses);
router.get("/expenses/chart", requireUser, financeController.getExpenseChart);
router.post("/expenses", requireUser, financeController.createExpense);
router.put("/expenses/:id", requireUser, financeController.updateExpense);
router.delete("/expenses/:id", requireUser, financeController.deleteExpense);

router.get("/dashboard/quick-insights", requireUser, financeController.getQuickInsights);

module.exports = router;
