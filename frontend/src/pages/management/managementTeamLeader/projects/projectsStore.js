import { useState, useEffect } from "react";

// ── Team members (employees under this TL) ───────────────────────────────────
export const EMPLOYEES = [
  { id: "EM-201", name: "Aarav Mehta", role: "Frontend Developer" },
  { id: "EM-202", name: "Dev Arora", role: "Backend Developer" },
  { id: "EM-203", name: "Ira Shah", role: "UI/UX Designer" },
  { id: "EM-204", name: "Kabir Sethi", role: "Full Stack Developer" },
  { id: "EM-205", name: "Nisha Kapoor", role: "QA Engineer" },
];

export const EMPLOYEE_NAMES = EMPLOYEES.map((e) => e.name);

export const PRIORITIES = ["Critical", "High", "Medium", "Low"];

export const TASK_STATUSES = ["Not Started", "In Progress", "Completed", "Delayed"];

export const PROJECT_STATUSES = ["Not Started", "In Progress", "Completed", "Delayed", "On Hold"];

export const REASSIGN_REASONS = ["Overloaded", "Skill Mismatch", "Leave/Absence", "Underperformance", "Priority Shift", "Other"];

// ── Helpers ──────────────────────────────────────────────────────────────────
export const getAvatarColor = (name) => {
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];
  const sum = (name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
};

export const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
};

// Compute project progress from tasks
const computeProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  return Math.round((completed / tasks.length) * 100);
};

// Derive project status from tasks
const computeProjectStatus = (tasks) => {
  if (!tasks || tasks.length === 0) return "Not Started";
  const all = tasks.length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const delayed = tasks.filter((t) => t.status === "Delayed").length;
  if (completed === all) return "Completed";
  if (delayed > 0) return "Delayed";
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  if (inProgress > 0 || completed > 0) return "In Progress";
  return "Not Started";
};

// ── Seed data ─────────────────────────────────────────────────────────────────
let nextTaskId = 200;

let globalProjects = [
  {
    id: 1,
    name: "Employee Mobile Dashboard",
    description: "Build the initial mobile dashboard view for management executives with real-time KPIs and notifications.",
    deadline: "2026-06-15",
    priority: "High",
    createdAt: "2026-05-01",
    tasks: [
      { id: 101, title: "Design login & auth screens", assignee: "Ira Shah", priority: "High", status: "Completed", deadline: "2026-05-15", description: "Create Figma mockups for login, OTP, and forgot-password flows." },
      { id: 102, title: "Implement auth API integration", assignee: "Dev Arora", priority: "High", status: "Completed", deadline: "2026-05-20", description: "Connect login/register to backend auth endpoints." },
      { id: 103, title: "Build KPI dashboard widgets", assignee: "Aarav Mehta", priority: "Critical", status: "In Progress", deadline: "2026-06-01", description: "Create animated KPI cards with real-time data bindings." },
      { id: 104, title: "Push notification service", assignee: "Dev Arora", priority: "Medium", status: "In Progress", deadline: "2026-06-08", description: "Integrate Firebase Cloud Messaging for push alerts." },
      { id: 105, title: "QA & regression testing", assignee: "Nisha Kapoor", priority: "High", status: "Not Started", deadline: "2026-06-14", description: "Full test suite covering auth flow and dashboard interactions." },
    ],
  },
  {
    id: 2,
    name: "CRM Analytics Overhaul",
    description: "Revamp the analytics module to use Recharts instead of ApexCharts, add custom date-range filters.",
    deadline: "2026-07-01",
    priority: "Critical",
    createdAt: "2026-05-10",
    tasks: [
      { id: 106, title: "Audit existing chart components", assignee: "Kabir Sethi", priority: "Medium", status: "Completed", deadline: "2026-05-20", description: "Document all ApexCharts usage across the codebase." },
      { id: 107, title: "Replace bar/column charts", assignee: "Aarav Mehta", priority: "High", status: "In Progress", deadline: "2026-06-05", description: "Swap ApexCharts bar/column components with Recharts equivalents." },
      { id: 108, title: "Replace pie/donut charts", assignee: "Aarav Mehta", priority: "High", status: "Not Started", deadline: "2026-06-12", description: "Migrate all pie and donut charts to Recharts." },
      { id: 109, title: "Build date-range filter panel", assignee: "Kabir Sethi", priority: "Medium", status: "Not Started", deadline: "2026-06-18", description: "Custom date-range picker with preset options (week, month, quarter)." },
      { id: 110, title: "Performance testing", assignee: "Nisha Kapoor", priority: "Low", status: "Not Started", deadline: "2026-06-28", description: "Benchmark Recharts render times vs old implementation." },
    ],
  },
  {
    id: 3,
    name: "Vendor Onboarding Portal",
    description: "Build a self-serve portal where vendors can register, submit documents, and track onboarding status.",
    deadline: "2026-06-20",
    priority: "Medium",
    createdAt: "2026-04-20",
    tasks: [
      { id: 111, title: "Design vendor registration flow", assignee: "Ira Shah", priority: "High", status: "Completed", deadline: "2026-05-05", description: "Multi-step form wireframes + final UI designs." },
      { id: 112, title: "Backend API for vendor CRUD", assignee: "Dev Arora", priority: "High", status: "Delayed", deadline: "2026-05-18", description: "REST endpoints for vendor registration, update, and status." },
      { id: 113, title: "Document upload module", assignee: "Kabir Sethi", priority: "Medium", status: "In Progress", deadline: "2026-06-05", description: "Multi-file upload with drag-drop, progress bar, and validation." },
      { id: 114, title: "Vendor status tracker UI", assignee: "Aarav Mehta", priority: "Medium", status: "Not Started", deadline: "2026-06-15", description: "Timeline component showing onboarding steps and current stage." },
    ],
  },
  {
    id: 4,
    name: "Payroll Audit Tracker",
    description: "Internal tool to audit payroll discrepancies, generate reports, and flag anomalies.",
    deadline: "2026-05-25",
    priority: "High",
    createdAt: "2026-04-01",
    tasks: [
      { id: 115, title: "Data model & schema design", assignee: "Dev Arora", priority: "High", status: "Completed", deadline: "2026-04-10", description: "Define MongoDB schemas for payroll audit records." },
      { id: 116, title: "Audit dashboard UI", assignee: "Ira Shah", priority: "High", status: "Completed", deadline: "2026-04-20", description: "Design and build the main audit dashboard with filters." },
      { id: 117, title: "Anomaly detection logic", assignee: "Kabir Sethi", priority: "Critical", status: "Completed", deadline: "2026-05-05", description: "Algorithm to flag salary discrepancies beyond threshold." },
      { id: 118, title: "Report export (PDF/Excel)", assignee: "Kabir Sethi", priority: "Medium", status: "Completed", deadline: "2026-05-15", description: "Generate downloadable audit reports with charts." },
      { id: 119, title: "Final QA sign-off", assignee: "Nisha Kapoor", priority: "High", status: "Completed", deadline: "2026-05-22", description: "End-to-end regression testing and sign-off." },
    ],
  },
];

