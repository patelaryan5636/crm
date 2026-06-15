import { useState, useEffect, useCallback, useMemo } from "react";
import { getAdminSalesTargets } from "../../../services/leadService";
import {
  Target, CheckCircle2, Clock, AlertTriangle, Trophy,
  TrendingUp, RefreshCw, AlertCircle, CalendarDays, Eye,
} from "lucide-react";
import {
  DashGrid, EnhancedDashCard, DataTable,
  GBarChart, Modal, openModal, closeModal,
  ModalData, ModalGrid, ModalProfile,
} from "../../../components/shared/Common_Components";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_COLORS = {
  "Completed":  "bg-emerald-100 text-emerald-700",
  "In Progress":"bg-blue-100 text-blue-700",
  "Pending":    "bg-amber-100 text-amber-700",
  "Overdue":    "bg-red-100 text-red-600",
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

function ProgressBar({ pct }) {
  const color = pct >= 90 ? "#22c55e" : pct >= 60 ? "#3b82f6" : pct >= 30 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-slate-600 w-9 text-right">{pct}%</span>
    </div>
  );
}

const now = new Date();

export default function Targets() {
  const [targets,  setTargets]  = useState([]);
  const [stats,    setStats]    = useState({});
  const [chartData,setChartData]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [viewRow,  setViewRow]  = useState(null);

  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const load = useCallback(async (m, y) => {
    setLoading(true); setError("");
    try {
      const res = await getAdminSalesTargets({ month: m, year: y });
      if (res?.data) {
        setTargets(res.data.targets    || []);
        setStats(res.data.stats        || {});
        setChartData(res.data.chartData || []);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load targets");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(selMonth, selYear); }, [load, selMonth, selYear]);

  // Top performer
  const topPerformer = useMemo(() =>
    targets.length ? targets.reduce((b, c) => c.overallPct > b.overallPct ? c : b, targets[0]) : null,
  [targets]);

  const rows = targets.map(t => ({
    ...t,
    roleBadge:    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">{t.memberRole}</span>,
    callProgress: <ProgressBar pct={t.callPct} />,
    salesProgress:<ProgressBar pct={t.salesPct} />,
    overallBar:   <ProgressBar pct={t.overallPct} />,
    statusBadge:  (
      <div className="flex items-center gap-1.5">
        <StatusBadge status={t.status} />
        {topPerformer && t.id === topPerformer.id && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-200">
            <Trophy size={10} /> Top
          </span>
        )}
      </div>
    ),
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#2a465a] flex items-center gap-2">
            Sales Targets <Target className="text-[#38bdf8]" size={24} />
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">All team targets across TLs and Sales Executives</p>
        </div>
        {/* Month/Year selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <CalendarDays size={15} className="text-slate-400" />
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={selMonth}
            onChange={e => setSelMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => load(selMonth, selYear)} disabled={loading}
            className="ml-1 p-1 rounded-lg hover:bg-slate-100 transition text-slate-500 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          <AlertCircle size={15} className="shrink-0" /> {error}
          <button onClick={() => load(selMonth, selYear)} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Total Targets"   value={String(stats.total      || 0)} icon={<Target        size={22} />} accentColor="#3b82f6" size={2} />
        <EnhancedDashCard title="Completed"        value={String(stats.completed  || 0)} icon={<CheckCircle2  size={22} />} accentColor="#22c55e" size={2} />
        <EnhancedDashCard title="In Progress"      value={String(stats.inProgress || 0)} icon={<TrendingUp    size={22} />} accentColor="#f59e0b" size={2} />
        <EnhancedDashCard title="Overdue"          value={String(stats.overdue    || 0)} icon={<AlertTriangle size={22} />} accentColor="#f43f5e" size={2} />
        <EnhancedDashCard title="Pending"          value={String(stats.pending    || 0)} icon={<Clock         size={22} />} accentColor="#64748b" size={2} />
        <EnhancedDashCard title="Avg Progress"     value={`${stats.avgProgress || 0}%`} icon={<Trophy        size={22} />} accentColor="#8b5cf6" size={2} />
      </DashGrid>

      {/* Top Performer Banner */}
      {topPerformer && (
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/60 px-6 py-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Trophy size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
              Top Performer — {MONTHS[selMonth - 1]} {selYear}
            </p>
            <p className="text-base font-black text-[#2a465a] mt-0.5">
              {topPerformer.memberName}
              <span className="font-bold text-slate-400"> · </span>
              <span className="text-sm font-bold text-slate-500">{topPerformer.memberRole}</span>
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-black text-[#2a465a]">{topPerformer.overallPct}%</p>
            <p className="text-xs font-bold text-emerald-600">Overall Progress</p>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        title={`${MONTHS[selMonth - 1]} ${selYear} — All Targets`}
        columns={[
          { key: "memberName",   label: "Team Member" },
          { key: "roleBadge",    label: "Role" },
          { key: "setBy",        label: "Set By" },
          { key: "targetCalls",  label: "Target Calls" },
          { key: "achievedCalls",label: "Done Calls" },
          { key: "callProgress", label: "Calls %" },
          { key: "targetSales",  label: "Target Sales" },
          { key: "achievedSales",label: "Done Sales" },
          { key: "salesProgress",label: "Sales %" },
          { key: "overallBar",   label: "Overall" },
          { key: "statusBadge",  label: "Status" },
        ]}
        rows={rows}
        loading={loading}
        searchable
        exportable
        exportFileName={`targets_${selMonth}_${selYear}`}
        size={12}
        pageSize={10}
        filters={[
          { title: "Status", type: "toggle", key: "status",
            options: ["Completed","In Progress","Pending","Overdue"] },
        ]}
        actions={[
          {
            icon: <Eye size={15} />, tooltip: "View Details", variant: "ghost",
            onClick: row => { setViewRow(targets.find(t => t.id === row.id)); openModal("adm-tgt-view"); },
          },
        ]}
      />

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="rounded-[2.5rem] border border-slate-200/60 bg-white p-8 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Target size={120} />
          </div>
          <GBarChart
            title="Target vs Achieved"
            subtitle={`${MONTHS[selMonth - 1]} ${selYear} — Calls & Conversions`}
            data={chartData}
            bars={[
              { key: "targetCalls", label: "Target Calls",  color: "#e2e8f0" },
              { key: "calls",       label: "Calls Done",    color: "#2a465a" },
              { key: "targetSales", label: "Target Sales",  color: "#bfdbfe" },
              { key: "sales",       label: "Sales Done",    color: "#3b82f6" },
            ]}
            height={320}
          />
        </div>
      )}

      {/* View Modal */}
      <Modal id="adm-tgt-view" title="Target Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={viewRow.memberName}
              subtitle={`${viewRow.memberRole} · Set by ${viewRow.setBy}`}
              meta={viewRow.period}
            />
            <ModalGrid title="Target vs Achieved" cols={3}>
              <ModalData label="Target Calls"    value={String(viewRow.targetCalls)} />
              <ModalData label="Achieved Calls"  value={String(viewRow.achievedCalls)} />
              <ModalData label="Remaining Calls" value={String(viewRow.remainingCalls)} />
              <ModalData label="Target Sales"    value={String(viewRow.targetSales)} />
              <ModalData label="Achieved Sales"  value={String(viewRow.achievedSales)} />
              <ModalData label="Remaining Sales" value={String(viewRow.remainingSales)} />
            </ModalGrid>
            <ModalGrid title="Progress" cols={3}>
              <ModalData label="Calls %"   value={`${viewRow.callPct}%`} />
              <ModalData label="Sales %"   value={`${viewRow.salesPct}%`} />
              <ModalData label="Overall %"  value={`${viewRow.overallPct}%`} />
              <ModalData label="Status"    value={viewRow.status} />
            </ModalGrid>
            {viewRow.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <strong>Notes:</strong> {viewRow.notes}
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => closeModal("adm-tgt-view")}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
