/**
 * Targets.jsx — Sales Manager (READ-ONLY)
 *
 * Shows all targets set by Sales Team Leaders for this admin tenant.
 * Sales Manager can VIEW targets and sync live progress.
 * Sales Manager cannot CREATE, EDIT, or DELETE targets (TL owns that).
 *
 * API:
 *   GET  /api/targets/tl/team          — all targets for selected month/year
 *   POST /api/targets/sync             — recalculate achieved from live DB
 */
import { useState, useEffect, useCallback } from "react";
import {
  Heading, DashGrid, EnhancedDashCard, DataTable,
  Button, Modal, ModalData, ModalGrid, ModalProfile,
  openModal, closeModal,
} from "../../../../components/shared/Common_Components";
import salesTargetService from "../../../../services/salesTargetService";
import { Target, CheckCircle, Clock, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const TARGET_COLS = [
  { key: "memberName",    label: "Sales Rep" },
  { key: "memberRole",    label: "Role" },
  { key: "teamName",      label: "Team" },
  { key: "setByName",     label: "Set By (TL)" },
  { key: "period",        label: "Period" },
  { key: "targetCalls",   label: "Target Calls" },
  { key: "achievedCalls", label: "Achieved Calls" },
  { key: "targetSales",   label: "Target Sales" },
  { key: "achievedSales", label: "Achieved Sales" },
  { key: "progressBar",   label: "Progress" },
  { key: "statusBadge",   label: "Status" },
];

const STATUS_COLORS = {
  "Completed":   "bg-emerald-100 text-emerald-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Pending":     "bg-amber-100 text-amber-700",
  "Overdue":     "bg-red-100 text-red-600",
};

function pct(achieved, target) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 100));
}

function ProgressBar({ achieved, target, color = "#3b82f6" }) {
  const p = pct(achieved, target);
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${p}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-8 text-right">{p}%</span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status ?? "—"}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const now = new Date();

export default function Targets() {
  const [targets,  setTargets]  = useState([]);
  const [stats,    setStats]    = useState({ totalTargets: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 });
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [error,    setError]    = useState(null);

  // Month / year filter
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  // View modal
  const [viewRow, setViewRow] = useState(null);

  // ── Load targets ───────────────────────────────────────────────────────────
  const load = useCallback(async (m, y) => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesTargetService.getTeamTargets(m, y);
      setTargets(data.targets || []);
      setStats(data.stats    || { totalTargets: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load targets.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selMonth, selYear);
  }, [load, selMonth, selYear]);

  // ── Sync live progress ────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    try {
      await salesTargetService.syncProgress();
      toast.success("Sync complete — live progress updated.");
      load(selMonth, selYear);
    } catch (e) {
      toast.error("Sync failed: " + (e?.response?.data?.message || e?.message));
    } finally {
      setSyncing(false);
    }
  };

  // ── Table rows ─────────────────────────────────────────────────────────────
  const rows = targets.map((t) => {
    const status = t.status ?? "Pending";
    const barColor =
      status === "Completed" ? "#22c55e" :
      status === "Overdue"   ? "#f43f5e" : "#3b82f6";

    return {
      ...t,
      memberName:    t.user?.name  ?? "—",
      memberRole:    t.user?.role === "SALES_TL" ? "Team Leader" : "Executive",
      teamName:      t.team?.name  ?? "—",
      setByName:     t.setBy?.name ?? "—",
      period:        `${MONTHS[(t.month ?? 1) - 1] ?? ""} ${t.year ?? ""}`,
      progressBar: (
        <ProgressBar
          achieved={t.achievedSales ?? 0}
          target={t.targetSales ?? 0}
          color={barColor}
        />
      ),
      statusBadge: <StatusBadge status={status} />,
    };
  });

  // ── Stats cards ───────────────────────────────────────────────────────────
  const statCards = [
    { title: "Total Targets",       value: stats.totalTargets ?? 0, icon: <Target size={22} />,       accent: "#3b82f6" },
    { title: "Completed",           value: stats.completed    ?? 0, icon: <CheckCircle size={22} />,  accent: "#22c55e" },
    { title: "In Progress",         value: stats.inProgress   ?? 0, icon: <RefreshCw size={22} />,    accent: "#f59e0b" },
    { title: "Pending / Overdue",   value: (stats.pending ?? 0) + (stats.overdue ?? 0), icon: <AlertTriangle size={22} />, accent: "#f43f5e" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Heading + Stats ── */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Sales" secondaryText="Targets" size={12} />
        {statCards.map((c) => (
          <EnhancedDashCard
            key={c.title}
            title={c.title}
            value={String(c.value)}
            icon={c.icon}
            accentColor={c.accent}
            size={3}
          />
        ))}
      </DashGrid>

      {/* ── Filter bar + Sync ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month</span>
            <select
              value={selMonth}
              onChange={(e) => setSelMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#2a465a]"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</span>
            <select
              value={selYear}
              onChange={(e) => setSelYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#2a465a]"
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sync only — no Create button for Sales Manager */}
        <Button
          text={syncing ? "Syncing..." : "Sync Live Data"}
          variant="secondary"
          size={3}
          disabled={syncing}
          onClick={handleSync}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-rose-600 flex-shrink-0" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
          <button
            onClick={() => load(selMonth, selYear)}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2a465a]" />
          <p className="text-slate-500 text-sm font-medium animate-pulse">Loading targets...</p>
        </div>
      ) : (
        <DataTable
          title="Target List"
          columns={TARGET_COLS}
          rows={rows}
          // View-only actions — no edit or delete
          actions={[
            {
              icon: <Eye size={15} />,
              tooltip: "View Details",
              variant: "ghost",
              onClick: (row) => {
                setViewRow(row);
                openModal("mgr-tgt-view");
              },
            },
          ]}
          size={12}
          pageSize={10}
          searchable
          exportable
          exportFileName={`targets-${MONTHS[selMonth - 1]}-${selYear}`}
          filters={[
            {
              title: "Status",
              type: "toggle",
              key: "statusBadge",
              options: ["Pending", "In Progress", "Completed", "Overdue"],
            },
            {
              title: "Role",
              type: "toggle",
              key: "memberRole",
              options: ["Executive", "Team Leader"],
            },
          ]}
        />
      )}

      {/* ── View Modal ── */}
      <Modal id="mgr-tgt-view" title="Target Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={viewRow.memberName}
              subtitle={`${viewRow.memberRole} · Team: ${viewRow.teamName}`}
              meta={`Period: ${viewRow.period}`}
            />
            <ModalGrid title="Target vs Achieved" cols={2}>
              <ModalData label="Target Calls"    value={String(viewRow.targetCalls   ?? 0)} />
              <ModalData label="Achieved Calls"  value={String(viewRow.achievedCalls ?? 0)} />
              <ModalData label="Target Sales"    value={String(viewRow.targetSales   ?? 0)} />
              <ModalData label="Achieved Sales"  value={String(viewRow.achievedSales ?? 0)} />
              <ModalData label="Remaining Calls" value={String(viewRow.remainingCalls ?? 0)} />
              <ModalData label="Remaining Sales" value={String(viewRow.remainingSales ?? 0)} />
              <ModalData label="Status"          value={viewRow.status ?? "—"} />
              <ModalData label="Set By (TL)"     value={viewRow.setBy?.name ?? viewRow.setByName ?? "—"} />
            </ModalGrid>
            {viewRow.notes && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</span>
                <p className="text-slate-700 text-sm">{viewRow.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("mgr-tgt-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
