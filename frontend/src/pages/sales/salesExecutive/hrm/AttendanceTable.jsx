import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

// ─── Theme config ─────────────────────────────────────────────────────────────
const T = {
  present: { badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", cal: "bg-emerald-500 text-white" },
  absent:  { badge: "bg-rose-100 text-rose-700 border border-rose-200",          dot: "bg-rose-500",    cal: "bg-rose-500 text-white"    },
  late:    { badge: "bg-amber-100 text-amber-700 border border-amber-200",        dot: "bg-amber-500",   cal: "bg-amber-500 text-white"   },
  leave:   { badge: "bg-violet-100 text-violet-700 border border-violet-200",     dot: "bg-violet-500",  cal: "bg-violet-500 text-white"  },
  holiday: { badge: "bg-sky-100 text-sky-700 border border-sky-200",              dot: "bg-sky-400",     cal: "bg-sky-400 text-white"     },
  weekend: { badge: "bg-slate-100 text-slate-500 border border-slate-200",        dot: "bg-slate-300",   cal: ""                          },
};

const fmtDate = (d) => {
  const [y, m, day] = d.split("-");
  return `${day} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${y}`;
};

const StatusBadge = ({ status }) => {
  const cfg = T[status.toLowerCase()] || T.present;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  );
};

const isBlankTime = (value) => !value || value === "-" || value === "—" || value === "â€”";

// ─── Attendance Table ─────────────────────────────────────────────────────────
export function AttendanceTable({ records }) {
  const displayed = (records || []).slice(0, 7);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
        <h3 className="text-sm font-bold text-[#1a2e3f]">Attendance Log</h3>
        <p className="text-xs text-slate-500 mt-1">Showing the latest 7 attendance records.</p>
      </div>

      <table className="w-full text-sm border-collapse">
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "26%" }} />
        </colgroup>
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['Date', 'Check-in', 'Check-out', 'Total Hours', 'Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayed.map((r, i) => (
            <tr key={r.date}
              className={`transition-colors ${r.status === "Absent"  ? "bg-rose-50/50"   :
                  r.status === "Late"    ? "bg-amber-50/50"  :
                  r.status === "Leave"   ? "bg-violet-50/50" :
                  r.status === "Weekend" ? "bg-slate-50/70"  :
                  r.status === "Holiday" ? "bg-sky-50/50"    :
                  i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}> 
              <td className="px-4 py-3 text-xs text-slate-900">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{fmtDate(r.date)}</span>
                  <span className="text-[11px] text-slate-500">{r.day}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-700">
                <span className={`${isBlankTime(r.checkIn) ? "text-slate-300" : "text-slate-900"}`}>
                  {!isBlankTime(r.checkIn) && <Clock size={12} className="inline mr-1 text-emerald-500" />}
                  {r.checkIn}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-700">
                <span className={`${isBlankTime(r.checkOut) ? "text-slate-300" : "text-slate-900"}`}>
                  {!isBlankTime(r.checkOut) && <Clock size={12} className="inline mr-1 text-rose-500" />}
                  {r.checkOut}
                </span>
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-900">{r.hours}</td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const LEGEND = [
  { label: "Present", color: "bg-emerald-500" },
  { label: "Absent",  color: "bg-rose-500"    },
  { label: "Late",    color: "bg-amber-500"   },
  { label: "Leave",   color: "bg-violet-500"  },
  { label: "Holiday", color: "bg-sky-400"     },
  { label: "Weekend", color: "bg-slate-200"   },
];

export function AttendanceCalendar({ records }) {
  const [year, setYear]   = useState(2026);
  const [month, setMonth] = useState(4); // 0-indexed → May

  const lookup   = Object.fromEntries(records.map(r => [r.date, r.status]));
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-[#1a2e3f]">Attendance Calendar</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-bold text-[#1a2e3f] min-w-[120px] text-center">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 mb-1">
          {DAYS_OF_WEEK.map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase py-1.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: totalDays }, (_, i) => {
            const dayNum  = i + 1;
            const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
            const status  = lookup[dateStr];
            const cfg     = status ? T[status.toLowerCase()] : null;
            const isToday = dateStr === new Date().toISOString().slice(0,10);
            return (
              <div key={dayNum} title={status || ""}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all duration-150 cursor-default
                  ${cfg?.cal || "bg-slate-50 text-slate-400"}
                  ${isToday ? "ring-2 ring-[#38bdf8] ring-offset-1" : ""}
                  hover:scale-105`}>
                <span>{dayNum}</span>
                {status && status !== "Weekend" && (
                  <span className="text-[8px] font-semibold opacity-80 leading-none mt-0.5 hidden sm:block">{status.slice(0,3)}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-4 pt-3 border-t border-slate-100">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-md flex-shrink-0 ${l.color}`} />
              <span className="text-[11px] text-slate-500 font-medium">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
