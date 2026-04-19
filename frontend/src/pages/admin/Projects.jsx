import React, { useState } from "react";
import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import {
  Heading,
  DashGrid,
  DashCard,
  Grid,
  GBarChart,
  DataTable,
  Button
} from "../../components/shared/Common_Components";

// ── Palette ──
const C = {
  navy: "#355872",
  blue: "#7AAACE",
  sea: "#9CD5FF",
  cold: "#F7F8F0",
  muted: "#94a3b8",
  subtle: "#64748b",
};

// ── Card Style ──
const card = {
  background: C.cold,
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04)",
  transition: "all 0.3s ease",
};

// ── Mock Data ──

const ProgressData = [
  { name: "Barber Project", progress: 23, count: 12 },
  { name: "School Project", progress: 55, count: 8 },
  { name: "CRM Project", progress: 10, count: 4 },
  { name: "Anonymous Project", progress: 75, count: 3 }
];

const upcomingDeadlines = [
  { project: "Q3 Campaign", due: "Tomorrow", priority: "High" },
  { project: "Website Redesign", due: "In 3 Days", priority: "Medium" },
  { project: "Annual Audit", due: "Next Week", priority: "High" },
];

const projectColumns = [
  { key: "name", label: "Project Name" },
  { key: "team", label: "Assigned Team" },
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress" },
  { key: "deadline", label: "Deadline" }
];

const projectRows = [
  {
    name: "Website Redesign",
    team: "3 Members",
    status: <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: "#35587215", color: C.navy }}>In Progress</span>,
    progress: "60%",
    deadline: "Oct 24, 2023"
  },
  {
    name: "Q4 Sales Strategy",
    team: "4 Members",
    status: <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: "#f59e0b15", color: "#f59e0b" }}>Review</span>,
    progress: "90%",
    deadline: "Nov 02, 2023"
  },
  {
    name: "Employee Portal",
    team: "2 Members",
    status: <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: "#22c55e15", color: "#22c55e" }}>Completed</span>,
    progress: "100%",
    deadline: "Dec 15, 2023"
  },
  {
    name: "System Upgrade v2",
    team: "5 Members",
    status: <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: "#94a3b815", color: C.subtle }}>On Hold</span>,
    progress: "20%",
    deadline: "TBD"
  }
];

export default function Projects() {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Heading primaryText="Projects Management" size={12} />
        {/* If Button component fails to import, fallback to standard stylized HTML button */}
      </div>

      {/* 2. KPI Metrics */}
      <div>
        <DashGrid cols={12} gap={4}>
          <DashCard
            title="Active Projects"
            value="24"
            icon={<FolderKanban size={20} />}
            accentColor={C.navy}
            size={3}
          />
          <DashCard
            title="Completed"
            value="12"
            icon={<CheckCircle size={20} />}
            accentColor="#22c55e"
            size={3}
          />
          <DashCard
            title="On Hold"
            value="5"
            icon={<Clock size={20} />}
            accentColor={C.muted}
            size={3}
          />
          <DashCard
            title="At Risk"
            value="3"
            icon={<AlertCircle size={20} />}
            accentColor="#f59e0b"
            size={3}
          />
        </DashGrid>
      </div>

      {/* 3. Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Bar Chart */}
        {/* Standard GBarChart usage handling if it's available */}
        <div className="lg:col-span-8 rounded-2xl p-5 hover:translate-y-[-4px]" style={card}>
          <div className="mb-4">
            <h3 style={{ color: C.navy, fontWeight: 700, fontSize: 16 }}>Project Progress</h3>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 500 }}>Average Completion %</span>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            {ProgressData.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span style={{ color: C.navy, fontSize: 13, fontWeight: 600, width: "90px" }}>{d.name}</span>
                <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: `${C.sea}25` }}>
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{ width: `${d.progress}%`, background: C.blue }}
                  />
                </div>
                <span style={{ color: C.navy, fontSize: 13, fontWeight: 700, width: "40px", textAlign: "right" }}>{d.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Upcoming Deadlines HTML Card */}
        <div className="lg:col-span-4 rounded-2xl p-5 hover:translate-y-[-4px]" style={card}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
              <h3 style={{ color: C.navy, fontWeight: 700, fontSize: 15 }}>Upcoming Deadlines</h3>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {upcomingDeadlines.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span style={{ color: C.navy, fontSize: 13, fontWeight: 700 }}>{item.project}</span>
                  <span style={{ color: item.priority === 'High' ? '#f59e0b' : C.subtle, fontSize: 11, fontWeight: 500 }}>
                    {item.priority} Priority
                  </span>
                </div>
                <span
                  className="px-2 py-1 rounded-md text-xs font-bold"
                  style={{ backgroundColor: `${C.sea}30`, color: C.navy }}
                >
                  {item.due}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Detailed View */}
      <div className="rounded-2xl p-5 hover:translate-y-[-4px]" style={card}>
        <div className="mb-5">
          <h3 style={{ color: C.navy, fontWeight: 700, fontSize: 15 }}>Active & Past Projects</h3>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              {projectColumns.map((col) => (
                <th key={col.key} className="pb-3 px-2 uppercase tracking-wide" style={{ color: C.muted, fontSize: 11, fontWeight: 700 }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projectRows.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group cursor-default">
                <td className="py-3 px-2 rounded-l-lg">
                  <span style={{ color: C.navy, fontSize: 13, fontWeight: 600 }}>{row.name}</span>
                </td>
                <td className="py-3 px-2">
                  <span style={{ color: C.subtle, fontSize: 13, fontWeight: 500 }}>{row.team}</span>
                </td>
                <td className="py-3 px-2">
                  {row.status}
                </td>
                <td className="py-3 px-2">
                  <span style={{ color: C.navy, fontSize: 13, fontWeight: 600 }}>{row.progress}</span>
                </td>
                <td className="py-3 px-2 rounded-r-lg">
                  <span style={{ color: C.subtle, fontSize: 13, fontWeight: 500 }}>{row.deadline}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
