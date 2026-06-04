/**
 * ReassignProjects.jsx → "Assign Tasks" Tab
 * ─────────────────────────────────────────────────────────────────────────────
 * Create and assign granular tasks within a project:
 *   1. Select a project from dropdown
 *   2. Fill task form (title, description, assignee, priority, deadline)
 *   3. Submit → task added to that project's tasks[]
 *   4. Live table of tasks for the selected project below
 * Uses Common_Components + projectsStore
 */

import React, { useState } from "react";
import {
  Grid,
  DataField,
  SelectField,
  Option,
  Button,
  DataTable,
} from "../../../../components/shared/Common_Components";
import DatePicker from "../../../../components/shared/DatePicker";
import {
  useProjectsStore,
  EMPLOYEE_NAMES,
  PRIORITIES,
  getAvatarColor,
  getInitials,
} from "./projectsStore";
import { Plus, Trash2, ListTodo } from "lucide-react";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const cls =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-amber-50 border-amber-200 text-amber-700";
  return (
    <div className={`col-span-12 rounded-2xl border px-4 py-3 text-sm font-semibold ${cls}`}>
      {msg}
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

// ── Avatar cell ───────────────────────────────────────────────────────────────
function AvatarCell({ name }) {
  const bg = getAvatarColor(name);
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
        style={{ background: bg }}
      >
        {getInitials(name)}
      </div>
      <span className="text-sm font-semibold text-[#0f172a]">{name}</span>
    </div>
  );
}

// ── Task table columns ────────────────────────────────────────────────────────
const TASK_COLUMNS = [
  { key: "title", label: "Task Title" },
  {
    key: "assignee",
    label: "Assigned To",
    render: (val) => <AvatarCell name={val} />,
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
export default function ReassignProjects() {
  const { projects, addTask, deleteTask } = useProjectsStore();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [form, setForm] = useState({
    title: "",
    assignee: "",
    deadline: "",
    priority: "",
    description: "",
  });
  const [toast, setToast] = useState({ msg: "", type: "" });

  const selectedProject = projects.find((p) => p.id === Number(selectedProjectId));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
  };

  const handleAddTask = () => {
    const { title, assignee, deadline, priority } = form;
    if (!selectedProjectId) {
      showToast("⚠️ Please select a project first.", "warning");
      return;
    }
    if (!title.trim() || !assignee || !deadline || !priority) {
      showToast("⚠️ Please fill all required fields.", "warning");
      return;
    }
    const task = addTask(Number(selectedProjectId), form);
    showToast(`✅ Task "${task.title}" assigned to ${task.assignee} in "${selectedProject.name}".`);
    setForm({ title: "", assignee: "", deadline: "", priority: "", description: "" });
  };

  const handleClear = () =>
    setForm({ title: "", assignee: "", deadline: "", priority: "", description: "" });

  const handleDeleteTask = (row) => {
    if (selectedProject) {
      deleteTask(selectedProject.id, row.id);
      showToast(`🗑️ Task "${row.title}" removed.`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Section header ── */}
      <div>
        <p className="text-lg font-black text-[#2a465a]">Assign Tasks</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Create and assign tasks to team members within a project
        </p>
      </div>

      {/* ── Form ── */}
      <div className="bg-[#efefefb1] rounded-2xl p-5">
        <Grid cols={12} gap={4}>
          {/* Step 1: Select project */}
          <SelectField
            label="Select Project"
            id="assign-task-project"
            size={12}
            placeholder="Choose a project to add tasks to..."
            value={selectedProjectId}
            onChange={handleProjectChange}
            searchable={true}
          >
            {projects.map((p) => (
              <Option key={p.id} value={String(p.id)} label={`${p.name} (${p.tasks.length} tasks)`} />
            ))}
          </SelectField>

          {/* Project info strip */}
          {selectedProject && (
            <div className="col-span-12 flex flex-wrap gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                📋 {selectedProject.name}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                ⏰ Due: {selectedProject.deadline}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                📊 {selectedProject.progress}% complete
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                ✅ {selectedProject.tasks.filter((t) => t.status === "Completed").length}/{selectedProject.tasks.length} tasks done
              </div>
            </div>
          )}

          {/* Divider */}
          {selectedProject && (
            <div className="col-span-12">
              <div className="border-t border-slate-200 pt-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Plus size={12} /> New Task Details
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Task fields */}
          <DataField
            label="Task Title"
            id="assign-task-title"
            placeholder="e.g. Implement login API"
            size={6}
            value={form.title}
            onChange={set("title")}
          />

          <SelectField
            label="Assign To (Employee)"
            id="assign-task-employee"
            size={6}
            placeholder="Select employee..."
            value={form.assignee}
            onChange={set("assignee")}
            searchable={false}
          >
            {EMPLOYEE_NAMES.map((e) => (
              <Option key={e} value={e} label={e} />
            ))}
          </SelectField>

          <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] select-none">
              Task Deadline
            </label>
            <DatePicker
              value={form.deadline}
              onChange={(val) => setForm((f) => ({ ...f, deadline: val }))}
              placeholder="Select task deadline"
            />
          </div>

          <SelectField
            label="Priority"
            id="assign-task-priority"
            size={6}
            placeholder="Select priority..."
            value={form.priority}
            onChange={set("priority")}
            searchable={false}
          >
            {PRIORITIES.map((p) => (
              <Option key={p} value={p} label={p} />
            ))}
          </SelectField>

          <DataField
            label="Task Description"
            id="assign-task-desc"
            type="textarea"
            rows={3}
            placeholder="Brief description of what this task involves..."
            size={12}
            value={form.description}
            onChange={set("description")}
          />

          <Button
            text="Assign Task →"
            size={4}
            variant="primary"
            onClick={handleAddTask}
          />
          <Button
            text="Clear Form"
            size={4}
            variant="secondary"
            onClick={handleClear}
          />

          {toast.msg && <Toast msg={toast.msg} type={toast.type} />}
        </Grid>
      </div>

      {/* ── Tasks table for selected project ── */}
      {selectedProject && (
        <div>
          <p className="text-sm font-black text-[#2a465a] mb-3">
            Tasks in "{selectedProject.name}" ({selectedProject.tasks.length})
          </p>
          <DataTable
            columns={TASK_COLUMNS}
            rows={selectedProject.tasks}
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
                icon: <Trash2 size={14} />,
                tooltip: "Remove Task",
                variant: "ghost",
                onClick: handleDeleteTask,
              },
            ]}
          />
        </div>
      )}

      {!selectedProject && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <ListTodo size={40} strokeWidth={1.5} />
          <p className="text-sm font-semibold mt-3">Select a project above to view and assign tasks</p>
        </div>
      )}
    </div>
  );
}
