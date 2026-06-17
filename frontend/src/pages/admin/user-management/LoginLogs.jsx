/**
 * LoginLogs.jsx — Admin panel
 * Two tables:
 *  1. "My Login History"  — admin's own sessions (from /api/logs/login)
 *  2. "All Users' Logins" — every user in the tenant (from /api/users/login-logs)
 */

import { useState, useEffect, useCallback } from "react";
import { LogIn, Calendar, Users, MapPin, Eye, Shield, Clock } from "lucide-react";
import {
  DashGrid, EnhancedDashCard, DataTable,
  PanelModal as Modal, openModal, closeModal,
  ModalData, ModalProfile,
} from "../../../components/shared/Common_Components";
import apiClient from "../../../services/apiClient";

// ── column definitions ───────────────────────────────────────────────────────
const myLogCols = [
  { key: "date",   label: "Date"       },
  { key: "time",   label: "Time"       },
  { key: "ip",     label: "IP Address" },
  { key: "device", label: "Device"     },
  { key: "status", label: "Status",
    render: (v) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
        v === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}>{v}</span>
    ),
  },
];

const allLogCols = [
  { key: "username", label: "User"       },
  { key: "role",     label: "Role"       },
  { key: "dateTime", label: "Date & Time"},
  { key: "ip",       label: "IP Address" },
  { key: "latitude", label: "Latitude"   },
  { key: "longitude",label: "Longitude"  },
  {
    key: "isSuccess", label: "Status",
    render: (v) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
        v ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}>
        {v ? "Success" : "Failed"}
      </span>
    ),
  },
];

