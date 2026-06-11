import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  UserCheck,
  Target,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
  CreditCard,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import {
  DashGrid,
  EnhancedDashCard,
  DataTable,
  Heading,
  P,
  PanelModal as Modal,
  openModal,
  closeModal,
  DataField,
  Grid,
  GAreaChart,
  GBarChart,
  GPieChart,
  Button,
} from "../../components/shared/Common_Components";
import { userService } from "../../services/userService";

// ─── Mock Data (role-based) ─────────────────────────────────────────────────

// ─── TIMELINE DATA ─────────────────────────────────────────────────────────
const revenueChartDataMonthly = [
  { name: "Jan", revenue: 820000, expenses: 420000 },
  { name: "Feb", revenue: 940000, expenses: 460000 },
  { name: "Mar", revenue: 1100000, expenses: 510000 },
  { name: "Apr", revenue: 1350000, expenses: 590000 },
  { name: "May", revenue: 1200000, expenses: 550000 },
  { name: "Jun", revenue: 1480000, expenses: 620000 },
  { name: "Jul", revenue: 1550000, expenses: 660000 },
  { name: "Aug", revenue: 1620000, expenses: 700000 },
  { name: "Sep", revenue: 1750000, expenses: 740000 },
  { name: "Oct", revenue: 1850000, expenses: 790000 },
  { name: "Nov", revenue: 1980000, expenses: 840000 },
  { name: "Dec", revenue: 2100000, expenses: 900000 },
];

const revenueChartDataYearly = [
  { name: "2022", revenue: 4500000, expenses: 2100000 },
  { name: "2023", revenue: 6200000, expenses: 2800000 },
  { name: "2024", revenue: 8900000, expenses: 3500000 },
  { name: "2025", revenue: 11500000, expenses: 4200000 },
  { name: "2026", revenue: 12400000, expenses: 4800000 },
];

const revenueChartDataWeekly = [
  { name: "Week 1", revenue: 280000, expenses: 140000 },
  { name: "Week 2", revenue: 320000, expenses: 155000 },
  { name: "Week 3", revenue: 340000, expenses: 165000 },
  { name: "Week 4", revenue: 410000, expenses: 200000 },
];

// Lead Conversion Data
const leadConversionMonthly = [
  { name: "Jan", leads: 280, converted: 112, conversionRate: 40 },
  { name: "Feb", leads: 320, converted: 140, conversionRate: 44 },
  { name: "Mar", leads: 350, converted: 155, conversionRate: 44 },
  { name: "Apr", leads: 420, converted: 174, conversionRate: 41 },
  { name: "May", leads: 380, converted: 152, conversionRate: 40 },
  { name: "Jun", leads: 450, converted: 189, conversionRate: 42 },
  { name: "Jul", leads: 470, converted: 197, conversionRate: 42 },
  { name: "Aug", leads: 490, converted: 205, conversionRate: 42 },
  { name: "Sep", leads: 520, converted: 228, conversionRate: 44 },
  { name: "Oct", leads: 550, converted: 242, conversionRate: 44 },
  { name: "Nov", leads: 580, converted: 261, conversionRate: 45 },
  { name: "Dec", leads: 620, converted: 285, conversionRate: 46 },
];

const leadConversionYearly = [
  { name: "2022", leads: 2800, converted: 1120, conversionRate: 40 },
  { name: "2023", leads: 3600, converted: 1584, conversionRate: 44 },
  { name: "2024", leads: 4200, converted: 1848, conversionRate: 44 },
  { name: "2025", leads: 5100, converted: 2091, conversionRate: 41 },
  { name: "2026", leads: 5600, converted: 2352, conversionRate: 42 },
];

const leadConversionWeekly = [
  { name: "Week 1", leads: 95, converted: 38, conversionRate: 40 },
  { name: "Week 2", leads: 110, converted: 48, conversionRate: 44 },
  { name: "Week 3", leads: 115, converted: 51, conversionRate: 44 },
  { name: "Week 4", leads: 135, converted: 55, conversionRate: 41 },
];

