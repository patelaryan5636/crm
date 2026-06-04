// progressData.js — Task-focused progress data for the Team Leader's Progress page
// All data aligns with the projectsStore's task structure.

export const progressStats = [
  { title: "Total Tasks", value: "19", accent: "#2563eb" },
  { title: "Completed Tasks", value: "9", accent: "#16a34a" },
  { title: "In Progress", value: "5", accent: "#f59e0b" },
  { title: "Delayed Tasks", value: "1", accent: "#dc2626" },
  { title: "Not Started", value: "4", accent: "#64748b" },
  { title: "Avg Completion", value: "47%", accent: "#0f766e" },
];

export const employeeProgressRows = [
  { id: "T-103", project: "Employee Mobile Dashboard", task: "Build KPI dashboard widgets", employee: "Aarav Mehta", status: "In Progress", progress: "60%", priority: "Critical", deadline: "2026-06-01", lastUpdate: "Animated cards done, binding data" },
  { id: "T-107", project: "CRM Analytics Overhaul", task: "Replace bar/column charts", employee: "Aarav Mehta", status: "In Progress", progress: "40%", priority: "High", deadline: "2026-06-05", lastUpdate: "Migrated 3/7 chart components" },
  { id: "T-112", project: "Vendor Onboarding Portal", task: "Backend API for vendor CRUD", employee: "Dev Arora", status: "Delayed", progress: "35%", priority: "High", deadline: "2026-05-18", lastUpdate: "Blocked on third-party API" },
  { id: "T-104", project: "Employee Mobile Dashboard", task: "Push notification service", employee: "Dev Arora", status: "In Progress", progress: "50%", priority: "Medium", deadline: "2026-06-08", lastUpdate: "Firebase setup complete" },
  { id: "T-113", project: "Vendor Onboarding Portal", task: "Document upload module", employee: "Kabir Sethi", status: "In Progress", progress: "55%", priority: "Medium", deadline: "2026-06-05", lastUpdate: "Drag-drop + validation done" },
  { id: "T-109", project: "CRM Analytics Overhaul", task: "Build date-range filter panel", employee: "Kabir Sethi", status: "Not Started", progress: "0%", priority: "Medium", deadline: "2026-06-18", lastUpdate: "Waiting for chart migration" },
  { id: "T-105", project: "Employee Mobile Dashboard", task: "QA & regression testing", employee: "Nisha Kapoor", status: "Not Started", progress: "0%", priority: "High", deadline: "2026-06-14", lastUpdate: "Pending dev completion" },
  { id: "T-114", project: "Vendor Onboarding Portal", task: "Vendor status tracker UI", employee: "Aarav Mehta", status: "Not Started", progress: "0%", priority: "Medium", deadline: "2026-06-15", lastUpdate: "Design mockups received" },
];

export const completedPendingProjects = [
  { name: "Aarav", completed: 2, pending: 3 },
  { name: "Dev", completed: 3, pending: 2 },
  { name: "Ira", completed: 3, pending: 0 },
  { name: "Kabir", completed: 4, pending: 2 },
  { name: "Nisha", completed: 2, pending: 2 },
];

export const delayQualityData = [
  { name: "Aarav", delays: 0, qualityIssues: 0 },
  { name: "Dev", delays: 1, qualityIssues: 1 },
  { name: "Ira", delays: 0, qualityIssues: 0 },
  { name: "Kabir", delays: 0, qualityIssues: 0 },
  { name: "Nisha", delays: 0, qualityIssues: 0 },
];

export const teamActivityRows = [
  { id: "ACT-01", time: "11:50 AM", employee: "Dev Arora", activity: "Flagged blocker on vendor API", project: "Vendor Onboarding Portal", status: "Delayed" },
  { id: "ACT-02", time: "11:20 AM", employee: "Kabir Sethi", activity: "Completed report export module", project: "Payroll Audit Tracker", status: "Completed" },
  { id: "ACT-03", time: "10:45 AM", employee: "Aarav Mehta", activity: "Updated KPI widget progress", project: "Employee Mobile Dashboard", status: "In Progress" },
  { id: "ACT-04", time: "10:10 AM", employee: "Nisha Kapoor", activity: "Completed final QA sign-off", project: "Payroll Audit Tracker", status: "Completed" },
];

export const filterOptions = {
  employees: ["All", "Aarav Mehta", "Nisha Kapoor", "Dev Arora", "Ira Shah", "Kabir Sethi"],
  statuses: ["All", "Completed", "In Progress", "Not Started", "Delayed"],
  priorities: ["All", "Low", "Medium", "High", "Critical"],
};
