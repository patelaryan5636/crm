/**
 * AssignProjects.jsx → "My Projects" Tab
 * ─────────────────────────────────────────────────────────────────────────────
 * Read-only overview of all projects assigned to this team leader's team.
 * One team = one project. Projects come pre-assigned from the Manager.
 * Shows task completion progress (X/Y tasks done) and drill-down modal.
 * Uses Common_Components + projectsStore
 */

import React, { useState } from "react";
import {
  Grid,
  Button,
  DataTable,
  DataField,
  SelectField,
  Option,
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
import { Eye, PencilLine, CheckCircle2, AlertTriangle, ListTodo, Clock } from "lucide-react";

// ── Progress bar cell ────────────────────────────────────────────────────────
function ProgressCell({ value }) {
  const color = value === 100 ? "#22c55e" : value > 0 ? "#3b82f6" : "#94a3b8";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: `linear-gradient(90deg,#2a465a,${color})` }}
        />
      </div>
      <span className="text-xs font-bold text-[#2a465a] w-8 text-right">{value}%</span>
    </div>
  );
}

// ── Task breakdown mini badge ────────────────────────────────────────────────
function TaskBadge({ tasks }) {
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const total = tasks.length;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
        style={{
          background: completed === total && total > 0 ? "#dcfce7" : "#f1f5f9",
          color: completed === total && total > 0 ? "#16a34a" : "#475569",
        }}
      >
        <CheckCircle2 size={11} />
        {completed}/{total}
      </div>
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    Completed: { bg: "#dcfce7", color: "#16a34a" },
    "In Progress": { bg: "#dbeafe", color: "#2563eb" },
    "Not Started": { bg: "#f1f5f9", color: "#64748b" },
    Delayed: { bg: "#fee2e2", color: "#dc2626" },
    "On Hold": { bg: "#fef3c7", color: "#d97706" },
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

// ── Table columns ────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "name", label: "Project Name" },
  { key: "priority", label: "Priority" },
  { key: "deadline", label: "Deadline" },
  {
    key: "tasks",
    label: "Tasks",
    render: (val) => <TaskBadge tasks={val} />,
  },
  {
    key: "progress",
    label: "Progress",
    render: (val) => <ProgressCell value={val} />,
    sortValue: (row) => row.progress,
  },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusPill status={val} />,
  },
];

