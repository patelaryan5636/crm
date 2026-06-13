import { useState, useEffect, useCallback } from "react";
import { getAdminDump } from "../../../services/leadService";
import {
  Trash2, Calendar, AlertTriangle, Users, RefreshCw, AlertCircle, Eye,
} from "lucide-react";
import {
  DashGrid, EnhancedDashCard, DataTable,
  PanelModal as Modal, openModal, closeModal,
  ModalData, ModalGrid, ModalProfile,
} from "../../../components/shared/Common_Components";

export default function DumpData() {
  const [leads,   setLeads]   = useState([]);
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [viewRow, setViewRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await getAdminDump();
      if (res?.data) {
        setLeads(res.data.leads || []);
        setStats(res.data.stats || {});
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load dump data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = leads.map(l => ({
    ...l,
    reasonBadge: (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
        l.dumpReason === "NOT_TALK_EXCEEDED"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-500"
      }`}>
        {l.dumpReason === "NOT_TALK_EXCEEDED" ? "No Contact (3x)" : "Manual"}
      </span>
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2a465a]">Dump Data</h2>
          <p className="text-sm text-slate-500 mt-0.5">Leads that were lost or auto-dumped</p>
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
        <EnhancedDashCard title="Total Dumped"     value={String(stats.total      || 0)} icon={<Trash2         size={22} />} accentColor="#f43f5e" size={3} />
        <EnhancedDashCard title="This Month"       value={String(stats.thisMonth  || 0)} icon={<Calendar       size={22} />} accentColor="#f59e0b" size={3} />
        <EnhancedDashCard title="Auto-Dumped"      value={String(stats.notTalkDump|| 0)} icon={<AlertTriangle  size={22} />} accentColor="#ef4444" size={3} />
        <EnhancedDashCard title="Manual Dump"      value={String(stats.manualDump || 0)} icon={<Users          size={22} />} accentColor="#64748b" size={3} />
      </DashGrid>

      <DataTable
        title="Dump Records"
        columns={[
          { key: "name",         label: "Lead Name" },
          { key: "mobile",       label: "Mobile" },
          { key: "source",       label: "Source" },
          { key: "assignedTo",   label: "Assigned To" },
          { key: "reasonBadge",  label: "Dump Reason" },
          { key: "notTalkCount", label: "Not-Talk Count" },
          { key: "dumpedAt",     label: "Dumped At" },
        ]}
        rows={rows}
        loading={loading}
        searchable
        exportable
        exportFileName="dump_data"
        size={12}
        pageSize={10}
        filters={[
          { title: "Reason", type: "toggle", key: "dumpReason",
            options: ["NOT_TALK_EXCEEDED","Manually Dumped"] },
        ]}
        actions={[
          {
            icon: <Eye size={15} />, tooltip: "View Details", variant: "ghost",
            onClick: row => { setViewRow(leads.find(l => l.id === row.id)); openModal("adm-dump-view"); },
          },
        ]}
      />

      <Modal id="adm-dump-view" title="Dump Lead Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile name={viewRow.name} subtitle={viewRow.assignedTo} meta={`Dumped: ${viewRow.dumpedAt}`} />
            <ModalGrid title="Details" cols={2}>
              <ModalData label="Mobile"       value={viewRow.mobile} />
              <ModalData label="Email"        value={viewRow.email} />
              <ModalData label="Source"       value={viewRow.source} />
              <ModalData label="Assigned To"  value={viewRow.assignedTo} />
              <ModalData label="Dump Reason"  value={viewRow.dumpReason} />
              <ModalData label="Not-Talk Count" value={String(viewRow.notTalkCount)} />
              <ModalData label="Dumped At"    value={viewRow.dumpedAt} />
            </ModalGrid>
            <div className="flex justify-end">
              <button onClick={() => closeModal("adm-dump-view")}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
