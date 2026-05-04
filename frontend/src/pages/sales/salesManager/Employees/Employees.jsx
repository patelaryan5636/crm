import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, ModalProfile, Button,
} from "../../../../components/shared/Common_Components";
import { employeeRows, employeeKPIs } from "./EmployeeStore";
import { Users, UserCheck, Briefcase, Activity, Eye } from "lucide-react";

const kpiIcons   = [<Users size={22}/>, <UserCheck size={22}/>, <Briefcase size={22}/>, <Activity size={22}/>];
const kpiAccents = ["#3b82f6", "#8b5cf6", "#14b8a6", "#22c55e"];

// ── Table columns — key info only ──────────────────────────────────────────
const COLS = [
  { key: "name",       label: "Name"         },
  { key: "role",       label: "Role"         },
  { key: "teamName",   label: "Team"         },
  { key: "teamLeader", label: "Team Leader"  },
  { key: "mobile",     label: "Mobile"       },
  { key: "joinDate",   label: "Joined"       },
  { key: "status",     label: "Status"       },
];

// ── Avatar colour palette ──────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-teal-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500", "bg-lime-600", "bg-sky-500",
  "bg-purple-500", "bg-fuchsia-500", "bg-red-500",
];

export default function Employees() {
  const [selected, setSelected] = useState(null);
  const [view,     setView]     = useState("table"); // "table" | "grid"

  const openView = (row) => {
    setSelected(employeeRows.find((e) => e.id === row.id) ?? row);
    openModal("emp-view-modal");
  };

  const actions = [
    {
      icon: <Eye size={15} />, tooltip: "View Details",
      variant: "ghost",
      onClick: openView,
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Heading + KPI Cards ── */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Employee" secondaryText="Directory" size={12} />
        {employeeKPIs.map((k, i) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={kpiIcons[i]} accentColor={kpiAccents[i]} size={3} />
        ))}
      </DashGrid>

      {/* ── View toggle ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">
          {employeeRows.length} employees across 3 teams
        </p>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {[
            { key: "table", label: "Table" },
            { key: "grid",  label: "Cards" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                view === key
                  ? "bg-[#2a465a] text-white shadow"
                  : "text-slate-500 hover:text-[#2a465a] hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table View ── */}
      {view === "table" && (
        <DataTable
          title="All Employees"
          columns={COLS}
          rows={employeeRows}
          actions={actions}
          size={12}
          pageSize={10}
          searchable
          exportable
          exportFileName="employees"
          userProfile="name"
          filters={[
            { title: "Role",   type: "toggle", key: "role",     options: ["Executive", "Team Leader"] },
            { title: "Team",   type: "select", key: "teamName", options: ["Team Alpha", "Team Beta", "Team Gamma"] },
            { title: "Status", type: "toggle", key: "status",   options: ["Active", "Inactive"] },
          ]}
        />
      )}

      {/* ── Card / Grid View ── */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employeeRows.map((emp, idx) => (
            <div
              key={emp.id}
              onClick={() => openView(emp)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            >
              {/* Avatar + status */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-md ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                  {emp.avatar}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  emp.status === "Active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-600"
                }`}>
                  {emp.status}
                </span>
              </div>

              {/* Name + role */}
              <p className="text-sm font-black text-[#2a465a] truncate">{emp.name}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{emp.role}</p>

              {/* Team */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team</p>
                  <p className="text-xs font-semibold text-[#2a465a] mt-0.5">{emp.teamName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">{emp.totalSales}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Leads",    value: emp.totalLeads },
                  { label: "Calls",    value: emp.totalCalls },
                  { label: "Conv %",   value: emp.conversion },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-2 py-1.5 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-black text-[#2a465a] mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── View Modal ── */}
      <Modal id="emp-view-modal" title="Employee Details" size="lg">
        {selected && (() => {
          const colorIdx = employeeRows.findIndex((e) => e.id === selected.id);
          const avatarColor = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
          return (
            <div className="flex flex-col gap-5">

              {/* Profile header */}
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg shrink-0 ${avatarColor}`}>
                  {selected.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black text-[#2a465a]">{selected.name}</p>
                  <p className="text-sm text-slate-500 font-semibold mt-0.5">{selected.role} · {selected.teamName}</p>
                  <p className="text-xs text-slate-400 mt-1">{selected.email}</p>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                  selected.status === "Active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-600"
                }`}>
                  {selected.status}
                </span>
              </div>

              {/* Personal info */}
              <ModalGrid title="Personal Information" cols={2}>
                <ModalData label="Employee ID"    value={selected.id} />
                <ModalData label="Date of Birth"  value={selected.dob} />
                <ModalData label="Gender"         value={selected.gender} />
                <ModalData label="Mobile"         value={selected.mobile} />
                <ModalData label="Email"          value={selected.email} />
                <ModalData label="Address"        value={selected.address} />
              </ModalGrid>

              {/* Work info */}
              <ModalGrid title="Work Information" cols={2}>
                <ModalData label="Role"           value={selected.role} />
                <ModalData label="Department"     value={selected.department} />
                <ModalData label="Team"           value={selected.teamName} />
                <ModalData label="Team Leader"    value={selected.teamLeader} />
                <ModalData label="Employee Type"  value={selected.employeeType} />
                <ModalData label="Join Date"      value={selected.joinDate} />
              </ModalGrid>

              {/* Performance */}
              <ModalGrid title="Performance Summary" cols={3}>
                <ModalData label="Total Leads"  value={String(selected.totalLeads)} />
                <ModalData label="Total Calls"  value={String(selected.totalCalls)} />
                <ModalData label="Total Sales"  value={String(selected.totalSales)} />
                <ModalData label="Revenue"      value={selected.revenue} />
                <ModalData label="Conversion %" value={selected.conversion} />
              </ModalGrid>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("emp-view-modal")} />
              </div>
            </div>
          );
        })()}
      </Modal>

    </div>
  );
}
