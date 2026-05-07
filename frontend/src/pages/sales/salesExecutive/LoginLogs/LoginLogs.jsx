import React from "react";
import { Shield, AlertTriangle, UserCheck, Eye, Ban, MapPin } from "lucide-react";
import {
  Heading,
  EnhancedDashCard,
  DashGrid,
  DataTable,
  GLineChart,
  GDoughnutChart,
  HeadingForDataTable,
} from "../../../../components/shared/Common_Components";

export default function LoginLogs() {
  const loginStats = [
    { title: "TOTAL EXECUTIVE LOGINS", value: "3", icon: <Shield size={20} />, color: "#3b82f6" },
    { title: "FAILED ATTEMPTS", value: "1", icon: <AlertTriangle size={20} />, color: "#ef4444" },
    { title: "ACTIVE EXECUTIVES", value: "3", icon: <UserCheck size={20} />, color: "#10b981" },
  ];

  const weeklyLoginData = [
    { name: "Mon", successful: 120 },
    { name: "Tue", successful: 140 },
    { name: "Wed", successful: 130 },
    { name: "Thu", successful: 160 },
    { name: "Fri", successful: 180 },
    { name: "Sat", successful: 45 },
    { name: "Sun", successful: 30 },
  ];

  const browserDistributionData = [
    { name: "Chrome", value: 65 },
    { name: "Safari", value: 20 },
    { name: "Edge", value: 10 },
    { name: "Firefox", value: 5 },
  ];

  const logCols = [
    { key: "executiveName", label: "User Name"   },
    { key: "ipAddress",     label: "IP Address"  },
    {
      key: "location",
      label: "Location",
      render: (row) => (
        <div className="flex items-center gap-1 text-slate-500 font-medium text-xs">
          <MapPin size={12} className="text-emerald-500" />
          {row.latitude}, {row.longitude}
        </div>
      )
    },
    { key: "loginTime",     label: "Login Time"  },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
            row.status === "Success"
              ? "bg-emerald-500 text-white"
              : row.status === "Pending"
              ? "bg-amber-100 text-amber-600"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  const loginLogsData = [
    {
      id: 1,
      executiveName: "Alice Smith",
      loginTime: "2026-05-05 08:30:00",
      ipAddress: "192.168.1.101",
      latitude: "28.6139",
      longitude: "77.2090",
      status: "Success",
    },
    {
      id: 2,
      executiveName: "Bob Jones",
      loginTime: "2026-05-05 09:15:00",
      ipAddress: "192.168.1.102",
      latitude: "19.0760",
      longitude: "72.8777",
      status: "Pending",
    },
    {
      id: 3,
      executiveName: "Charlie Brown",
      loginTime: "2026-05-04 10:05:00",
      ipAddress: "192.168.1.103",
      latitude: "12.9716",
      longitude: "77.5946",
      status: "Failed",
    },
    {
      id: 4,
      executiveName: "Diana Prince",
      loginTime: "2026-05-04 14:20:00",
      ipAddress: "192.168.1.104",
      latitude: "22.5726",
      longitude: "88.3639",
      status: "Success",
    },
    {
      id: 5,
      executiveName: "Ethan Hunt",
      loginTime: "2026-05-03 16:45:00",
      ipAddress: "192.168.1.105",
      latitude: "13.0827",
      longitude: "80.2707",
      status: "Success",
    },
  ];

  const actions = [
    {
      icon: <Eye size={16} />,
      tooltip: "View Details",
      variant: "primary",
      onClick: (row) => console.log("View", row),
    },
    {
      icon: <Ban size={16} />,
      tooltip: "Delete Record",
      variant: "danger",
      onClick: (row) => console.log("Delete", row),
    },
  ];

  return (
    <div className="p-1 space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10">
      <Heading primaryText="Executive" secondaryText="Login Logs" showAnimations />

      <DashGrid cols={12} gap={4}>
        {loginStats.map((stat, idx) => (
          <EnhancedDashCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            accentColor={stat.color}
            size={4}
          />
        ))}
      </DashGrid>

      <DataTable
        title="My Login Logs"
        columns={logCols}
        rows={loginLogsData}
        actions={actions}
        size={12}
        pageSize={5}
        searchable
        date
        exportable
        exportFileName="my-login-logs"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Success", "Pending", "Failed"] },
        ]}
      />

      <DataTable
        title="All Login Logs"
        columns={logCols}
        rows={loginLogsData}
        actions={actions}
        size={12}
        pageSize={10}
        searchable
        date
        exportable
        exportFileName="all-login-logs"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Success", "Pending", "Failed"] },
        ]}
      />
    </div>
  );
}