// ── component ────────────────────────────────────────────────────────────────
export default function LoginLogs() {
  // ── My logs state ──
  const [myLogs,      setMyLogs]      = useState([]);
  const [myStats,     setMyStats]     = useState({ myLoginsToday: 0, myTotalLogins: 0 });
  const [myLoading,   setMyLoading]   = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // ── All-users logs state ──
  const [allLogs,     setAllLogs]     = useState([]);
  const [allStats,    setAllStats]    = useState({ total: 0, todayLogins: 0, uniqueUsers: 0, uniqueIPs: 0 });
  const [allLoading,  setAllLoading]  = useState(true);

  // ── Fetch admin's own login history ──────────────────────────────────────
  const fetchMyLogs = useCallback(async () => {
    setMyLoading(true);
    try {
      const res = await apiClient.get("/logs/login");
      const data = res.data?.data || {};
      setMyLogs(data.myLogs || []);
      setMyStats(data.kpiStats || { myLoginsToday: 0, myTotalLogins: 0 });
    } catch (err) {
      console.error("Failed to fetch my login logs:", err);
    } finally {
      setMyLoading(false);
    }
  }, []);

  // ── Fetch all users' login logs ──────────────────────────────────────────
  const fetchAllLogs = useCallback(async () => {
    setAllLoading(true);
    try {
      const res = await apiClient.get("/users/login-logs?limit=200");
      setAllLogs(res.data?.data?.logs   || []);
      setAllStats(res.data?.data?.stats || { total: 0, todayLogins: 0, uniqueUsers: 0, uniqueIPs: 0 });
    } catch (err) {
      console.error("Failed to fetch all login logs:", err);
    } finally {
      setAllLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLogs();
    fetchAllLogs();
  }, [fetchMyLogs, fetchAllLogs]);

  const uniqueRoles = [...new Set(allLogs.map((l) => l.role).filter(Boolean))].sort();

  const myLogActions = [
    {
      icon: <Eye size={15} />,
      tooltip: "View Details",
      variant: "ghost",
      onClick: (row) => { setSelectedLog(row); openModal("admin-log-view-modal"); },
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Section: My Login History ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2a465a]/10 flex items-center justify-center">
            <Shield size={16} className="text-[#2a465a]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2a465a]">My Login History</h3>
            <p className="text-xs text-slate-500">Your personal session records</p>
          </div>
        </div>

        {/* My KPIs */}
        <DashGrid cols={12} gap={4}>
          <EnhancedDashCard
            title="My Logins Today"
            value={myLoading ? "—" : String(myStats.myLoginsToday)}
            icon={<Clock size={22} />}
            accentColor="#7AAACE"
            size={3}
          />
          <EnhancedDashCard
            title="My Total Logins"
            value={myLoading ? "—" : String(myStats.myTotalLogins)}
            icon={<LogIn size={22} />}
            accentColor="#2a465a"
            size={3}
          />
        </DashGrid>

        {/* My Logs Table */}
        <DataTable
          title="My Sessions"
          columns={myLogCols}
          ellipse={7}
          rows={myLogs}
          actions={myLogActions}
          pageSize={10}
          searchable
          size={12}
          loading={myLoading}
          onRefresh={fetchMyLogs}
          exportable
          exportFileName="my_login_logs"
          filters={[
            { title: "Status", type: "toggle", key: "status", options: ["Success", "Failed"] },
          ]}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* ── Section: All Users' Login Activity ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2a465a]/10 flex items-center justify-center">
            <Users size={16} className="text-[#2a465a]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2a465a]">All Users' Login Activity</h3>
            <p className="text-xs text-slate-500">Login records for every user in your organisation</p>
          </div>
        </div>

        {/* All-users KPIs */}
        <DashGrid cols={12} gap={4}>
          <EnhancedDashCard title="Total Logins"   value={allLoading ? "—" : String(allStats.total)}        icon={<LogIn size={22}/>}     accentColor="#38bdf8" size={3} />
          <EnhancedDashCard title="Today's Logins" value={allLoading ? "—" : String(allStats.todayLogins)}  icon={<Calendar size={22}/>}  accentColor="#3b82f6" size={3} />
          <EnhancedDashCard title="Unique Users"   value={allLoading ? "—" : String(allStats.uniqueUsers)}  icon={<Users size={22}/>}     accentColor="#22c55e" size={3} />
          <EnhancedDashCard title="Unique IPs"     value={allLoading ? "—" : String(allStats.uniqueIPs)}    icon={<MapPin size={22}/>}    accentColor="#f59e0b" size={3} />
        </DashGrid>

        {/* All Logs Table */}
        <DataTable
          title="Login Activity Records"
          columns={allLogCols}
          rows={allLogs}
          pageSize={10}
          searchable
          size={12}
          loading={allLoading}
          onRefresh={fetchAllLogs}
          filters={uniqueRoles.length > 0 ? [
            { title: "Role", type: "toggle", key: "role", options: uniqueRoles },
            {
              title: "Status", type: "toggle", key: "isSuccess",
              options: [true, false],
              fn: (row, values) => values.some((v) => String(row.isSuccess) === String(v)),
            },
          ] : []}
          exportable
          exportFileName="all_login_logs"
        />
      </div>

      {/* ── My Log Detail Modal ───────────────────────────────────────── */}
      <Modal id="admin-log-view-modal" title="Session Details">
        {selectedLog && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name="Admin"
              subtitle={`${selectedLog.ip} · ${selectedLog.latitude}, ${selectedLog.longitude}`}
              meta={`${selectedLog.date} at ${selectedLog.time}`}
            />
            <div className="grid grid-cols-2 gap-3">
              <ModalData label="Login Date"   value={selectedLog.date}      />
              <ModalData label="Login Time"   value={selectedLog.time}      />
              <ModalData label="IP Address"   value={selectedLog.ip}        />
              <ModalData label="Status"       value={selectedLog.status}    />
              <ModalData label="Latitude"     value={selectedLog.latitude}  />
              <ModalData label="Longitude"    value={selectedLog.longitude} />
              <ModalData label="Device" value={selectedLog.device} />
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => closeModal("admin-log-view-modal")}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
