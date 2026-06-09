import {
  DashGrid, EnhancedDashCard, DataTable,
} from "../../../../components/shared/Common_Components";
import { Users, UserCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useProjectsStore, getAvatarColor, getInitials } from "../projects/projectsStore";

const statusBadge = (v) => {
  const map = {
    Active:      "bg-emerald-100 text-emerald-700",
    "On Leave":  "bg-amber-100 text-amber-700",
    Inactive:    "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[v] || "bg-slate-100 text-slate-600"}`}>
      {v}
    </span>
  );
};

const countBadge = (v, classes) => (
  <span className={`inline-flex min-w-[1.75rem] justify-center px-2 py-0.5 rounded-full text-xs font-bold ${classes}`}>
    {v}
  </span>
);

export default function TeamMembersTable() {
  const { members, allTasks } = useProjectsStore();

  // ── Per-member workload derived from project tasks ──────────────────────────
  const rows = members.map((m) => {
    const mine        = allTasks.filter((t) => t.assignee === m.name);
    const assigned    = mine.length;
    const inProgress  = mine.filter((t) => t.status === "In Progress").length;
    const completed   = mine.filter((t) => t.status === "Completed").length;
    const delayed     = mine.filter((t) => t.status === "Delayed").length;
    return { ...m, assigned, inProgress, completed, delayed };
  });

  const stats = {
    total:    members.length,
    active:   members.filter((m) => m.status === "Active").length,
    onLeave:  members.filter((m) => m.status === "On Leave").length,
    delayed:  rows.reduce((sum, r) => sum + r.delayed, 0),
  };

  const cols = [
    {
      key: "name",
      label: "Member",
      render: (v) => (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0"
            style={{ background: getAvatarColor(v) }}
          >
            {getInitials(v)}
          </div>
          <span className="font-semibold text-slate-800 text-sm">{v}</span>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (v) => (
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{v || "—"}</span>
      ),
    },
    { key: "email", label: "Email", render: (v) => <span className="text-sm text-slate-600">{v || "—"}</span> },
    { key: "assigned",   label: "Assigned",    render: (v) => countBadge(v, "bg-slate-100 text-slate-600") },
    { key: "inProgress", label: "In Progress", render: (v) => countBadge(v, "bg-blue-100 text-blue-700") },
    { key: "completed",  label: "Completed",   render: (v) => countBadge(v, "bg-emerald-100 text-emerald-700") },
    { key: "delayed",    label: "Delayed",     render: (v) => countBadge(v, v > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500") },
    { key: "status",     label: "Status",      render: statusBadge },
  ];

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Total Members"  value={String(stats.total)}   icon={<Users size={22}/>}        accentColor="#3b82f6" size={3}/>
        <EnhancedDashCard title="Active"         value={String(stats.active)}  icon={<UserCheck size={22}/>}    accentColor="#22c55e" size={3}/>
        <EnhancedDashCard title="On Leave"       value={String(stats.onLeave)} icon={<Loader2 size={22}/>}      accentColor="#f97316" size={3}/>
        <EnhancedDashCard title="Delayed Tasks"  value={String(stats.delayed)} icon={<CheckCircle2 size={22}/>} accentColor="#ef4444" size={3}/>
      </DashGrid>

      <DataTable
        title="Team Members"
        columns={cols}
        rows={rows}
        pageSize={10}
        searchable
        exportable
        exportFileName="team_members"
        filters={[
          { title: "Status", key: "status", type: "toggle", options: ["Active", "On Leave", "Inactive"] },
        ]}
      />
    </div>
  );
}