// ── Task list columns for the modal ──────────────────────────────────────────
const TASK_COLUMNS = [
  { key: "title", label: "Task" },
  {
    key: "assignee",
    label: "Assignee",
    render: (val) => (
      <div className="flex items-center gap-1.5">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
          style={{ background: getAvatarColor(val) }}
        >
          {getInitials(val)}
        </div>
        <span className="text-xs font-semibold text-[#0f172a]">{val}</span>
      </div>
    ),
  },
  { key: "priority", label: "Priority" },
  { key: "deadline", label: "Deadline" },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusPill status={val} />,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
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

export default function AssignProjects() {
  const { projects, updateTask } = useProjectsStore();
  const [selectedProject, setSelectedProject] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [editTaskStatuses, setEditTaskStatuses] = useState({});
  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const handleViewProject = (row) => {
    setSelectedProject(row);
    openModal("my-project-details-modal");
  };

  const handleEditProgress = (row) => {
    setEditProject(row);
    // Initialize task statuses from current values
    const statuses = {};
    row.tasks.forEach((t) => {
      statuses[t.id] = t.status;
    });
    setEditTaskStatuses(statuses);
    openModal("my-project-edit-progress-modal");
  };

  const handleSaveProgress = () => {
    if (!editProject) return;
    let updatedCount = 0;
    editProject.tasks.forEach((t) => {
      if (editTaskStatuses[t.id] && editTaskStatuses[t.id] !== t.status) {
        updateTask(editProject.id, t.id, { status: editTaskStatuses[t.id] });
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      showToast(`✅ Updated ${updatedCount} task${updatedCount > 1 ? "s" : ""} in "${editProject.name}".`);
    } else {
      showToast("ℹ️ No changes were made.", "warning");
    }
    closeModal("my-project-edit-progress-modal");
    setEditProject(null);
    setEditTaskStatuses({});
  };

  // Summary stats
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "Completed").length,
    0
  );
  const delayedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "Delayed").length,
    0
  );
  const inProgressTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "In Progress").length,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ── Section header + stats ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-lg font-black text-[#2a465a]">My Projects</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of all projects assigned to your team with task completion status
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
            <ListTodo size={13} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-700">{totalTasks} Tasks</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-100">
            <Clock size={13} className="text-cyan-600" />
            <span className="text-xs font-bold text-cyan-700">{inProgressTasks} Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">{completedTasks} Done</span>
          </div>
          {delayedTasks > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle size={13} className="text-red-500" />
              <span className="text-xs font-bold text-red-600">{delayedTasks} Delayed</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Projects Table ── */}
      <div>
        <DataTable
          columns={COLUMNS}
          rows={projects}
          size={12}
          pageSize={5}
          pageSizeOptions={[5, 10, 20]}
          searchable={true}
          filters={[
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
              icon: <Eye size={16} />,
              tooltip: "View Project & Tasks",
              variant: "ghost",
              onClick: handleViewProject,
            },
            {
              icon: <PencilLine size={16} />,
              tooltip: "Edit Progress",
              variant: "primary",
              onClick: handleEditProgress,
            },
          ]}
          exportable
          exportFileName="my-projects"
        />
      </div>

      {/* ── Project Details Modal ── */}
      <Modal id="my-project-details-modal" title="Project Details" size="lg">
        {selectedProject && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selectedProject.name}
              subtitle={selectedProject.description}
              meta={`Priority: ${selectedProject.priority} · Deadline: ${selectedProject.deadline}`}
            />
            <ModalGrid title="Overview" cols={3}>
              <ModalData label="Status" value={selectedProject.status} />
              <ModalData label="Progress" value={`${selectedProject.progress}%`} />
              <ModalData
                label="Tasks"
                value={`${selectedProject.tasks.filter((t) => t.status === "Completed").length}/${selectedProject.tasks.length} completed`}
              />
            </ModalGrid>

            {/* Task list inside the modal */}
            {selectedProject.tasks.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Task Breakdown
                </p>
                <DataTable
                  columns={TASK_COLUMNS}
                  rows={selectedProject.tasks}
                  size={12}
                  pageSize={5}
                  searchable={false}
                />
              </div>
            )}

            {selectedProject.tasks.length === 0 && (
              <div className="flex flex-col items-center py-6 text-slate-400">
                <ListTodo size={28} strokeWidth={1.5} />
                <p className="text-xs font-semibold mt-2">No tasks assigned yet. Use the "Assign Tasks" tab to add tasks.</p>
              </div>
            )}

            <Grid cols={12} gap={2} className="pt-2">
              <div className="hidden sm:block sm:col-span-9"></div>
              <Button
                text="Close"
                variant="ghost"
                size={3}
                onClick={() => closeModal("my-project-details-modal")}
              />
            </Grid>
          </div>
        )}
      </Modal>

      {/* ── Edit Progress Modal ── */}
      <Modal id="my-project-edit-progress-modal" title="Edit Project Progress" size="lg">
        {editProject && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={editProject.name}
              subtitle={editProject.description}
              meta={`Priority: ${editProject.priority} · Deadline: ${editProject.deadline} · Current Progress: ${editProject.progress}%`}
            />

            {editProject.tasks.length > 0 ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Update Task Statuses
                </p>
                <div className="flex flex-col gap-2">
                  {editProject.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2a465a] truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-black"
                              style={{ background: getAvatarColor(task.assignee) }}
                            >
                              {getInitials(task.assignee)}
                            </div>
                            <span className="text-[11px] text-slate-500">{task.assignee}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">·</span>
                          <span className="text-[11px] text-slate-500">{task.priority}</span>
                          <span className="text-[11px] text-slate-400">·</span>
                          <span className="text-[11px] text-slate-500">Due: {task.deadline}</span>
                        </div>
                      </div>
                      <div className="w-44 flex-shrink-0">
                        <SelectField
                          label=""
                          id={`edit-task-status-${task.id}`}
                          size={12}
                          value={editTaskStatuses[task.id] || task.status}
                          onChange={(e) =>
                            setEditTaskStatuses((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          searchable={false}
                        >
                          {TASK_STATUSES.map((s) => (
                            <Option key={s} value={s} label={s} />
                          ))}
                        </SelectField>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-slate-400">
                <ListTodo size={28} strokeWidth={1.5} />
                <p className="text-xs font-semibold mt-2">No tasks to update.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                text="Cancel"
                variant="secondary"
                onClick={() => closeModal("my-project-edit-progress-modal")}
              />
              <Button
                text="Save Progress"
                variant="primary"
                onClick={handleSaveProgress}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast.msg && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
