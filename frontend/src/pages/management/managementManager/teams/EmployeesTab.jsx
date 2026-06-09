import {
  DashGrid, EnhancedDashCard, DataTable,
} from "../../../../components/shared/Common_Components.jsx";
import { Users, UserCheck, Briefcase, Clock, Loader2 } from "lucide-react";

const statusBadge = (v) => {
  const map = {
    Active:   "bg-emerald-100 text-emerald-700",
    "On Leave":"bg-amber-100 text-amber-700",
    Inactive: "bg-slate-100 text-slate-500",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[v] || "bg-slate-100 text-slate-600"}`}>{v}</span>;
};

export default function EmployeesTab({ employees, overview, loading }) {
  const stats = {
    total:   overview.employees || 0,
    active:  employees.filter((e) => e.status === "Active").length,
    onLeave: employees.filter((e) => e.status === "On Leave").length,
    teams:   overview.teams || 0,
  };

  const cols = [
    { key: "name",        label: "Name", render: (v, row) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#2a465a] text-white text-xs font-black flex items-center justify-center shrink-0">
          {v?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <span className="font-semibold text-slate-800 text-sm">{v}</span>
      </div>
    )},
    { key: "role",        label: "Role",
      render: (v) => <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{v || "—"}</span> },
    { key: "teamLeaders", label: "Team Leader(s)",
      render: (v) => <span className="text-sm text-slate-700">{v || "—"}</span> },
    { key: "teamNames",   label: "Teams",
      render: (v, row) => (
        <span className="text-sm text-slate-600">
          {v || "—"}
          {row.teamCount > 1 && (
            <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">
              {row.teamCount} teams
            </span>
          )}
        </span>
      ),
    },
    { key: "status", label: "Status", render: statusBadge },
  ];

  const rows = employees.map((e) => ({
    ...e,
    // Map API field names to UI column keys
    teamLeaders: e.teamLeaders || "—",
  }));

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Total Employees"  value={stats.total}   icon={<Users size={22}/>}    accentColor="#3b82f6" size={3}/>
        <EnhancedDashCard title="Active"           value={stats.active}  icon={<UserCheck size={22}/>} accentColor="#22c55e" size={3}/>
        <EnhancedDashCard title="On Leave"         value={stats.onLeave} icon={<Clock size={22}/>}    accentColor="#f97316" size={3}/>
        <EnhancedDashCard title="Teams"            value={stats.teams}   icon={<Briefcase size={22}/>} accentColor="#8b5cf6" size={3}/>
      </DashGrid>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading employees…
        </div>
      )}

      {!loading && (
        <DataTable
          title="Employees"
          columns={cols}
          rows={rows}
          pageSize={10}
          searchable
          exportable
          exportFileName="management_employees"
          filters={[
            { title: "Status", key: "status", type: "toggle", options: ["Active", "On Leave", "Inactive"] },
          ]}
        />
      )}
    </div>
  );
}