// Project Completion Data
const projectCompletionMonthly = [
  { name: "1", total: 12, completed: 4, inProgress: 6, delayed: 2 },
  { name: "3", total: 16, completed: 8, inProgress: 6, delayed: 2 },
  { name: "6", total: 20, completed: 12, inProgress: 6, delayed: 2 },
  { name: "9", total: 26, completed: 18, inProgress: 6, delayed: 2 },
  { name: "12", total: 32, completed: 24, inProgress: 6, delayed: 2 },
];

const projectCompletionYearly = [
  { name: "2022", total: 45, completed: 35, inProgress: 8, delayed: 2 },
  { name: "2023", total: 68, completed: 58, inProgress: 8, delayed: 2 },
  { name: "2024", total: 92, completed: 78, inProgress: 12, delayed: 2 },
  { name: "2025", total: 110, completed: 95, inProgress: 12, delayed: 3 },
  { name: "2026", total: 98, completed: 83, inProgress: 13, delayed: 2 },
];

const projectCompletionWeekly = [
  { name: "Week 1", total: 5, completed: 1, inProgress: 3, delayed: 1 },
  { name: "Week 2", total: 5, completed: 2, inProgress: 2, delayed: 1 },
  { name: "Week 3", total: 5, completed: 3, inProgress: 1, delayed: 1 },
  { name: "Week 4", total: 5, completed: 4, inProgress: 1, delayed: 0 },
];

// Payment Collection Data
const paymentCollectionMonthly = [
  { name: "Jan", total: 2400000, collected: 2160000, pending: 240000 },
  { name: "Feb", total: 2800000, collected: 2380000, pending: 420000 },
  { name: "Mar", total: 3200000, collected: 2880000, pending: 320000 },
  { name: "Apr", total: 3800000, collected: 3230000, pending: 570000 },
  { name: "May", total: 3400000, collected: 2890000, pending: 510000 },
  { name: "Jun", total: 4200000, collected: 3570000, pending: 630000 },
  { name: "Jul", total: 4500000, collected: 3825000, pending: 675000 },
  { name: "Aug", total: 4800000, collected: 4080000, pending: 720000 },
  { name: "Sep", total: 5200000, collected: 4420000, pending: 780000 },
  { name: "Oct", total: 5500000, collected: 4675000, pending: 825000 },
  { name: "Nov", total: 6000000, collected: 5100000, pending: 900000 },
  { name: "Dec", total: 6500000, collected: 5525000, pending: 975000 },
];

const paymentCollectionYearly = [
  { name: "2022", total: 18000000, collected: 15300000, pending: 2700000 },
  { name: "2023", total: 24500000, collected: 21840000, pending: 2660000 },
  { name: "2024", total: 32100000, collected: 29070000, pending: 3030000 },
  { name: "2025", total: 41800000, collected: 37620000, pending: 4180000 },
  { name: "2026", total: 44200000, collected: 37570000, pending: 6630000 },
];

const paymentCollectionWeekly = [
  { name: "Week 1", total: 1000000, collected: 850000, pending: 150000 },
  { name: "Week 2", total: 1100000, collected: 935000, pending: 165000 },
  { name: "Week 3", total: 1150000, collected: 977500, pending: 172500 },
  { name: "Week 4", total: 1350000, collected: 1147500, pending: 202500 },
];

const deptRevenueMonthly = [
  { name: "Sales", value: 340000, color: "#3b82f6" },
  { name: "Management", value: 280000, color: "#8b5cf6" },
  { name: "Finance", value: 430000, color: "#22c55e" },
];

const deptRevenueYearly = [
  { name: "Sales", value: 3800000, color: "#3b82f6" },
  { name: "Management", value: 3200000, color: "#8b5cf6" },
  { name: "Finance", value: 4700000, color: "#22c55e" },
];

const deptRevenueWeekly = [
  { name: "Sales", value: 85000, color: "#3b82f6" },
  { name: "Management", value: 72000, color: "#8b5cf6" },
  { name: "Finance", value: 105000, color: "#22c55e" },
];

const salesLeadsPieWeekly = [
  { name: "Interested", value: 150 },
  { name: "Follow-ups", value: 110 },
  { name: "Not Talk", value: 90 },
  { name: "Not Interested", value: 58 },
  { name: "Dump Leads", value: 32 },
];

