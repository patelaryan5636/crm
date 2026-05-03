import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays, CheckCircle2, XCircle, Palmtree,
  CalendarCheck, Clock, BarChart2, AlertCircle,
  LogIn, LogOut, Timer, Loader2,
} from "lucide-react";
import {
  Heading, EnhancedDashCard, DashGrid,
  GColumnChart, GLineChart, GPieChart,
  DataTable,
} from "../../../../components/shared/Common_Components";
import LeaveForm from "./LeaveForm";
import { hrmService, MOCK_ATTENDANCE, MOCK_LEAVES_INIT } from "../../../../services/hrmService";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, iconColor, title, badge }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconColor}`}>
      <Icon size={15} className="text-white" />
    </div>
    <h2 className="text-base font-bold text-[#1a2e3f] tracking-tight">{title}</h2>
    {badge !== undefined && (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1a2e3f]/10 text-[#1a2e3f]">{badge}</span>
    )}
    <div className="flex-1 h-px bg-slate-100 ml-1" />
  </div>
);

// ─── Chart data ───────────────────────────────────────────────────────────────
const BAR_DATA = [
  { name: "01 May", Present: 1, Absent: 0, Late: 0, Leave: 0 },
  { name: "04 May", Present: 0, Absent: 0, Late: 1, Leave: 0 },
  { name: "05 May", Present: 1, Absent: 0, Late: 0, Leave: 0 },
  { name: "06 May", Present: 1, Absent: 0, Late: 0, Leave: 0 },
  { name: "07 May", Present: 0, Absent: 1, Late: 0, Leave: 0 },
  { name: "08 May", Present: 1, Absent: 0, Late: 0, Leave: 0 },
  { name: "13 May", Present: 0, Absent: 0, Late: 0, Leave: 1 },
];

// ─── Helper — must be defined before LINE_DATA and WORK_SUMMARY ───────────────
const parseHoursToMins = (hoursStr) => {
  const hMatch = hoursStr.match(/(\d+)h/);
  const mMatch = hoursStr.match(/(\d+)m/);
  const h = hMatch ? parseInt(hMatch[1], 10) : 0;
  const m = mMatch ? parseInt(mMatch[1], 10) : 0;
  return h * 60 + m;
};

const LINE_DATA = MOCK_ATTENDANCE
  .filter(r => r.hours && r.hours !== "—")
  .map(r => {
    const mins = parseHoursToMins(r.hours);
    return { name: `${r.day} ${r.date.slice(8)}`, hours: parseFloat((mins / 60).toFixed(2)) };
  });

const PIE_DATA = [
  { name: "Present", value: MOCK_ATTENDANCE.filter(r => r.status === "Present").length },
  { name: "Absent",  value: MOCK_ATTENDANCE.filter(r => r.status === "Absent").length  },
  { name: "Late",    value: MOCK_ATTENDANCE.filter(r => r.status === "Late").length    },
  { name: "Leave",   value: MOCK_ATTENDANCE.filter(r => r.status === "Leave").length   },
].filter(d => d.value > 0);

const PIE_COLORS = ["#10b981", "#f43f5e", "#f59e0b", "#8b5cf6"];

// ─── Work summary ─────────────────────────────────────────────────────────────
const WORK_SUMMARY = (() => {
  const rows = MOCK_ATTENDANCE.filter(r => r.hours && r.hours !== "—");
  const mins = rows.reduce((s, r) => s + parseHoursToMins(r.hours), 0);
  const late  = MOCK_ATTENDANCE.filter(r => r.status === "Late").length;
  const early = rows.filter(r => r.checkIn && r.checkIn !== "—" && +r.checkIn.split(":")[0] < 9).length;
  return {
    totalHours:  rows.length ? (mins / 60).toFixed(1) : "0.0",
    avgPerDay:   rows.length ? (mins / rows.length / 60).toFixed(2) : "0.00",
    lateCount:   late,
    workingDays: rows.length,
    punctuality: rows.length ? Math.round(((rows.length - late - early) / rows.length) * 100) : 0,
  };
})();

// ─── Attendance table columns & rows for DataTable ────────────────────────────
const STATUS_BADGE = {
  Present: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Absent:  "bg-rose-100 text-rose-700 border border-rose-200",
  Late:    "bg-amber-100 text-amber-700 border border-amber-200",
  Leave:   "bg-violet-100 text-violet-700 border border-violet-200",
  Holiday: "bg-sky-100 text-sky-700 border border-sky-200",
  Weekend: "bg-slate-100 text-slate-500 border border-slate-200",
};

const fmtAttDate = (d) => {
  const [, m, day] = d.split("-");
  return `${day} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} 2026`;
};

const ATTENDANCE_COLS = [
  {
    key: "dateDisplay", label: "Date",
    render: (row) => (
      <div>
        <p className="text-xs font-bold text-[#1a2e3f]">{fmtAttDate(row.date)}</p>
        <p className="text-[10px] text-slate-400">{row.day}</p>
      </div>
    ),
  },
  {
    key: "checkIn", label: "Check-in",
    render: (row) => (
      <span className={`text-xs font-semibold flex items-center gap-1 ${row.checkIn === "—" ? "text-slate-300" : "text-[#1a2e3f]"}`}>
        {row.checkIn !== "—" && <Clock size={11} className="text-emerald-500 flex-shrink-0" />}
        {row.checkIn}
      </span>
    ),
  },
  {
    key: "checkOut", label: "Check-out",
    render: (row) => (
      <span className={`text-xs font-semibold flex items-center gap-1 ${row.checkOut === "—" ? "text-slate-300" : "text-[#1a2e3f]"}`}>
        {row.checkOut !== "—" && <Clock size={11} className="text-rose-400 flex-shrink-0" />}
        {row.checkOut}
      </span>
    ),
  },
  {
    key: "hours", label: "Total Hours",
    render: (row) => (
      <span className={`text-xs font-bold ${row.hours === "—" ? "text-slate-300" : "text-[#1a2e3f]"}`}>
        {row.hours}
      </span>
    ),
  },
  {
    key: "status", label: "Status",
    render: (row) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_BADGE[row.status] || "bg-slate-100 text-slate-600"}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          row.status === "Present" ? "bg-emerald-500" :
          row.status === "Absent"  ? "bg-rose-500"    :
          row.status === "Late"    ? "bg-amber-500"   :
          row.status === "Leave"   ? "bg-violet-500"  : "bg-slate-400"
        }`} />
        {row.status}
      </span>
    ),
  },
];

