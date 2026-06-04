/**
 * UpdateProjectProgress.jsx → "Task Board" Tab
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows ALL tasks across ALL projects in a filterable table:
 *   • Filter by project, employee, status, priority
 *   • Update task status via modal
 *   • View task details
 * Uses Common_Components + projectsStore
 */

import React, { useState, useMemo } from "react";
import {
  Grid,
  DataField,
  SelectField,
  Option,
  Button,
  DataTable,
  Modal,
  ModalProfile,
  ModalGrid,
  ModalData,
  openModal,
  closeModal,
} from "../../../../components/shared/Common_Components";
import {
  useProjectsStore,
  TASK_STATUSES,
  getAvatarColor,
  getInitials,
} from "./projectsStore";
import { Eye, PencilLine, CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";

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

// ── Avatar cell ───────────────────────────────────────────────────────────────
function AvatarCell({ name }) {
  const bg = getAvatarColor(name);
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
        style={{ background: bg }}
      >
        {getInitials(name)}
      </div>
      <span className="text-xs font-semibold text-[#0f172a]">{name}</span>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const cls =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-amber-50 border-amber-200 text-amber-700";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${cls}`}>
      {msg}
    </div>
  );
}

// ── Table columns ────────────────────────────────────────────────────────────
const COLUMNS = [
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
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function UpdateProjectProgress() {
  const { projects, allTasks, taskStats, updateTask } = useProjectsStore();

  const [selectedTask, setSelectedTask] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: "", note: "" });
  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const handleViewTask = (row) => {
    setSelectedTask(row);
    openModal("task-details-modal");
  };

  const handleOpenUpdate = (row) => {
    setSelectedTask(row);
    setUpdateForm({ status: row.status, note: "" });
    openModal("task-update-modal");
  };

  const handleSaveUpdate = () => {
    if (!selectedTask || !updateForm.status) {
      showToast("⚠️ Please select a status.", "warning");
      return;
    }
    updateTask(selectedTask.projectId, selectedTask.id, { status: updateForm.status });
    showToast(`✅ Task "${selectedTask.title}" updated to "${updateForm.status}".`);
    closeModal("task-update-modal");
    setSelectedTask(null);
    setUpdateForm({ status: "", note: "" });
  };

  // Summary stats for header
  const stats = [
    { label: "Total", value: taskStats.total, icon: <ListTodo size={13} />, bg: "#f1f5f9", color: "#475569" },
    { label: "In Progress", value: taskStats.inProgress, icon: <Clock size={13} />, bg: "#dbeafe", color: "#2563eb" },
    { label: "Completed", value: taskStats.completed, icon: <CheckCircle2 size={13} />, bg: "#dcfce7", color: "#16a34a" },
    { label: "Delayed", value: taskStats.delayed, icon: <AlertTriangle size={13} />, bg: "#fee2e2", color: "#dc2626" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Section header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-lg font-black text-[#2a465a]">Task Board</p>
          <p className="text-xs text-slate-400 mt-0.5">
            View and manage all tasks across all projects
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
              style={{ background: s.bg, borderColor: `${s.color}22` }}
            >
              <span style={{ color: s.color }}>{s.icon}</span>
              <span className="text-xs font-bold" style={{ color: s.color }}>
                {s.value} {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast.msg && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── All Tasks Table ── */}
      <DataTable
        title="All Tasks"
        columns={COLUMNS}
        rows={allTasks}
        size={12}
        pageSize={8}
        pageSizeOptions={[5, 8, 15, 25]}
        searchable={true}
        filters={[
          {
            title: "Project",
            type: "toggle",
            key: "projectName",
            options: projects.map((p) => p.name),
          },
          {
            title: "Status",
            type: "toggle",
            key: "status",
            options: ["Not Started", "In Progress", "Completed", "Delayed"],
          },
          {
            title: "Priority",
            type: "toggle",
            key: "priority",
            options: ["Critical", "High", "Medium", "Low"],
          },
        ]}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Details",
            variant: "ghost",
            onClick: handleViewTask,
          },
          {
            icon: <PencilLine size={15} />,
            tooltip: "Update Status",
            variant: "primary",
            onClick: handleOpenUpdate,
          },
        ]}
        exportable
        exportFileName="all-tasks"
      />

      {/* ── Task Details Modal ── */}
      <Modal id="task-details-modal" title="Task Details" size="lg">
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
              <Button
                text="Close"
                variant="ghost"
                size={3}
                onClick={() => closeModal("task-details-modal")}
              />
            </Grid>
          </div>
        )}
      </Modal>

      {/* ── Update Status Modal ── */}
      <Modal id="task-update-modal" title="Update Task Status" size="md">
        {selectedTask && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Task Info" cols={2}>
              <ModalData label="Task" value={selectedTask.title} />
              <ModalData label="Project" value={selectedTask.projectName} />
              <ModalData label="Assignee" value={selectedTask.assignee} />
              <ModalData label="Current Status" value={selectedTask.status} />
            </ModalGrid>

            <Grid cols={12} gap={3}>
              <SelectField
                label="New Status"
                id="task-update-status"
                size={12}
                placeholder="Select new status..."
                value={updateForm.status}
                onChange={(e) => setUpdateForm((f) => ({ ...f, status: e.target.value }))}
                searchable={false}
              >
                {TASK_STATUSES.map((s) => (
                  <Option key={s} value={s} label={s} />
                ))}
              </SelectField>

              <DataField
                label="Update Note (optional)"
                id="task-update-note"
                type="textarea"
                rows={3}
                placeholder="Describe progress, blockers, or notes..."
                size={12}
                value={updateForm.note}
                onChange={(e) => setUpdateForm((f) => ({ ...f, note: e.target.value }))}
              />
            </Grid>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                text="Cancel"
                variant="secondary"
                onClick={() => closeModal("task-update-modal")}
              />
              <Button
                text="Update Status"
                variant="primary"
                onClick={handleSaveUpdate}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
