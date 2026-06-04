/**
 * ManagementTeamLeaderDashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Task-focused dashboard for the Management Team Leader.
 * KPIs, charts, and tables reflect task-level granularity.
 *
 * Hierarchy: Management Manager → Team Leader → Management Employee
 * One team = one project. TL assigns tasks within projects to employees.
 */

import React, { useState } from "react";
import {
  Grid,
  Heading,
  EnhancedDashCard,
  DataTable,
  GColumnChart,
  GPieChart,
  Button,
  openModal,
  closeModal,
  Modal,
  ModalProfile,
  ModalGrid,
  ModalData,
  UserChat,
} from "../../../components/shared/Common_Components";
import {
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Eye,
  MessageSquare,
  PencilLine,
} from "lucide-react";
import { useProjectsStore, getAvatarColor, getInitials } from "./projects/projectsStore";

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    Completed: { bg: "#dcfce7", color: "#16a34a" },
    "In Progress": { bg: "#dbeafe", color: "#2563eb" },
    "Not Started": { bg: "#f1f5f9", color: "#64748b" },
    Delayed: { bg: "#fee2e2", color: "#dc2626" },
  };
  const s = map[status] || map["Not Started"];
  return (
    <span
      className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

// ── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const map = {
    Critical: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    High: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
    Medium: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    Low: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  };
  const s = map[priority] || map["Medium"];
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {priority}
    </span>
  );
}

// ── Avatar cell ──────────────────────────────────────────────────────────────
function AvatarCell({ name }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
        style={{ background: getAvatarColor(name) }}
      >
        {getInitials(name)}
      </div>
      <span className="text-xs font-semibold text-[#0f172a]">{name}</span>
    </div>
  );
}

