import { useState, useEffect, useCallback, useMemo } from "react";
import { getAdminLeads } from "../../../services/leadService";
import {
  Users, Flame, TrendingUp, ArrowRightCircle,
  Eye, LayoutGrid, LayoutList,
  Mail, Target, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  DashGrid, EnhancedDashCard, DataTable,
  PanelModal as Modal, openModal, closeModal,
} from "../../../components/shared/Common_Components";

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["All", "New", "Contacted", "Interested", "Won", "Lost", "Not Interested"];

const STATUS_COLORS = {
  New:            { bg: "bg-blue-100",    text: "text-blue-700" },
  Contacted:      { bg: "bg-amber-100",   text: "text-amber-700" },
  Interested:     { bg: "bg-purple-100",  text: "text-purple-700" },
  Proposal:       { bg: "bg-indigo-100",  text: "text-indigo-700" },
  Won:            { bg: "bg-emerald-100", text: "text-emerald-700" },
  Lost:           { bg: "bg-rose-100",    text: "text-rose-700" },
  "Not Interested": { bg: "bg-slate-100", text: "text-slate-600" },
};

const columns = [
  { key: "name",        label: "Lead Name" },
  { key: "mobile",      label: "Mobile" },
  { key: "email",       label: "Email" },
  { key: "source",      label: "Source" },
  { key: "statusBadge", label: "Status" },
  { key: "owner",       label: "Owner" },
  { key: "value",       label: "Deal Value" },
  { key: "lastContact", label: "Last Contact" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const sc = STATUS_COLORS[status] || { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sc.bg} ${sc.text} border border-black/5`}>
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AllLeads() {
  const [leads,        setLeads]        = useState([]);
  const [stats,        setStats]        = useState({ totalLeads: 0, newToday: 0, hotLeads: 0, converted: 0 });
  const [filterOpts,   setFilterOpts]   = useState({ owners: [], sources: [] });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [ownerFilter,  setOwnerFilter]  = useState("All Owners");
  const [viewMode,     setViewMode]     = useState("table");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminLeads();
      if (res?.data) {
        setLeads(res.data.leads || []);
        setStats(res.data.stats || {});
        setFilterOpts(res.data.filters || { owners: [], sources: [] });
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Client-side filtering
  const filtered = useMemo(() => leads.filter(l => {
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    const matchSource = sourceFilter === "All Sources" || l.source === sourceFilter;
    const matchOwner  = ownerFilter  === "All Owners"  || l.owner  === ownerFilter;
    return matchStatus && matchSource && matchOwner;
  }), [leads, statusFilter, sourceFilter, ownerFilter]);

  // Enrich rows with JSX cells
  const rows = filtered.map(l => ({
    ...l,
    statusBadge: <StatusBadge status={l.status} />,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2a465a]">All Leads</h2>
          <p className="text-sm text-slate-500 mt-0.5">Complete lead pipeline — tenant scoped</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          <AlertCircle size={15} className="shrink-0" /> {error}
          <button onClick={load} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Stat Cards */}
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Total Leads"  value={String(stats.totalLeads  || 0)} icon={<Users           size={22} />} accentColor="#38bdf8" size={3} />
        <EnhancedDashCard title="New Today"    value={String(stats.newToday    || 0)} icon={<TrendingUp       size={22} />} accentColor="#3b82f6" size={3} />
        <EnhancedDashCard title="Hot Leads"    value={String(stats.hotLeads    || 0)} icon={<Flame            size={22} />} accentColor="#f59e0b" size={3} />
        <EnhancedDashCard title="Converted"    value={String(stats.converted   || 0)} icon={<ArrowRightCircle size={22} />} accentColor="#22c55e" size={3} />
      </DashGrid>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#2a465a] focus:outline-none focus:ring-2 focus:ring-[#2a465a]/20 cursor-pointer"
          >
            <option value="All Sources">All Sources</option>
            {filterOpts.sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={ownerFilter}
            onChange={e => setOwnerFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#2a465a] focus:outline-none focus:ring-2 focus:ring-[#2a465a]/20 cursor-pointer"
          >
            <option value="All Owners">All Owners</option>
            {filterOpts.owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 p-0.5 ml-auto">
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition ${viewMode === "table" ? "bg-[#2a465a] text-white" : "text-slate-400 hover:text-[#2a465a]"}`}><LayoutList size={16} /></button>
            <button onClick={() => setViewMode("card")}  className={`p-2 rounded-lg transition ${viewMode === "card"  ? "bg-[#2a465a] text-white" : "text-slate-400 hover:text-[#2a465a]"}`}><LayoutGrid size={16} /></button>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${statusFilter === s ? "bg-[#2a465a] text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Card View */}
      {viewMode === "table" ? (
        <DataTable
          title="Lead Records"
          columns={columns}
          rows={rows}
          loading={loading}
          actions={[
            {
              icon:    <Eye size={14} />,
              tooltip: "View Details",
              variant: "ghost",
              onClick: (row) => { setSelectedLead(leads.find(l => l.id === row.id)); openModal("admin-lead-view"); },
            },
          ]}
          pageSize={10}
          searchable
          exportable
          exportFileName="leads_export"
          size={12}
          filters={[
            { title: "Source", type: "select", key: "source",
              options: filterOpts.sources.length ? filterOpts.sources : ["Website", "Referral", "Cold Call", "Social", "Ads"] },
            { title: "Status", type: "toggle", key: "status",
              options: ["New","Contacted","Interested","Won","Lost"] },
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map(lead => {
            const sc = STATUS_COLORS[lead.status] || { bg: "bg-slate-100", text: "text-slate-600" };
            return (
              <div
                key={lead.id}
                className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
                onClick={() => { setSelectedLead(lead); openModal("admin-lead-view"); }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#2a465a] flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                      {lead.avatar}
                    </div>
                    <div>
                      <p className="text-base font-black text-[#2a465a]">{lead.name}</p>
                      <p className="text-xs font-bold text-slate-400">{lead.mobile}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sc.bg} ${sc.text} border border-black/5`}>{lead.status}</span>
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-sm font-bold text-slate-600 flex items-center gap-2.5"><Mail size={14} className="text-slate-400" /> {lead.email}</p>
                  <p className="text-sm font-bold text-slate-600 flex items-center gap-2.5"><Target size={14} className="text-slate-400" /> {lead.source}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-lg font-black text-[#2a465a]">{lead.value}</span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
                    <Users size={12} className="text-slate-400" />
                    <span className="text-[11px] font-black text-slate-500 uppercase">{lead.owner}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Modal — NO Call button */}
      <Modal id="admin-lead-view" title="Lead Details">
        {selectedLead && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-[#2a465a] flex items-center justify-center text-white font-black text-xl shadow-lg">
                {selectedLead.avatar}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#2a465a]">{selectedLead.name}</h3>
                <p className="text-sm font-bold text-slate-500">{selectedLead.email}</p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={selectedLead.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Mobile",       val: selectedLead.mobile },
                { label: "Source",       val: selectedLead.source },
                { label: "Owner",        val: selectedLead.owner },
                { label: "Assigned By",  val: selectedLead.assignedBy },
                { label: "Deal Value",   val: selectedLead.value },
                { label: "Last Contact", val: selectedLead.lastContact },
                { label: "Next Follow-up", val: selectedLead.nextFollowup },
                { label: "Talk Count",   val: String(selectedLead.talkCount ?? "—") },
              ].map(({ label, val }) => (
                <div key={label}>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</span>
                  <span className="text-[#2a465a] font-bold bg-slate-50 px-3 py-2.5 rounded-xl block border border-slate-100 text-sm">{val || "—"}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => closeModal("admin-lead-view")}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