// ─── Clock Widget ─────────────────────────────────────────────────────────────
function ClockWidget() {
  const [clockInTime,  setClockInTime]  = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [elapsed,      setElapsed]      = useState(0);
  const [loading,      setLoading]      = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (clockInTime && !clockOutTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - clockInTime.getTime()) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [clockInTime, clockOutTime]);

  const fmtTime = (d) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  const fmtElapsed = (s) =>
    `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const totalHours = () => {
    if (!clockInTime || !clockOutTime) return null;
    const s = Math.floor((clockOutTime - clockInTime) / 1000);
    return `${Math.floor(s/3600)}h ${String(Math.floor((s%3600)/60)).padStart(2,"0")}m`;
  };

  const handleClockIn = async () => {
    setLoading("in");
    await hrmService.clockIn();
    const now = new Date();
    setClockInTime(now); setClockOutTime(null); setElapsed(0);
    setLoading(null);
    toast.success(`Clock In Successful — ${fmtTime(now)}`, { icon: "🟢", duration: 4000 });
  };

  const handleClockOut = async () => {
    setLoading("out");
    await hrmService.clockOut();
    const now = new Date();
    setClockOutTime(now);
    setLoading(null);
    const s = Math.floor((now - clockInTime) / 1000);
    toast.success(`Clock Out Successful — Total: ${Math.floor(s/3600)}h ${String(Math.floor((s%3600)/60)).padStart(2,"0")}m`, { icon: "🔴", duration: 4000 });
  };

  const isClockedIn  = !!clockInTime && !clockOutTime;
  const isClockedOut = !!clockInTime && !!clockOutTime;
  const isIdle       = !clockInTime;
  const statusLabel  = isIdle ? "Not Clocked In" : isClockedIn ? "Working" : "Clocked Out";
  const statusColor  = isIdle ? "text-slate-400" : isClockedIn ? "text-emerald-600" : "text-rose-500";
  const statusDot    = isIdle ? "bg-slate-300" : isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-rose-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${statusColor}`}>{statusLabel}</span>
            </div>
            <div className={`font-mono text-4xl font-black tracking-tight leading-none mb-3 ${isClockedIn ? "text-[#1a2e3f]" : "text-slate-300"}`}>
              {isClockedIn  ? fmtElapsed(elapsed) :
               isClockedOut ? fmtElapsed(Math.floor((clockOutTime - clockInTime) / 1000)) :
               "00:00:00"}
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs">
              {clockInTime && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <LogIn size={11} className="text-emerald-600" />
                  </div>
                  <span>In: <span className="font-bold text-[#1a2e3f]">{fmtTime(clockInTime)}</span></span>
                </div>
              )}
              {clockOutTime && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <div className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <LogOut size={11} className="text-rose-500" />
                  </div>
                  <span>Out: <span className="font-bold text-[#1a2e3f]">{fmtTime(clockOutTime)}</span></span>
                </div>
              )}
              {isClockedOut && totalHours() && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <div className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Timer size={11} className="text-sky-600" />
                  </div>
                  <span>Total: <span className="font-bold text-sky-600">{totalHours()}</span></span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
            <button onClick={handleClockIn} disabled={isClockedIn || loading === "in"}
              className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all
                ${isClockedIn || loading === "in"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95"}`}>
              {loading === "in" ? <Loader2 size={16} className="animate-spin" /> : <span className="text-base">🟢</span>}
              {loading === "in" ? "Clocking In…" : "Clock In"}
            </button>
            <button onClick={handleClockOut} disabled={!isClockedIn || loading === "out"}
              className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all
                ${!isClockedIn || loading === "out"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-95"}`}>
              {loading === "out" ? <Loader2 size={16} className="animate-spin" /> : <span className="text-base">🔴</span>}
              {loading === "out" ? "Clocking Out…" : "Clock Out"}
            </button>
            {isClockedOut && (
              <button onClick={() => { setClockInTime(null); setClockOutTime(null); setElapsed(0); }}
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors">
                <Clock size={12} /> Reset
              </button>
            )}
          </div>
        </div>
        {(isClockedIn || isClockedOut) && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Progress (9h target)</span>
              <span className="text-[10px] font-bold text-[#1a2e3f]">{Math.min(100, Math.round((elapsed / (9*3600)) * 100))}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000
                ${elapsed >= 9*3600 ? "bg-emerald-500" : elapsed >= 7*3600 ? "bg-sky-500" : "bg-[#38bdf8]"}`}
                style={{ width: `${Math.min(100, (elapsed / (9*3600)) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HRMPage() {
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [leaves,      setLeaves]      = useState(MOCK_LEAVES_INIT);
  const [autoMarked,  setAutoMarked]  = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(false);
        setError("");
        if (!autoMarked) {
          setAutoMarked(true);
          const res = await hrmService.autoMarkAttendance();
          const { status } = res.data;
          if (status === "Present") {
            setTodayStatus("Present");
            toast.success("Auto Attendance: Marked Present for today.", { icon: "🟢" });
          } else if (!status || status === "Absent") {
            setTodayStatus("Absent");
            toast.error("Auto Status: No clock-in detected — marked Absent.", { icon: "🔴" });
          } else if (status === "Leave") {
            setTodayStatus("Leave");
            toast("Today is marked as Leave.", { icon: "🟣" });
          }
        }
      } catch {
        setError("Failed to load HRM data. Please check your connection and try again.");
        setLoading(false);
        toast.error("Failed to load HRM data.");
      }
    }, 600);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  const prevApprovedRef = useRef(
    MOCK_LEAVES_INIT.filter(l => l.status === "Approved").reduce((s, l) => s + l.days, 0)
  );
  useEffect(() => {
    const cur = leaves.filter(l => l.status === "Approved").reduce((s, l) => s + l.days, 0);
    if (cur !== prevApprovedRef.current) {
      const diff = cur - prevApprovedRef.current;
      prevApprovedRef.current = cur;
      if (diff > 0) {
        toast(`Leave Balance Updated: ${diff} day${diff > 1 ? "s" : ""} deducted. Remaining: ${Math.max(0, 12 - cur)} days.`,
          { icon: "🟡", duration: 5000 });
      }
    }
  }, [leaves]);

  const presentDays      = MOCK_ATTENDANCE.filter(r => r.status === "Present").length;
  const absentDays       = MOCK_ATTENDANCE.filter(r => r.status === "Absent").length;
  const leavesTaken      = leaves.filter(l => l.status === "Approved").reduce((s, l) => s + l.days, 0);
  const totalWorkingDays = MOCK_ATTENDANCE.filter(r => !["Weekend","Holiday"].includes(r.status)).length;
  const remainingLeaves  = Math.max(0, 12 - leavesTaken);

  // Attendance rows for DataTable
  const attendanceRows = MOCK_ATTENDANCE.map(r => ({ ...r, dateDisplay: fmtAttDate(r.date) }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* ── Heading with dark banner (matches reference) ── */}
      <Heading primaryText="HRM" showAnimations />

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button onClick={() => { setError(""); setLoading(true); setTimeout(() => setLoading(false), 400); }}
            className="text-xs font-bold underline hover:no-underline flex-shrink-0">Retry</button>
        </div>
      )}

      {/* Today's Status Banner */}
      {todayStatus && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium
          ${todayStatus === "Present" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
            todayStatus === "Absent"  ? "bg-rose-50 border-rose-200 text-rose-700"          :
            todayStatus === "Leave"   ? "bg-violet-50 border-violet-200 text-violet-800"    :
                                        "bg-slate-50 border-slate-200 text-slate-600"}`}>
          <span className="text-base flex-shrink-0">
            {todayStatus === "Present" ? "🟢" : todayStatus === "Absent" ? "🔴" : "🟣"}
          </span>
          <div className="flex-1">
            <span className="font-bold">Today's Status: {todayStatus}</span>
            {todayStatus === "Present" && <span className="ml-2 text-xs opacity-80">— Auto-marked on login</span>}
            {todayStatus === "Absent"  && <span className="ml-2 text-xs opacity-80">— No clock-in detected</span>}
            {todayStatus === "Leave"   && <span className="ml-2 text-xs opacity-80">— Approved leave</span>}
          </div>
          {todayStatus !== "Absent" && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0
              ${todayStatus === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>
              {remainingLeaves} leaves left
            </span>
          )}
        </div>
      )}

      {/* ── Summary Cards — compact, single row ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array(5).fill(0).map((_, i) => <Sk key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Working Days",     value: totalWorkingDays, icon: <CalendarDays size={18} />, accent: "#38bdf8", bg: "bg-sky-500/10",     text: "text-sky-400"     },
            { label: "Present",          value: presentDays,      icon: <CheckCircle2 size={18} />, accent: "#22c55e", bg: "bg-emerald-500/10", text: "text-emerald-400" },
            { label: "Absent",           value: absentDays,       icon: <XCircle size={18} />,      accent: "#f43f5e", bg: "bg-rose-500/10",    text: "text-rose-400"    },
            { label: "Leaves Taken",     value: leavesTaken,      icon: <Palmtree size={18} />,     accent: "#f59e0b", bg: "bg-amber-500/10",   text: "text-amber-400"   },
            { label: "Remaining Leaves", value: remainingLeaves,  icon: <CalendarCheck size={18} />,accent: "#8b5cf6", bg: "bg-violet-500/10",  text: "text-violet-400"  },
          ].map(({ label, value, icon, accent, bg, text }) => (
            <div key={label}
              className="bg-gradient-to-br from-[#1e3448] to-[#243f55] rounded-2xl border border-white/8 shadow-md p-3.5 flex items-center gap-3 hover:scale-[1.02] transition-transform duration-200">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
                style={{ color: accent }}>
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">{label}</p>
                <p className="text-2xl font-black text-white leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Clock In / Out ── */}
      <div>
        <SectionHeader icon={Clock} iconColor="bg-emerald-500" title="Today's Attendance" />
        <ClockWidget />
      </div>

      {/* ── Attendance Table (DataTable from shared components) ── */}
      <div>
        <SectionHeader icon={CalendarDays} iconColor="bg-[#1a2e3f]" title="Attendance" badge={`${MOCK_ATTENDANCE.length} records`} />
        <DataTable
          title="Attendance Log"
          columns={ATTENDANCE_COLS}
          rows={attendanceRows}
          searchable={false}
          pageSize={7}
          hidePagination={true}
          size={12}
          filters={[
            {
              title: "Status",
              type: "toggle",
              key: "status",
              options: ["Present", "Absent", "Late", "Leave", "Holiday", "Weekend"],
            },
          ]}
        />
      </div>

      {/* ── Work Summary ── */}
      <div>
        <SectionHeader icon={Timer} iconColor="bg-sky-500" title="Work Summary — May 2026" />
        <DashGrid cols={12} gap={4}>
          <EnhancedDashCard title="TOTAL HOURS"  value={`${WORK_SUMMARY.totalHours}h`}  icon={<Clock size={22} />}        accentColor="#38bdf8" size={3} />
          <EnhancedDashCard title="AVG HOURS/DAY" value={`${WORK_SUMMARY.avgPerDay}h`}   icon={<Timer size={22} />}        accentColor="#22c55e" size={3} />
          <EnhancedDashCard title="LATE ENTRIES" value={String(WORK_SUMMARY.lateCount)} icon={<AlertCircle size={22} />}  accentColor="#f59e0b" size={3} />
          <EnhancedDashCard title="PUNCTUALITY"  value={`${WORK_SUMMARY.punctuality}%`} icon={<CheckCircle2 size={22} />} accentColor="#8b5cf6" size={3} />
        </DashGrid>
      </div>

      {/* ── Analytics Charts ── */}
      <div>
        <SectionHeader icon={BarChart2} iconColor="bg-[#38bdf8]" title="Attendance Analytics" />
        <div className="space-y-4">
          <GColumnChart
            title="Weekly Attendance Breakdown" subtitle="Present · Absent · Late · Leave per day"
            data={BAR_DATA}
            bars={[
              { key: "Present", label: "Present", color: "#10b981" },
              { key: "Absent",  label: "Absent",  color: "#f43f5e" },
              { key: "Late",    label: "Late",    color: "#f59e0b" },
              { key: "Leave",   label: "Leave",   color: "#8b5cf6" },
            ]}
            size={12} height={260}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <GLineChart
                title="Daily Working Hours" subtitle="Hours logged on each working day"
                data={LINE_DATA} lines={[{ key: "hours", label: "Hours Worked", color: "#38bdf8" }]}
                size={12} height={260}
              />
            </div>
            <div>
              <GPieChart
                title="Attendance Distribution" subtitle="Breakdown by status"
                data={PIE_DATA} colors={PIE_COLORS} size={12} height={260}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Leave Management ── */}
      <div>
        <SectionHeader icon={Palmtree} iconColor="bg-violet-500" title="Leave Management" />
        <LeaveForm leaves={leaves} setLeaves={setLeaves} />
      </div>

    </div>
  );
}