const salesLeadsPieMonthly = [
  { name: "Interested", value: 350 },
  { name: "Follow-ups", value: 250 },
  { name: "Not Talk", value: 200 },
  { name: "Not Interested", value: 111 },
  { name: "Dump Leads", value: 162 },
];

const salesLeadsPieYearly = [
  { name: "Interested", value: 8000 },
  { name: "Follow-ups", value: 6000 },
  { name: "Not Talk", value: 4500 },
  { name: "Not Interested", value: 2500 },
  { name: "Dump Leads", value: 1500 },
];

const salesLeadsColors = [
  "#3b82f6",
  "#f59e0b",
  "#94a3b8",
  "#f43f5e",
  "#ec4899",
];

const projects = [
  {
    project: "CRM Portal Revamp",
    client: "Acme Corp",
    assignedTo: "Arjun Kapoor",
    startDate: "01 Feb 2026",
    deadline: "30 Apr 2026",
    status: "In Progress",
    progress: "72%",
    priority: "High",
    date: "2026-02-01",
  },
  {
    project: "ERP Integration",
    client: "Global Tech",
    assignedTo: "Neha Gupta",
    startDate: "15 Jan 2026",
    deadline: "15 May 2026",
    status: "In Progress",
    progress: "55%",
    priority: "Critical",
    date: "2026-01-15",
  },
  {
    project: "Mobile App v2",
    client: "Nexus Labs",
    assignedTo: "Rohit Verma",
    startDate: "10 Mar 2026",
    deadline: "10 Jun 2026",
    status: "In Progress",
    progress: "38%",
    priority: "Medium",
    date: "2026-03-10",
  },
  {
    project: "Data Migration",
    client: "Sunrise Retail",
    assignedTo: "Karan Bhatia",
    startDate: "05 Dec 2025",
    deadline: "05 Mar 2026",
    status: "Delayed",
    progress: "80%",
    priority: "High",
    date: "2025-12-05",
  },
  {
    project: "Analytics Dashboard",
    client: "FinTech Ltd.",
    assignedTo: "Priya Mehta",
    startDate: "20 Jan 2026",
    deadline: "20 Apr 2026",
    status: "Completed",
    progress: "100%",
    priority: "Low",
    date: "2026-01-20",
  },
  {
    project: "API Gateway Setup",
    client: "CloudBase Inc.",
    assignedTo: "Vikram Nair",
    startDate: "01 Mar 2026",
    deadline: "01 May 2026",
    status: "In Progress",
    progress: "45%",
    priority: "Medium",
    date: "2026-03-01",
  },
];

const financeRecords = [
  {
    client: "Acme Corp",
    project: "CRM Portal Revamp",
    invoiceId: "INV-1001",
    total: "₹12,00,000",
    paid: "₹8,40,000",
    remaining: "₹3,60,000",
    type: "Milestone",
    status: "Partial",
    date: "2026-04-01",
  },
  {
    client: "Global Tech",
    project: "ERP Integration",
    invoiceId: "INV-1002",
    total: "₹22,50,000",
    paid: "₹22,50,000",
    remaining: "₹0",
    type: "Full Payment",
    status: "Paid",
    date: "2026-03-20",
  },
  {
    client: "Nexus Labs",
    project: "Mobile App v2",
    invoiceId: "INV-1003",
    total: "₹9,80,000",
    paid: "₹4,90,000",
    remaining: "₹4,90,000",
    type: "Milestone",
    status: "Partial",
    date: "2026-04-10",
  },
  {
    client: "Sunrise Retail",
    project: "Data Migration",
    invoiceId: "INV-1004",
    total: "₹6,40,000",
    paid: "₹0",
    remaining: "₹6,40,000",
    type: "Post-Delivery",
    status: "Pending",
    date: "2026-03-05",
  },
  {
    client: "FinTech Ltd.",
    project: "Analytics Dashboard",
    invoiceId: "INV-1005",
    total: "₹15,00,000",
    paid: "₹15,00,000",
    remaining: "₹0",
    type: "Full Payment",
    status: "Paid",
    date: "2026-04-18",
  },
  {
    client: "CloudBase Inc.",
    project: "API Gateway Setup",
    invoiceId: "INV-1006",
    total: "₹7,20,000",
    paid: "₹3,60,000",
    remaining: "₹3,60,000",
    type: "Milestone",
    status: "Partial",
    date: "2026-04-05",
  },
];

