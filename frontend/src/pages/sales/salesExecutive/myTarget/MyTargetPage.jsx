import { useState, useEffect, useCallback } from "react";
import {
  Heading, DashGrid, EnhancedDashCard, Grid,
} from "../../../../components/shared/Common_Components.jsx";
import {
  Target, CheckCircle2, Phone, TrendingUp, CalendarDays,
  RefreshCw, AlertCircle, Trophy, Flame, Clock,
} from "lucide-react";
import salesTargetService from "../../../../services/salesTargetService";

// ─── constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_CONFIG = {
  "Completed":   { color: "#22c55e", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  "In Progress": { color: "#3b82f6", bg: "bg-blue-50 border-blue-200",       text: "text-blue-700",    icon: TrendingUp },
  "Pending":     { color: "#f59e0b", bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   icon: Clock },
  "Overdue":     { color: "#f43f5e", bg: "bg-red-50 border-red-200",         text: "text-red-700",     icon: AlertCircle },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function pct(achieved, target) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 100));
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1 text-xs underline hover:no-underline font-medium">
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

// ─── Target Card component ────────────────────────────────────────────────────

function TargetCard({ target, live }) {
  const cfg = STATUS_CONFIG[target.status] ?? STATUS_CONFIG["Pending"];
  const StatusIcon = cfg.icon;

  const callsPct  = pct(target.achievedCalls,  target.targetCalls);
  const salesPct  = pct(target.achievedSales,  target.targetSales);
  const revPct    = pct(target.achievedRevenue, target.targetRevenue);

  // Prefer live data over DB stored
  const liveCalls = live?.achievedCalls ?? target.achievedCalls;
  const liveSales = live?.achievedSales ?? target.achievedSales;
  const liveCallsPct = pct(liveCalls, target.targetCalls);
  const liveSalesPct = pct(liveSales, target.targetSales);

  return (
    <div className={`col-span-12 bg-white rounded-2xl border shadow-sm overflow-hidden`}>
      {/* Card header */}
      <div className="bg-gradient-to-r from-[#0f2035] to-[#1a3a5c] px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">
            Monthly Target · {MONTHS[(target.month ?? 1) - 1]} {target.year}
          </p>
          <h2 className="text-white text-xl font-bold">
            {MONTHS[(target.month ?? 1) - 1]} {target.year} Performance Target
          </h2>
          {target.setBy && (
            <p className="text-slate-400 text-xs mt-1">Set by {target.setBy.name}</p>
          )}
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${cfg.bg} ${cfg.text} font-semibold text-sm`}>
          <StatusIcon size={15} />
          {target.status}
        </div>
      </div>

      {/* Progress bars section */}
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Calls */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Phone size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Calls Made</p>
              <p className="text-lg font-bold text-slate-800">
                {liveCalls} <span className="text-sm font-normal text-slate-400">/ {target.targetCalls}</span>
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Progress</span><span className="font-semibold">{liveCallsPct}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${liveCallsPct}%`, background: liveCallsPct >= 100 ? "#22c55e" : "#3b82f6" }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {Math.max(0, target.targetCalls - liveCalls)} more calls needed
            </p>
          </div>
        </div>

        {/* Conversions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Trophy size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Conversions (Won)</p>
              <p className="text-lg font-bold text-slate-800">
                {liveSales} <span className="text-sm font-normal text-slate-400">/ {target.targetSales}</span>
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Progress</span><span className="font-semibold">{liveSalesPct}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${liveSalesPct}%`, background: liveSalesPct >= 100 ? "#22c55e" : "#10b981" }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {Math.max(0, target.targetSales - liveSales)} more conversions needed
            </p>
          </div>
        </div>

        {/* Revenue */}
        {target.targetRevenue > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Flame size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Revenue Target</p>
                <p className="text-lg font-bold text-slate-800">
                  ₹{(target.achievedRevenue || 0).toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-slate-400"> / ₹{(target.targetRevenue || 0).toLocaleString("en-IN")}</span>
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span><span className="font-semibold">{revPct}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${revPct}%`, background: revPct >= 100 ? "#22c55e" : "#8b5cf6" }}
                />
              </div>
              <p className="text-xs text-slate-400">
                ₹{Math.max(0, target.targetRevenue - target.achievedRevenue).toLocaleString("en-IN")} remaining
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="border-t border-slate-100 px-6 py-4 grid grid-cols-4 gap-4 bg-slate-50">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Overall Progress</p>
          <p className="text-2xl font-extrabold" style={{ color: cfg.color }}>
            {Math.round((liveCallsPct + liveSalesPct) / 2)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Calls Done</p>
          <p className="text-xl font-bold text-slate-700">{liveCalls} / {target.targetCalls}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Conversions</p>
          <p className="text-xl font-bold text-slate-700">{liveSales} / {target.targetSales}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Status</p>
          <p className={`text-sm font-bold ${cfg.text}`}>{target.status}</p>
        </div>
      </div>

      {target.notes && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 text-sm text-amber-800">
          <strong>Note from Team Leader:</strong> {target.notes}
        </div>
      )}
    </div>
  );
}

// ─── No target state ──────────────────────────────────────────────────────────

function NoTarget({ month, year }) {
  return (
    <div className="col-span-12 flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Target size={36} className="text-slate-400" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-700">No Target Set</h3>
        <p className="text-slate-400 text-sm mt-1">
          No target has been assigned for <strong>{MONTHS[month - 1]} {year}</strong>.<br />
          Contact your Team Leader to set a monthly target.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyTargetPage() {
  const [targets, setTargets] = useState([]);
  const [live,    setLive]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const load = useCallback(async (m, y) => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesTargetService.getMyTargets(m, y);
      setTargets(data.targets || []);
      setLive(data.live || null);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load targets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(selMonth, selYear); }, [load, selMonth, selYear]);

  // KPI summary from live data
  const activeTarget = targets[0] ?? null;
  const liveSalesPct = activeTarget ? pct(live?.achievedSales ?? activeTarget.achievedSales, activeTarget.targetSales) : 0;
  const liveCallsPct = activeTarget ? pct(live?.achievedCalls ?? activeTarget.achievedCalls, activeTarget.targetCalls) : 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="My" secondaryText="Monthly Target" size={12} />

        {/* KPI summary cards */}
        <EnhancedDashCard
          title="Sales Progress"
          value={`${liveSalesPct}%`}
          icon={<Trophy size={22} />}
          accentColor="#22c55e"
          size={3}
        />
        <EnhancedDashCard
          title="Calls Progress"
          value={`${liveCallsPct}%`}
          icon={<Phone size={22} />}
          accentColor="#3b82f6"
          size={3}
        />
        <EnhancedDashCard
          title="Won This Month"
          value={String(live?.achievedSales ?? activeTarget?.achievedSales ?? 0)}
          icon={<CheckCircle2 size={22} />}
          accentColor="#10b981"
          size={3}
        />
        <EnhancedDashCard
          title="Target Status"
          value={activeTarget?.status ?? "No Target"}
          icon={<Target size={22} />}
          accentColor={activeTarget ? STATUS_CONFIG[activeTarget.status]?.color : "#94a3b8"}
          size={3}
        />
      </DashGrid>

      {/* ── Month / Year Selector ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <CalendarDays size={15} className="text-slate-400" />
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={selMonth}
            onChange={e => { setSelMonth(Number(e.target.value)); }}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={selYear}
            onChange={e => { setSelYear(Number(e.target.value)); }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button
          onClick={() => load(selMonth, selYear)}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => load(selMonth, selYear)} />}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div className="col-span-12 bg-white rounded-2xl border shadow-sm overflow-hidden animate-pulse">
          <div className="bg-slate-200 h-28" />
          <div className="p-6 grid grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Target Cards ─────────────────────────────────────────────────── */}
      {!loading && !error && (
        <Grid cols={12} gap={4}>
          {targets.length > 0
            ? targets.map(t => (
                <TargetCard key={t._id} target={t} live={live} />
              ))
            : <NoTarget month={selMonth} year={selYear} />
          }
        </Grid>
      )}
    </div>
  );
}
