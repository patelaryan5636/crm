import React, { useState } from "react";
import {
  Grid,
  Heading,
  DataField,
  SelectField,
  Option,
  Button,
  DataTable,
  EnhancedDashCard,
  Modal,
  openModal,
  closeModal,
  ModalProfile,
  ModalGrid,
  ModalData,
} from "../../../../components/shared/Common_Components";
import DatePicker from "../../../../components/shared/DatePicker";
import { UserCheck, ListTodo, CheckCircle2, Clock, Eye, Trash2 } from "lucide-react";
import teamsStore from "./teamsStore";
import { useProjectsStore, getAvatarColor, getInitials, PRIORITIES, TASK_STATUSES } from "../projects/projectsStore";

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

export default function AssignReassignTeam() {
  const { projects, allTasks, addTask, deleteTask } = useProjectsStore();
  const [members] = useState(teamsStore.members);
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "" });

  // Assign task form
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    memberId: "",
    priority: "",
    deadline: "",
    description: "",
  });
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const selectedProject = projects.find((p) => p.id === Number(form.projectId));

  const handleAssignTask = () => {
    const { projectId, title, memberId, priority, deadline } = form;
    if (!projectId || !title.trim() || !memberId || !priority || !deadline) {
      showToast("⚠️ Please fill all required fields.", "warning");
      return;
    }
    const member = members.find((m) => String(m.id) === String(memberId));
    if (!member) return;

    const task = addTask(Number(projectId), {
      title: form.title,
      description: form.description,
      assignee: member.name,
      priority: form.priority,
      deadline: form.deadline,
    });
    showToast(`✅ Task "${task.title}" assigned to ${member.name} in "${selectedProject.name}".`);
    setForm({ projectId: "", title: "", memberId: "", priority: "", deadline: "", description: "" });
  };

  const handleClear = () =>
    setForm({ projectId: "", title: "", memberId: "", priority: "", deadline: "", description: "" });

  const handleViewTask = (row) => {
    setSelectedTask(row);
    openModal("art-task-view-modal");
  };

  const handleDeleteTask = (row) => {
    deleteTask(row.projectId, row.id);
    showToast(`🗑️ Task "${row.title}" removed.`);
  };

  // Stats
  const totalAssigned = allTasks.length;
  const completedCount = allTasks.filter((t) => t.status === "Completed").length;
  const inProgressCount = allTasks.filter((t) => t.status === "In Progress").length;
  const pendingCount = allTasks.filter((t) => t.status === "Not Started").length;

  // Task table columns
  const taskColumns = [
    { key: "title", label: "Task" },
    { key: "projectName", label: "Project" },
    {
      key: "assignee",
      label: "Assigned To",
      render: (val) => <AvatarCell name={val} />,
    },
    {
      key: "priority",
      label: "Priority",
    },
    { key: "deadline", label: "Deadline" },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusPill status={val} />,
    },
  ];

  const tableActions = [
    {
      icon: <Eye size={14} />,
      tooltip: "View Task",
      variant: "ghost",
      onClick: handleViewTask,
    },
    {
      icon: <Trash2 size={14} />,
      tooltip: "Remove Task",
      variant: "ghost",
      onClick: handleDeleteTask,
    },
  ];

  return (
    <>
      <Grid cols={12} gap={4}>
        <Heading
          primaryText="Assign Tasks"
          secondaryText="to Team Members"
          size={12}
          showAnimations={false}
        />

        {/* Stats */}
        <EnhancedDashCard title="Total Tasks" value={String(totalAssigned)} icon={<ListTodo size={20} />} accentColor="#3b82f6" size={3} />
        <EnhancedDashCard title="Completed" value={String(completedCount)} icon={<CheckCircle2 size={20} />} accentColor="#22c55e" size={3} />
        <EnhancedDashCard title="In Progress" value={String(inProgressCount)} icon={<Clock size={20} />} accentColor="#6366f1" size={3} />
        <EnhancedDashCard title="Not Started" value={String(pendingCount)} icon={<UserCheck size={20} />} accentColor="#f59e0b" size={3} />

        {/* Assign Task Form */}
        <div className="col-span-12">
          <p className="text-sm font-black text-[#2a465a] mb-1">Assign New Task</p>
          <p className="text-xs text-slate-400 mb-4">
            Create a task within a project and assign it to a team member
          </p>
          <div className="bg-[#efefefb1] rounded-2xl p-5">
            <Grid cols={12} gap={4}>
              <SelectField
                label="Select Project"
                id="art-assign-proj"
                size={6}
                value={form.projectId}
                onChange={set("projectId")}
                placeholder="Choose a project..."
                searchable={true}
              >
                {projects.map((p) => (
                  <Option key={p.id} value={String(p.id)} label={p.name} />
                ))}
              </SelectField>

              <DataField
                label="Task Title"
                id="art-task-title"
                size={6}
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Implement login API"
              />

              <SelectField
                label="Assign To (Team Member)"
                id="art-assign-member"
                size={4}
                value={form.memberId}
                onChange={set("memberId")}
                placeholder="Choose a member..."
              >
                {members.map((m) => (
                  <Option key={m.id} value={String(m.id)} label={`${m.name} (${m.role})`} />
                ))}
              </SelectField>

              <SelectField
                label="Priority"
                id="art-assign-priority"
                size={4}
                value={form.priority}
                onChange={set("priority")}
                placeholder="Select priority..."
                searchable={false}
              >
                {PRIORITIES.map((p) => (
                  <Option key={p} value={p} label={p} />
                ))}
              </SelectField>

              <div className="col-span-12 sm:col-span-4 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] select-none">
                  Deadline
                </label>
                <DatePicker
                  value={form.deadline}
                  onChange={(val) => setForm((f) => ({ ...f, deadline: val }))}
                  placeholder="Select deadline"
                />
              </div>

              <DataField
                label="Task Description (optional)"
                id="art-task-desc"
                type="textarea"
                rows={2}
                placeholder="Describe what this task involves..."
                size={12}
                value={form.description}
                onChange={set("description")}
              />

              <Button
                text="Assign Task →"
                size={4}
                variant="primary"
                onClick={handleAssignTask}
              />
              <Button
                text="Clear"
                size={2}
                variant="secondary"
                onClick={handleClear}
              />

              {toast.msg && <Toast msg={toast.msg} type={toast.type} />}
            </Grid>
          </div>
        </div>

        {/* All Tasks Table */}
        <DataTable
          columns={taskColumns}
          rows={allTasks}
          actions={tableActions}
          title="All Assigned Tasks"
          size={12}
          pageSize={8}
          searchable
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
          exportable
          exportFileName="team-task-assignments"
        />
      </Grid>

      {/* View Task Modal */}
      <Modal id="art-task-view-modal" title="Task Details" size="md">
        {selectedTask && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selectedTask.title}
              subtitle={selectedTask.description || "No description provided."}
              meta={`Project: ${selectedTask.projectName} · Assigned to: ${selectedTask.assignee}`}
            />
            <ModalGrid title="Task Info" cols={2}>
              <ModalData label="Status" value={selectedTask.status} />
              <ModalData label="Priority" value={selectedTask.priority} />
              <ModalData label="Deadline" value={selectedTask.deadline} />
              <ModalData label="Project" value={selectedTask.projectName} />
            </ModalGrid>
            <div className="flex justify-end pt-2">
              <Button
                text="Close"
                variant="ghost"
                size={3}
                onClick={() => closeModal("art-task-view-modal")}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