// ─── Column Definitions ─────────────────────────────────────────────────────

const projectColumns = [
  { key: "project", label: "Project Name" },
  { key: "client", label: "Client" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "startDate", label: "Start Date" },
  { key: "deadline", label: "Deadline" },
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress %" },
  { key: "priority", label: "Priority" },
];

const financeColumns = [
  { key: "client", label: "Client" },
  { key: "project", label: "Project" },
  { key: "invoiceId", label: "Invoice #" },
  { key: "total", label: "Total Amount" },
  { key: "paid", label: "Paid" },
  { key: "remaining", label: "Remaining" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
];

// ─── Component ──────────────────────────────────────────────────────────────

const initialDepts = [
  {
    id: "dept-1",
    name: "sales",
    displayName: "Sales Department",
    totalUsers: 8,
    activeUsers: 6,
    roles: "Manager, TL, Executive",
    createdAt: "10 Apr 2026",
  },
  {
    id: "dept-2",
    name: "management",
    displayName: "Management",
    totalUsers: 6,
    activeUsers: 5,
    roles: "Admin, Project Manager",
    createdAt: "15 Jan 2026",
  },
  {
    id: "dept-3",
    name: "finance",
    displayName: "Finance",
    totalUsers: 4,
    activeUsers: 4,
    roles: "Analyst, Accountant",
    createdAt: "05 Dec 2025",
  },
];

export default function Report() {
  const [timeline, setTimeline] = useState("monthly"); // "yearly", "monthly", "weekly"
  const [departments, setDepartments] = useState(initialDepts);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFinance, setSelectedFinance] = useState(null);

  // ─── Get chart data based on timeline ────────────────────────────────────
  const getRevenueData = () => {
    switch (timeline) {
      case "yearly":
        return revenueChartDataYearly;
      case "weekly":
        return revenueChartDataWeekly;
      default:
        return revenueChartDataMonthly;
    }
  };

  const getLeadConversionData = () => {
    switch (timeline) {
      case "yearly":
        return leadConversionYearly;
      case "weekly":
        return leadConversionWeekly;
      default:
        return leadConversionMonthly;
    }
  };

  const getProjectCompletionData = () => {
    switch (timeline) {
      case "yearly":
        return projectCompletionYearly;
      case "weekly":
        return projectCompletionWeekly;
      default:
        return projectCompletionMonthly;
    }
  };

  const getPaymentCollectionData = () => {
    switch (timeline) {
      case "yearly":
        return paymentCollectionYearly;
      case "weekly":
        return paymentCollectionWeekly;
      default:
        return paymentCollectionMonthly;
    }
  };

  const getDeptRevenueData = () => {
    switch (timeline) {
      case "yearly":
        return deptRevenueYearly;
      case "weekly":
        return deptRevenueWeekly;
      default:
        return deptRevenueMonthly;
    }
  };

  const getSalesLeadsPieData = () => {
    switch (timeline) {
      case "yearly":
        return salesLeadsPieYearly;
      case "weekly":
        return salesLeadsPieWeekly;
      default:
        return salesLeadsPieMonthly;
    }
  };

  const fetchDepartments = () => {
    // Replaced by mock state
  };

  const totalDepts = departments.length;
  const totalUsers = departments.reduce((sum, d) => sum + d.totalUsers, 0);
  const totalActive = departments.reduce((sum, d) => sum + d.activeUsers, 0);

  const getGlobalStats = () => {
    switch (timeline) {
      case "weekly":
        return { depts: 3, users: 12, active: 8 };
      case "yearly":
        return { depts: 3, users: 24, active: 20 };
      default:
        return { depts: totalDepts, users: totalUsers, active: totalActive };
    }
  };
  const globalStats = getGlobalStats();

  const currentLeadsData = getSalesLeadsPieData();
  const totalLeadsCount = currentLeadsData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const getLeadSegmentVal = (name) => {
    const item = currentLeadsData.find((d) => d.name === name);
    return item ? item.value : 0;
  };

  const getLeadSegmentPct = (name) => {
    if (totalLeadsCount === 0) return "0.0%";
    const val = getLeadSegmentVal(name);
    return `${((val / totalLeadsCount) * 100).toFixed(1)}%`;
  };

  // ─── Project Calculations ──────────────────────────────────────────────────
  const currentProjectsData = getProjectCompletionData();
  const totalProjectsCount = currentProjectsData.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const completedProjectsCount = currentProjectsData.reduce(
    (sum, item) => sum + item.completed,
    0,
  );
  const inProgressProjectsCount = currentProjectsData.reduce(
    (sum, item) => sum + item.inProgress,
    0,
  );
  const delayedProjectsCount = currentProjectsData.reduce(
    (sum, item) => sum + item.delayed,
    0,
  );

  // ─── Finance Calculations ──────────────────────────────────────────────────
  const currentRevenueData = getRevenueData();
  const currentPaymentData = getPaymentCollectionData();

  const totalRevenueVal = currentRevenueData.reduce(
    (sum, item) => sum + item.revenue,
    0,
  );
  const totalExpensesVal = currentRevenueData.reduce(
    (sum, item) => sum + item.expenses,
    0,
  );
  const totalPendingVal = currentPaymentData.reduce(
    (sum, item) => sum + item.pending,
    0,
  );
  const netProfitVal = totalRevenueVal - totalExpensesVal;

  const formatCompactRupee = (val) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    let formatted = "";
    if (absVal >= 10000000) {
      formatted = `₹${(absVal / 10000000).toFixed(2)}Cr`;
    } else if (absVal >= 100000) {
      formatted = `₹${(absVal / 100000).toFixed(2)}L`;
    } else {
      formatted = `₹${absVal.toLocaleString("en-IN")}`;
    }
    return isNegative ? `-${formatted}` : formatted;
  };

  const formatIndianRupee = (val) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = `₹${absVal.toLocaleString("en-IN")}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  return (
    <div className="space-y-6">
      {/* ── Header with Timeline Filter ── */}
      <Heading
        primaryText="Reports&nbsp; &"
        secondaryText="Management"
        size={12}
      />

      {/* ── Global KPI Cards ── */}
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard
          title="Total Departments"
          value={String(totalDepts)}
          icon={<Building2 size={22} />}
          accentColor="#38bdf8"
          size={3}
        />
        <EnhancedDashCard
          title="Total Users"
          value={String(totalUsers)}
          icon={<Users size={22} />}
          accentColor="#3b82f6"
          size={3}
        />
        <EnhancedDashCard
          title="Active Users"
          value={String(totalActive)}
          icon={<UserCheck size={22} />}
          accentColor="#22c55e"
          size={3}
        />
        <EnhancedDashCard
          title="Total Revenue"
          value="₹1.84Cr"
          icon={<DollarSign size={22} />}
          accentColor="#8b5cf6"
          size={3}
        />
      </DashGrid>
      <div className="flex justify-end">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar size={18} className="text-slate-500" />
          <div className="flex gap-2">
            {[
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
              { label: "Yearly", value: "yearly" },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setTimeline(value)}
                className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                  timeline === value
                    ? "bg-[#2a465a] text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row 1 ── */}
      <DashGrid cols={12} gap={4}>
        <GAreaChart
          title="Revenue & Expense Trend"
          subtitle={`${timeline.charAt(0).toUpperCase() + timeline.slice(1)} breakdown`}
          data={getRevenueData()}
          areas={[
            { key: "revenue", label: "Revenue", color: "#3b82f6" },
            { key: "expenses", label: "Expenses", color: "#f43f5e" },
          ]}
          size={8}
          height={300}
        />
        <GBarChart
          title="Department Revenue Distribution"
          subtitle={`${timeline.charAt(0).toUpperCase() + timeline.slice(1)} breakdown`}
          data={getDeptRevenueData()}
          bars={[{ key: "value", label: "Revenue", color: "#3b82f6" }]}
          size={4}
          height={300}
        />
        <GBarChart
          title="Project Completion Status"
          subtitle={`${timeline.charAt(0).toUpperCase() + timeline.slice(1)} breakdown`}
          data={getProjectCompletionData()}
          bars={[
            { key: "completed", label: "Completed", color: "#22c55e" },
            { key: "inProgress", label: "In Progress", color: "#3b82f6" },
            { key: "delayed", label: "Delayed", color: "#f43f5e" },
          ]}
          size={6}
          height={300}
          yAxisWidth={30}
        />
        <GAreaChart
          title="Payment Collection Analysis"
          subtitle={`${timeline.charAt(0).toUpperCase() + timeline.slice(1)} breakdown`}
          data={getPaymentCollectionData()}
          areas={[
            { key: "collected", label: "Collected", color: "#22c55e" },
            { key: "pending", label: "Pending", color: "#f59e0b" },
          ]}
          size={6}
          height={300}
        />
      </DashGrid>

      {/* ══ SALES DEPARTMENT ══════════════════════════════════════════════════ */}
      <DashGrid cols={12} gap={4}>
        <div className="col-span-12">
          <Heading primaryText="Sales" secondaryText="Department" size={12} />
        </div>
        <EnhancedDashCard
          title="Total Leads"
          value={totalLeadsCount.toLocaleString("en-IN")}
          icon={<Target size={22} />}
          accentColor="#22c55e"
          size={3}
        />
        <EnhancedDashCard
          title="Interested"
          value={`${getLeadSegmentVal("Interested").toLocaleString("en-IN")} (${getLeadSegmentPct("Interested")})`}
          icon={<Activity size={22} />}
          accentColor="#3b82f6"
          size={3}
        />
        <EnhancedDashCard
          title="Not Interested"
          value={`${getLeadSegmentVal("Not Interested").toLocaleString("en-IN")} (${getLeadSegmentPct("Not Interested")})`}
          icon={<AlertCircle size={22} />}
          accentColor="#f43f5e"
          size={3}
        />
        <EnhancedDashCard
          title="Dump Data"
          value={`${getLeadSegmentVal("Dump Leads").toLocaleString("en-IN")} (${getLeadSegmentPct("Dump Leads")})`}
          icon={<Trash2 size={22} />}
          accentColor="#ec4899"
          size={3}
        />
      </DashGrid>
      <DashGrid cols={12} gap={4}>
        <GPieChart
          title="Sales Leads Segments"
          subtitle="Interested vs Follow-ups vs Not Talk vs Not Interested vs Dump Leads"
          data={getSalesLeadsPieData()}
          colors={salesLeadsColors}
          size={4}
          height={300}
        />
        <GAreaChart
          title="Lead Generation & Conversion"
          subtitle={`${timeline.charAt(0).toUpperCase() + timeline.slice(1)} breakdown`}
          data={getLeadConversionData()}
          areas={[
            { key: "leads", label: "Leads Generated", color: "#22c55e" },
            { key: "converted", label: "Converted", color: "#3b82f6" },
          ]}
          size={8}
          height={300}
        />
      </DashGrid>
      {/* ══ MANAGEMENT DEPARTMENT ═════════════════════════════════════════════ */}
      <DashGrid cols={12} gap={4}>
        <div className="col-span-12">
          <Heading
            primaryText="Management"
            secondaryText="Department"
            size={12}
          />
        </div>
        <EnhancedDashCard
          title="Total Projects"
          value={String(totalProjectsCount)}
          icon={<Briefcase size={22} />}
          accentColor="#f59e0b"
          size={3}
        />
        <EnhancedDashCard
          title="In Progress"
          value={String(inProgressProjectsCount)}
          icon={<Clock size={22} />}
          accentColor="#3b82f6"
          size={3}
        />
        <EnhancedDashCard
          title="Completed"
          value={String(completedProjectsCount)}
          icon={<CheckCircle size={22} />}
          accentColor="#22c55e"
          size={3}
        />
        <EnhancedDashCard
          title="Delayed"
          value={String(delayedProjectsCount)}
          icon={<AlertCircle size={22} />}
          accentColor="#f43f5e"
          size={3}
        />
      </DashGrid>
      <DataTable
        exportable
        exportFileName={"project_management"}
        title="Project Management"
        columns={projectColumns}
        rows={projects}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View",
            variant: "ghost",
            onClick: (row) => {
              setSelectedProject(row);
              openModal("project-view-modal");
            },
          },
        ]}
        size={12}
        pageSize={5}
        searchable
        date={true}
        filters={[
          {
            title: "Status",
            key: "status",
            type: "toggle",
            options: ["In Progress", "Completed", "Delayed"],
          },
          {
            title: "Priority",
            key: "priority",
            type: "toggle",
            options: ["Low", "Medium", "High", "Critical"],
          },
        ]}
      />

      {/* ══ FINANCE DEPARTMENT ════════════════════════════════════════════════ */}
      <DashGrid cols={12} gap={4}>
        <div className="col-span-12">
          <Heading primaryText="Finance" secondaryText="Department" size={12} />
        </div>
        <EnhancedDashCard
          title="Total Revenue"
          value={formatIndianRupee(totalRevenueVal)}
          icon={<DollarSign size={22} />}
          accentColor="#22c55e"
          size={3}
        />
        <EnhancedDashCard
          title="Pending"
          value={formatIndianRupee(totalPendingVal)}
          icon={<Clock size={22} />}
          accentColor="#f59e0b"
          size={3}
        />
        <EnhancedDashCard
          title="Expenses"
          value={formatIndianRupee(totalExpensesVal)}
          icon={<CreditCard size={22} />}
          accentColor="#f43f5e"
          size={3}
        />
        <EnhancedDashCard
          title="Net Profit"
          value={formatIndianRupee(netProfitVal)}
          icon={<TrendingUp size={22} />}
          accentColor="#8b5cf6"
          size={3}
        />
      </DashGrid>
      <DataTable
        exportable
        exportFileName={"finance_payments"}
        title="Finance & Payments"
        columns={financeColumns}
        rows={financeRecords}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View",
            variant: "ghost",
            onClick: (row) => {
              setSelectedFinance(row);
              openModal("finance-view-modal");
            },
          },
        ]}
        size={12}
        pageSize={5}
        searchable
        date={true}
        filters={[
          {
            title: "Status",
            key: "status",
            type: "toggle",
            options: ["Paid", "Partial", "Pending"],
          },
          {
            title: "Type",
            key: "type",
            type: "toggle",
            options: ["Milestone", "Full Payment", "Post-Delivery"],
          },
        ]}
      />

      {/* ══ VIEW MODALS FOR TABLE ROWS ═════════════════════════════════════════ */}

      <Modal id="project-view-modal" title="Project Details">
        {selectedProject && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-[#2a465a] flex items-center justify-center text-white shadow-lg">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-lg font-black text-[#2a465a]">
                  {selectedProject.project}
                </p>
                <p className="text-sm font-bold text-slate-500">
                  {selectedProject.client}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Assigned To", val: selectedProject.assignedTo },
                { label: "Start Date", val: selectedProject.startDate },
                { label: "Deadline", val: selectedProject.deadline },
                { label: "Status", val: selectedProject.status },
                { label: "Progress", val: selectedProject.progress },
                { label: "Priority", val: selectedProject.priority },
              ].map(({ label, val }) => (
                <div key={label}>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    {label}
                  </span>
                  <span className="text-[#2a465a] font-bold bg-white px-3 py-2.5 rounded-xl block border border-slate-100 text-sm">
                    {val}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                text="Close"
                variant="ghost"
                size={3}
                onClick={() => closeModal("project-view-modal")}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal id="finance-view-modal" title="Payment Details">
        {selectedFinance && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-[#2a465a] flex items-center justify-center text-white shadow-lg">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-lg font-black text-[#2a465a]">
                  {selectedFinance.invoiceId} • {selectedFinance.client}
                </p>
                <p className="text-sm font-bold text-slate-500">
                  {selectedFinance.project}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total", val: selectedFinance.total },
                { label: "Paid", val: selectedFinance.paid },
                { label: "Remaining", val: selectedFinance.remaining },
                { label: "Type", val: selectedFinance.type },
                { label: "Status", val: selectedFinance.status },
                { label: "Date", val: selectedFinance.date },
              ].map(({ label, val }) => (
                <div key={label}>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    {label}
                  </span>
                  <span className="text-[#2a465a] font-bold bg-white px-3 py-2.5 rounded-xl block border border-slate-100 text-sm">
                    {val}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                text="Close"
                variant="ghost"
                size={3}
                onClick={() => closeModal("finance-view-modal")}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
