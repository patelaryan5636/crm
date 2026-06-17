/**
 * BlockedBanner — shows a live countdown when the user is rate-limited
 *
 * Props:
 *   blockedUntil  — ISO string from the 429 response (e.g. "2026-06-17T10:15:00.000Z")
 *   onExpire      — called when the timer hits zero so the parent can clear the error
 */
import { useState, useEffect, useRef } from "react";
import { ShieldAlert, Clock } from "lucide-react";

export default function BlockedBanner({ blockedUntil, onExpire }) {
  const endTime = useRef(new Date(blockedUntil).getTime());
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((endTime.current - Date.now()) / 1000))
  );

  useEffect(() => {
    // Recalculate end time if prop changes
    endTime.current = new Date(blockedUntil).getTime();
    setRemaining(Math.max(0, Math.ceil((endTime.current - Date.now()) / 1000)));
  }, [blockedUntil]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      const secs = Math.max(0, Math.ceil((endTime.current - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // Progress: fraction of 15 minutes already elapsed
  const pct = Math.max(0, Math.min(100, ((900 - remaining) / 900) * 100));

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 space-y-2.5">
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldAlert size={15} className="text-rose-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-rose-700 leading-snug">
            Account temporarily blocked
          </p>
          <p className="text-xs text-rose-500 mt-0.5 leading-relaxed">
            Too many failed attempts. You can try again in:
          </p>
        </div>
      </div>

      {/* Countdown display */}
      <div className="flex items-center gap-2.5 pl-9">
        <Clock size={14} className="text-rose-400 flex-shrink-0" />
        <span className="font-black text-rose-700 text-lg tabular-nums tracking-wider">
          {String(mins).padStart(2, "0")}
          <span className="text-rose-400 mx-0.5 animate-pulse">:</span>
          {String(secs).padStart(2, "0")}
        </span>
        <span className="text-xs text-rose-500">
          {mins > 0 ? `${mins} min ${secs} sec` : `${secs} sec`} remaining
        </span>
      </div>

      {/* Progress bar — fills as time runs out */}
      <div className="pl-9">
        <div className="h-1.5 w-full rounded-full bg-rose-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
