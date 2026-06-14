import { useState, useEffect, useCallback } from "react";
import { getAdminFollowUps } from "../../../services/leadService";
import {
  CalendarClock, Clock, AlertTriangle, CheckCircle2,
  Eye, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  DashGrid, EnhancedDashCard, DataTable,
  PanelModal as Modal, openModal, closeModal,
  ModalData, ModalGrid, ModalProfile,
} from "../../../components/shared/Common_Components";

const FU_COLORS = {
  "Due Today": "bg-amber-100 text-amber-700",
  "Overdue":   "bg-red-100 text-red-700",
  "Upcoming":  "bg-blue-100 text-blue-700",
};

function FUBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${FU_COLORS[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [stats,     setStats]     = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [viewRow,   setViewRow]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await getAdminFollowUps();
      if (res?.data) {
        setFollowUps(res.data.followUps || []);
        setStats(res.data.stats || {});
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load follow-ups");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = followUps.map(f => ({
    ...f,
    fuBadge:     <FUBadge status={f.followUpStatus} />,
    leadBadge:   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.leadStatus === "Won" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{f.leadStatus}</span>,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2a465a]">Follow-Ups</h2>
          <p className="text-sm text-slate-500 mt-0.5">Scheduled follow-ups across all sales reps</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          <AlertCircle size={15} className="shrink-0" /> {error}
          <button onClick={load} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Total"     value={String(stats.total    || 0)} icon={<CalendarClock  size={22} />} accentColor="#3b82f6" size={3} />
        <EnhancedDashCard title="Due Today" value={String(stats.dueToday || 0)} icon={<Clock          size={22} />} accentColor="#f59e0b" size={3} />
        <EnhancedDashCard title="Overdue"   value={String(stats.overdue  || 0)} icon={<AlertTriangle  size={22} />} accentColor="#f43f5e" size={3} />
        <EnhancedDashCard title="Upcoming"  value={String(stats.upcoming || 0)} icon={<CheckCircle2   size={22} />} accentColor="#22c55e" size={3} />
      </DashGrid>

      <DataTable
        title="Follow-Up Schedule"
        columns={[
          { key: "name",        label: "Lead Name" },
          { key: "assignedTo",  label: "Assigned To" },
          { key: "assignedRole",label: "Role" },
          { key: "leadBadge",   label: "Lead Status" },
          { key: "followUpDate",label: "Follow-up Date" },
          { key: "fuBadge",     label: "Status" },
          { key: "talkCount",   label: "Talks" },
          { key: "lastContact", label: "Last Contact" },
        ]}
        rows={rows}
        loading={loading}
        searchable
        exportable
        exportFileName="followups"
        size={12}
        pageSize={10}
        filters={[
          { title: "Status", type: "toggle", key: "followUpStatus", options: ["Due Today","Overdue","Upcoming"] },
        ]}
        actions={[
          {
            icon: <Eye size={15} />, tooltip: "View Details", variant: "ghost",
            onClick: row => { setViewRow(followUps.find(f => f.id === row.id)); openModal("adm-fu-view"); },
          },
        ]}
      />

      <Modal id="adm-fu-view" title="Follow-Up Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile name={viewRow.name} subtitle={viewRow.assignedTo} meta={`Follow-up: ${viewRow.followUpDate}`} />
            <ModalGrid title="Details" cols={2}>
              <ModalData label="Mobile"          value={viewRow.mobile} />
              <ModalData label="Email"           value={viewRow.email} />
              <ModalData label="Lead Status"     value={viewRow.leadStatus} />
              <ModalData label="Follow-up Status" value={viewRow.followUpStatus} />
              <ModalData label="Follow-up Date"  value={viewRow.followUpDate} />
              <ModalData label="Last Contact"    value={viewRow.lastContact} />
              <ModalData label="Talk Count"      value={String(viewRow.talkCount)} />
              <ModalData label="Not Talk Count"  value={String(viewRow.notTalkCount)} />
            </ModalGrid>
            <div className="flex justify-end">
              <button onClick={() => closeModal("adm-fu-view")}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
