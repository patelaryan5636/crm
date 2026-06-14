import { useState, useEffect, useCallback } from "react";
import { getAdminProspects } from "../../../services/leadService";
import {
  UserCheck, TrendingUp, IndianRupee, BarChart3,
  Eye, RefreshCw, AlertCircle, Trophy,
} from "lucide-react";
import {
  DashGrid, EnhancedDashCard, DataTable,
  PanelModal as Modal, openModal, closeModal,
  ModalData, ModalGrid, ModalProfile,
} from "../../../components/shared/Common_Components";

const HEAT_COLORS = {
  Hot:  "bg-red-100 text-red-700",
  Warm: "bg-amber-100 text-amber-700",
  Cold: "bg-blue-100 text-blue-700",
  Won:  "bg-emerald-100 text-emerald-700",
};

function HeatBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${HEAT_COLORS[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

export default function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [stats,     setStats]     = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [viewRow,   setViewRow]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await getAdminProspects();
      if (res?.data) {
        setProspects(res.data.prospects || []);
        setStats(res.data.stats || {});
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load prospects");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = prospects.map(p => ({
    ...p,
    statusBadge:    <HeatBadge status={p.status} />,
    leadStatusBadge:<span className="text-xs font-bold text-slate-500">{p.leadStatus}</span>,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2a465a]">Prospects</h2>
          <p className="text-sm text-slate-500 mt-0.5">Clients who showed interest — submitted prospect forms</p>
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
        <EnhancedDashCard title="Total Pipeline"   value={stats.totalPipeline || "₹0"} icon={<IndianRupee size={22} />} accentColor="#38bdf8" size={3} />
        <EnhancedDashCard title="Hot Prospects"    value={String(stats.hotCount    || 0)} icon={<TrendingUp   size={22} />} accentColor="#f43f5e" size={3} />
        <EnhancedDashCard title="Warm Prospects"   value={String(stats.warmCount   || 0)} icon={<BarChart3    size={22} />} accentColor="#f59e0b" size={3} />
        <EnhancedDashCard title="Won (Converted)"  value={String(stats.wonCount    || 0)} icon={<Trophy       size={22} />} accentColor="#22c55e" size={3} />
      </DashGrid>

      <DataTable
        title="Prospect Records"
        columns={[
          { key: "name",           label: "Client Name" },
          { key: "service",        label: "Service" },
          { key: "budget",         label: "Budget" },
          { key: "assignedTo",     label: "Assigned To" },
          { key: "statusBadge",    label: "Heat" },
          { key: "leadStatusBadge",label: "Lead Status" },
          { key: "filledBy",       label: "Filed By" },
        ]}
        rows={rows}
        loading={loading}
        searchable
        exportable
        exportFileName="prospects"
        size={12}
        pageSize={10}
        filters={[
          { title: "Heat", type: "toggle", key: "status", options: ["Hot","Warm","Cold","Won"] },
        ]}
        actions={[
          {
            icon: <Eye size={15} />, tooltip: "View Details", variant: "ghost",
            onClick: row => { setViewRow(prospects.find(p => p.id === row.id)); openModal("adm-pr-view"); },
          },
        ]}
      />

      <Modal id="adm-pr-view" title="Prospect Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={viewRow.name}
              subtitle={`${viewRow.assignedTo} · ${viewRow.status}`}
              meta={`Budget: ${viewRow.budget}`}
            />
            <ModalGrid title="Details" cols={2}>
              <ModalData label="Mobile"      value={viewRow.mobile} />
              <ModalData label="Email"       value={viewRow.email} />
              <ModalData label="Service"     value={viewRow.service} />
              <ModalData label="Budget"      value={viewRow.budget} />
              <ModalData label="Assigned To" value={viewRow.assignedTo} />
              <ModalData label="Role"        value={viewRow.assignedRole} />
              <ModalData label="Filed By"    value={viewRow.filledBy} />
              <ModalData label="Lead Status" value={viewRow.leadStatus} />
            </ModalGrid>
            {viewRow.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <strong>Notes:</strong> {viewRow.notes}
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => closeModal("adm-pr-view")}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