// Compute derived fields on seed data
globalProjects = globalProjects.map((p) => ({
  ...p,
  progress: computeProgress(p.tasks),
  status: computeProjectStatus(p.tasks),
}));

// ── Reassignment history ──────────────────────────────────────────────────────
let globalReassignHistory = [
  {
    id: 1,
    projectName: "Vendor Onboarding Portal",
    taskTitle: "Backend API for vendor CRUD",
    from: "Kabir Sethi",
    to: "Dev Arora",
    reason: "Skill Mismatch",
    date: "2026-05-12",
  },
];

// ── Reactive store ────────────────────────────────────────────────────────────
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export const useProjectsStore = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick((t) => t + 1);
    listeners.add(update);
    return () => listeners.delete(update);
  }, []);

  // ── Project CRUD ──────────────────────────────────────────────────────────
  const addProject = ({ name, description, deadline, priority }) => {
    const newProject = {
      id: Date.now(),
      name,
      description,
      deadline,
      priority,
      createdAt: new Date().toISOString().split("T")[0],
      tasks: [],
      progress: 0,
      status: "Not Started",
    };
    globalProjects = [newProject, ...globalProjects];
    notify();
    return newProject;
  };

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  const addTask = (projectId, { title, description, assignee, priority, deadline }) => {
    const taskId = ++nextTaskId;
    const newTask = {
      id: taskId,
      title,
      description: description || "",
      assignee,
      priority,
      status: "Not Started",
      deadline,
    };
    globalProjects = globalProjects.map((p) => {
      if (p.id === projectId) {
        const tasks = [newTask, ...p.tasks];
        return { ...p, tasks, progress: computeProgress(tasks), status: computeProjectStatus(tasks) };
      }
      return p;
    });
    notify();
    return newTask;
  };

  const updateTask = (projectId, taskId, patch) => {
    let updatedTask = null;
    globalProjects = globalProjects.map((p) => {
      if (p.id === projectId) {
        const tasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            updatedTask = { ...t, ...patch };
            return updatedTask;
          }
          return t;
        });
        return { ...p, tasks, progress: computeProgress(tasks), status: computeProjectStatus(tasks) };
      }
      return p;
    });
    notify();
    return updatedTask;
  };

  const deleteTask = (projectId, taskId) => {
    globalProjects = globalProjects.map((p) => {
      if (p.id === projectId) {
        const tasks = p.tasks.filter((t) => t.id !== taskId);
        return { ...p, tasks, progress: computeProgress(tasks), status: computeProjectStatus(tasks) };
      }
      return p;
    });
    notify();
  };

  const reassignTask = (projectId, taskId, newAssignee, reason, notes) => {
    let entry = null;
    globalProjects = globalProjects.map((p) => {
      if (p.id === projectId) {
        const tasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            entry = {
              id: Date.now(),
              projectName: p.name,
              taskTitle: t.title,
              from: t.assignee,
              to: newAssignee,
              reason,
              notes,
              date: new Date().toISOString().split("T")[0],
            };
            return { ...t, assignee: newAssignee };
          }
          return t;
        });
        return { ...p, tasks, progress: computeProgress(tasks), status: computeProjectStatus(tasks) };
      }
      return p;
    });
    if (entry) {
      globalReassignHistory = [entry, ...globalReassignHistory];
    }
    notify();
    return entry;
  };

  // ── Computed helpers ──────────────────────────────────────────────────────
  const allTasks = globalProjects.flatMap((p) =>
    p.tasks.map((t) => ({ ...t, projectId: p.id, projectName: p.name }))
  );

  const taskStats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === "Completed").length,
    inProgress: allTasks.filter((t) => t.status === "In Progress").length,
    notStarted: allTasks.filter((t) => t.status === "Not Started").length,
    delayed: allTasks.filter((t) => t.status === "Delayed").length,
  };

  return {
    projects: globalProjects,
    reassignHistory: globalReassignHistory,
    allTasks,
    taskStats,
    addProject,
    addTask,
    updateTask,
    deleteTask,
    reassignTask,
  };
};

export default globalProjects;