// ── Ticket data (static) ─────────────────────────────────────────────────────
const initialTickets = [
  { id: "TCK-101", issue: "Login Failure", priority: "High", status: "Open", assignee: "Aarav Mehta" },
  { id: "TCK-102", issue: "Export Error", priority: "Medium", status: "Resolved", assignee: "Dev Arora" },
  { id: "TCK-103", issue: "Slow Dashboard", priority: "Low", status: "Escalated", assignee: "Kabir Sethi" },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function ManagementTeamLeaderDashboard() {
  const { projects, allTasks, taskStats } = useProjectsStore();
  const [ticketList, setTicketList] = useState(initialTickets);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // ── KPIs (live from store) ──────────────────────────────────────────────
  const kpis = [
    { title: "Total Projects", value: String(projects.length), icon: <Briefcase size={20} />, accent: "#3b82f6" },
    { title: "Total Tasks", value: String(taskStats.total), icon: <ListTodo size={20} />, accent: "#6366f1" },
    { title: "Completed Tasks", value: String(taskStats.completed), icon: <CheckCircle size={20} />, accent: "#10b981" },
    { title: "Overdue / Delayed", value: String(taskStats.delayed), icon: <AlertTriangle size={20} />, accent: "#ef4444" },
  ];

  // ── Chart data (derived from store) ─────────────────────────────────────
  const projectTaskData = projects.map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
    completed: p.tasks.filter((t) => t.status === "Completed").length,
    remaining: p.tasks.filter((t) => t.status !== "Completed").length,
  }));

  const taskStatusDistribution = [
    { name: "Completed", value: taskStats.completed },
    { name: "In Progress", value: taskStats.inProgress },
    { name: "Not Started", value: taskStats.notStarted },
    { name: "Delayed", value: taskStats.delayed },
  ];

  // ── Recent tasks (latest 8 from all projects) ──────────────────────────
  const recentTasks = [...allTasks]
    .sort((a, b) => (a.deadline < b.deadline ? -1 : 1))
    .slice(0, 8);

  // ── Employee workload summary ──────────────────────────────────────────
  const employeeMap = {};
  allTasks.forEach((t) => {
    if (!employeeMap[t.assignee]) {
      employeeMap[t.assignee] = { name: t.assignee, total: 0, completed: 0, inProgress: 0, delayed: 0 };
    }
    employeeMap[t.assignee].total++;
    if (t.status === "Completed") employeeMap[t.assignee].completed++;
    if (t.status === "In Progress") employeeMap[t.assignee].inProgress++;
    if (t.status === "Delayed") employeeMap[t.assignee].delayed++;
  });
  const employeeWorkload = Object.values(employeeMap);

  const handleViewTask = (row) => {
    setSelectedTask(row);
    openModal("dash-task-modal");
  };

  const handleOpenTicketReply = (row) => {
    setSelectedTicket(row);
    openModal("ticket-reply-modal");
  };

  const handleSendTicketReply = (msg) => {
    setTicketList((prev) =>
      prev.map((t) => {
        if (t.id === selectedTicket.id) {
          const updatedConvo = [...(t.conversation || []), { id: Date.now(), sender: "Team Leader", time: new Date().toLocaleTimeString(), text: msg.text }];
          return { ...t, status: "Replied", conversation: updatedConvo };
        }
        return t;
      })
    );
    setSelectedTicket((prev) => ({
      ...prev,
      status: "Replied",
      conversation: [...(prev.conversation || []), { id: Date.now(), sender: "Team Leader", time: new Date().toLocaleTimeString(), text: msg.text }]
    }));
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-10">
      
      {/* 1. Header */}
      <Grid cols={12} gap={4}>
        <Heading
          primaryText="Team Leader"
          secondaryText="Dashboard"
          size={12}
        />
      </Grid>

      {/* 2. KPI Cards */}
      <Grid cols={12} gap={4}>
        {kpis.map((k, i) => (
          <EnhancedDashCard
            key={i}
            title={k.title}
            value={k.value}
            icon={k.icon}
            accentColor={k.accent}
            size={3}
          />
        ))}
      </Grid>

      {/* 3. Charts Section */}
      <Grid cols={12} gap={4}>
        <GColumnChart
          title="Task Completion by Project"
          subtitle="Completed vs remaining tasks per project"
          data={projectTaskData}
          bars={[
            { key: "completed", label: "Completed", color: "#22c55e" },
            { key: "remaining", label: "Remaining", color: "#f59e0b" },
          ]}
          size={8}
          height={320}
        />
        <GPieChart
          title="Task Status Distribution"
          subtitle="Current status of all tasks across projects"
          data={taskStatusDistribution}
          colors={["#22c55e", "#3b82f6", "#94a3b8", "#ef4444"]}
          size={4}
          height={320}
        />
      </Grid>

      {/* 4. Recent Tasks Table */}
      <Grid cols={12} gap={4}>
        <DataTable
          title="Upcoming Tasks"
          columns={[
            { key: "title", label: "Task" },
            { key: "projectName", label: "Project" },
            {
              key: "assignee",
              label: "Assignee",
              render: (val) => <AvatarCell name={val} />,
            },
            {
              key: "priority",
              label: "Priority",
              render: (val) => <PriorityBadge priority={val} />,
            },
            { key: "deadline", label: "Deadline" },
            {
              key: "status",
              label: "Status",
              render: (val) => <StatusPill status={val} />,
            },
          ]}
          rows={recentTasks}
          size={12}
          pageSize={5}
          searchable
          actions={[
            {
              icon: <Eye size={16} />,
              tooltip: "View Details",
              variant: "ghost",
              onClick: handleViewTask,
            },
          ]}
          filters={[
            { title: "Status", type: "toggle", key: "status", options: ["Not Started", "In Progress", "Completed", "Delayed"] }
          ]}
        />
      </Grid>

      {/* 5. Employee Workload */}
      <Grid cols={12} gap={4}>
        <DataTable
          title="Employee Workload"
          columns={[
            {
              key: "name",
              label: "Employee",
              render: (val) => <AvatarCell name={val} />,
            },
            { key: "total", label: "Total Tasks" },
            { key: "completed", label: "Completed" },
            { key: "inProgress", label: "In Progress" },
            { key: "delayed", label: "Delayed" },
          ]}
          rows={employeeWorkload}
          size={12}
          pageSize={5}
        />
      </Grid>

      {/* 6. Support Tickets */}
      <Grid cols={12} gap={4}>
        <DataTable
          title="Support Tickets & Issues"
          columns={[
            { key: "issue", label: "Issue Description" },
            { key: "assignee", label: "Assignee" },
            { key: "priority", label: "Priority" },
            { key: "status", label: "Status" },
          ]}
          rows={ticketList}
          size={12}
          pageSize={5}
          searchable
          actions={[
            {
              icon: <MessageSquare size={16} />,
              tooltip: "Reply",
              variant: "ghost",
              onClick: handleOpenTicketReply,
            }
          ]}
        />
      </Grid>

      {/* ── Task Details Modal ── */}
      <Modal id="dash-task-modal" title="Task Details" size="lg">
        {selectedTask && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selectedTask.title}
              subtitle={selectedTask.description || "No description provided."}
              meta={`Project: ${selectedTask.projectName} · Assigned to: ${selectedTask.assignee}`}
            />
            <ModalGrid title="Details" cols={3}>
              <ModalData label="Status" value={selectedTask.status} />
              <ModalData label="Priority" value={selectedTask.priority} />
              <ModalData label="Deadline" value={selectedTask.deadline} />
            </ModalGrid>
            <Grid cols={12} gap={2} className="pt-2">
              <div className="hidden sm:block sm:col-span-9"></div>
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("dash-task-modal")} />
            </Grid>
          </div>
        )}
      </Modal>

      {/* ── Ticket Reply Modal ── */}
      <Modal id="ticket-reply-modal" title="Ticket Details" size="lg">
        {selectedTicket && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selectedTicket.issue}
              subtitle={`Assigned to: ${selectedTicket.assignee}`}
              meta={`Priority: ${selectedTicket.priority}`}
            />
            <ModalGrid title="Details" cols={2}>
              <ModalData label="Status" value={selectedTicket.status} />
              <ModalData label="Priority" value={selectedTicket.priority} />
            </ModalGrid>
            <div className="flex flex-col gap-1 pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Conversation</p>
              <UserChat 
                messages={selectedTicket.conversation || []} 
                onSend={selectedTicket.status === "Resolved" ? null : handleSendTicketReply}
                currentUser="Team Leader" 
                maxHeight="max-h-72"
                placeholder="Type your reply… (Enter to send)" 
                readOnly={selectedTicket.status === "Resolved"} 
              />
            </div>
            <Grid cols={12} gap={2} className="pt-2">
              <div className="hidden sm:block sm:col-span-9"></div>
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("ticket-reply-modal")} />
            </Grid>
          </div>
        )}
      </Modal>

    </div>
  );
}
