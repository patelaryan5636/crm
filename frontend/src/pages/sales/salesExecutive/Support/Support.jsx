import React from "react";
import { Ticket, Clock, AlertTriangle, CheckCircle2, Eye, Reply, CheckCircle } from "lucide-react";
import {
  Heading,
  EnhancedDashCard,
  DashGrid,
  DataTable,
  GBarChart,
  GDoughnutChart,
  HeadingForDataTable,
} from "../../../../components/shared/Common_Components";

export default function Support() {
  const supportStats = [
    { title: "TOTAL TICKETS", value: "15", icon: <Ticket size={20} />, color: "#3b82f6" },
    { title: "OPEN TICKETS", value: "9", icon: <Clock size={20} />, color: "#f59e0b" },
    { title: "HIGH PRIORITY", value: "6", icon: <AlertTriangle size={20} />, color: "#ef4444" },
    { title: "CLOSED", value: "6", icon: <CheckCircle2 size={20} />, color: "#10b981" },
  ];

  const ticketVolumeData = [
    { name: "Mon", opened: 25, resolved: 20 },
    { name: "Tue", opened: 30, resolved: 28 },
    { name: "Wed", opened: 28, resolved: 25 },
    { name: "Thu", opened: 22, resolved: 18 },
    { name: "Fri", opened: 35, resolved: 30 },
    { name: "Sat", opened: 15, resolved: 10 },
    { name: "Sun", opened: 10, resolved: 8 },
  ];

  const categoryDistributionData = [
    { name: "Access", value: 35 },
    { name: "Billing", value: 25 },
    { name: "Bug", value: 15 },
    { name: "Feature", value: 10 },
    { name: "Integration", value: 15 },
  ];

  // Match status colors from Sales Manager panel
  const statusColors = {
    Opened: "bg-amber-100 text-amber-700",
    "In Progress": "bg-purple-100 text-purple-700",
    Replied: "bg-blue-100 text-blue-700",
    Resolved: "bg-emerald-100 text-emerald-700",
    Escalated: "bg-rose-100 text-rose-700",
    Closed: "bg-slate-100 text-slate-700",
  };

  const columns = [
    { key: "ticketId", label: "TICKET ID" },
    { key: "name", label: "TITLE" },
    { key: "company", label: "COMPANY NAME" },
    {
      key: "priority",
      label: "PRIORITY",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-md text-[10px] font-bold ${row.priority === "High"
            ? "bg-rose-100 text-rose-600"
            : row.priority === "Medium"
              ? "bg-amber-100 text-amber-600"
              : "bg-blue-100 text-blue-600"
            }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold ${statusColors[row.status] || "bg-slate-100 text-slate-600"
            }`}
        >
          {row.status}
        </span>
      ),
    },
    { key: "created", label: "CREATED" },
  ];

  const supportData = [
    {
      id: 1,
      ticketId: "SUP-1001",
      name: "Aarav Mehta",
      company: "Nexus Corp",
      priority: "High",
      status: "Opened",
      created: "29 Apr 2026",
    },
    {
      id: 2,
      ticketId: "SUP-1002",
      name: "Neha Singh",
      company: "Globex Inc",
      priority: "Medium",
      status: "Opened",
      created: "28 Apr 2026",
    },
    {
      id: 3,
      ticketId: "SUP-1003",
      name: "Rohan Iyer",
      company: "BlueWave Tech",
      priority: "Low",
      status: "Closed",
      created: "27 Apr 2026",
    },
    {
      id: 4,
      ticketId: "SUP-1004",
      name: "Priya Nair",
      company: "Stark Industries",
      priority: "High",
      status: "Opened",
      created: "26 Apr 2026",
    },
    {
      id: 5,
      ticketId: "SUP-1005",
      name: "Rahul Sharma",
      company: "TechNova Solutions",
      priority: "High",
      status: "Opened",
      created: "25 Apr 2026",
    },
  ];

  const actions = [
    {
      icon: <Eye size={16} />,
      tooltip: "View Ticket",
      variant: "primary",
      onClick: (row) => console.log("View", row),
    },
    {
      icon: <Reply size={16} />,
      tooltip: "Reply",
      variant: "primary",
      onClick: (row) => console.log("Reply", row),
    },
    {
      icon: <CheckCircle2 size={16} />,
      tooltip: "Mark Resolved",
      variant: "danger",
      onClick: (row) => console.log("Resolve", row),
    },
  ];

  return (
    <div className="p-1 space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10">
      <Heading primaryText="Support Ticket" secondaryText="Management" showAnimations />

      <DashGrid cols={12} gap={4}>
        {supportStats.map((stat, idx) => (
          <EnhancedDashCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            accentColor={stat.color}
            size={3}
          />
        ))}
      </DashGrid>

      <DataTable
        title="My Support Tickets"
        columns={columns}
        rows={supportData}
        actions={actions}
        pageSize={5}
        searchable={true}
        size={12}
        filters={[
          { title: "Priority", type: "toggle", key: "priority", options: ["Low", "Medium", "High"] },
          { title: "Status", type: "toggle", key: "status", options: ["Opened", "In Progress", "Replied", "Resolved", "Escalated", "Closed"] },
        ]}
      />

      <DataTable
        title="All Support Tickets"
        columns={[
          ...columns.slice(0, 2),
          { key: "raisedBy", label: "Raised By" },
          { key: "role", label: "Role" },
          ...columns.slice(2),
        ]}
        rows={supportData.map(t => ({ ...t, raisedBy: "Team Member", role: "Executive" }))}
        actions={actions}
        pageSize={10}
        searchable={true}
        size={12}
        filters={[
          { title: "Priority", type: "toggle", key: "priority", options: ["Low", "Medium", "High"] },
          { title: "Status", type: "toggle", key: "status", options: ["Opened", "In Progress", "Replied", "Resolved", "Escalated", "Closed"] },
        ]}
      />
    </div>
  );
}
