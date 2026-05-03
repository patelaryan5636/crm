import { useState } from "react";
import toast from "react-hot-toast";
import { FileText, Send, Loader2, AlertCircle, CalendarDays } from "lucide-react";
import { DataTable } from "../../../../components/shared/Common_Components";
import { hrmService } from "../../../../services/hrmService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmtLeaveDate = (d) => {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  const [, m, day] = parts;
  return `${day} ${MONTHS[+m - 1]} ${parts[0]}`;
};

const diffDays = (from, to) =>
  Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);

// ─── Component ────────────────────────────────────────────────────────────────
export default function LeaveForm({ leaves, setLeaves }) {
  const EMPTY = { type: "Sick", from: "", to: "", reason: "" };
  const [form, setForm]             = useState(EMPTY);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");

  const validate = () => {
    const e = {};
    if (!form.type)   e.type = "Select a leave type.";
    if (!form.from)   e.from = "Select start date.";
    if (!form.to)     e.to   = "Select end date.";
    if (form.from && form.to && form.to < form.from) e.to = "End date must be after start date.";
    if (!form.reason.trim()) e.reason = "Please provide a reason.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError("");
    setSubmitting(true);
    try {
      const res = await hrmService.applyLeave({
        type: form.type, from: form.from, to: form.to,
        days: diffDays(form.from, form.to), reason: form.reason,
      });
      setLeaves(prev => [res.data, ...prev]);
      setForm(EMPTY);
      toast.success("Leave Applied Successfully!", { icon: "📋", duration: 4000 });
    } catch {
      setApiError("Failed to submit leave. Please try again.");
      toast.error("Failed to submit leave. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field) =>
    `w-full px-3 py-2 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition
     ${errors[field] ? "border-rose-300 focus:ring-rose-200" : "border-slate-200 focus:ring-sky-200 focus:border-sky-400"}`;

  // ── DataTable columns ──────────────────────────────────────────────────────
  // DataTable renders row[col.key] directly — pre-format dates in the rows.
  const leaveRows = leaves.map(l => ({
    ...l,
    fromFmt: fmtLeaveDate(l.from),
    toFmt:   fmtLeaveDate(l.to),
  }));

  const leaveCols = [
    { key: "type",    label: "Type"   },
    { key: "fromFmt", label: "From"   },
    { key: "toFmt",   label: "To"     },
    { key: "days",    label: "Days"   },
    { key: "reason",  label: "Reason" },
    { key: "status",  label: "Status" },
  ];

  return (
    <div className="space-y-5">

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle size={15} className="text-rose-500 flex-shrink-0" />
          <span className="flex-1 font-medium">{apiError}</span>
          <button onClick={() => setApiError("")} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Apply Leave Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0">
            <FileText size={14} className="text-white" />
          </div>
          <h3 className="text-sm font-bold text-[#1a2e3f]">Apply for Leave</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Leave Type <span className="text-rose-500">*</span>
              </label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls("type")}>
                <option value="Sick">🤒 Sick Leave</option>
                <option value="Casual">🏖️ Casual Leave</option>
                <option value="Paid">💼 Paid Leave</option>
              </select>
              {errors.type && <p className="text-xs text-rose-500 mt-1">{errors.type}</p>}
            </div>
            <div className="hidden sm:block" />
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                From Date <span className="text-rose-500">*</span>
              </label>
              <input type="date" value={form.from}
                onChange={e => setForm(p => ({ ...p, from: e.target.value }))}
                className={inputCls("from")} />
              {errors.from && <p className="text-xs text-rose-500 mt-1">{errors.from}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                To Date <span className="text-rose-500">*</span>
              </label>
              <input type="date" value={form.to} min={form.from || undefined}
                onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                className={inputCls("to")} />
              {errors.to && <p className="text-xs text-rose-500 mt-1">{errors.to}</p>}
            </div>
            {form.from && form.to && form.to >= form.from && (
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl text-xs font-semibold text-sky-700">
                  <CalendarDays size={13} />
                  Duration: <span className="font-black">{diffDays(form.from, form.to)} day{diffDays(form.from, form.to) > 1 ? "s" : ""}</span>
                  &nbsp;({fmtLeaveDate(form.from)} → {fmtLeaveDate(form.to)})
                </div>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Reason <span className="text-rose-500">*</span>
              </label>
              <textarea rows={3} value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Briefly describe the reason for your leave…"
                className={`${inputCls("reason")} resize-none`} />
              {errors.reason && <p className="text-xs text-rose-500 mt-1">{errors.reason}</p>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => { setForm(EMPTY); setErrors({}); }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
              Clear
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1a2e3f] text-white text-sm font-bold hover:bg-[#2a465a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm">
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                : <><Send size={14} /> Submit Leave</>}
            </button>
          </div>
        </form>
      </div>

      {/* Leave History — DataTable from shared components */}
      <DataTable
        title="Leave History"
        columns={leaveCols}
        rows={leaveRows}
        searchable={false}
        pageSize={10}
        size={12}
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Approved", "Rejected", "Pending"] },
          { title: "Type",   type: "select", key: "type",   options: ["Sick", "Casual", "Paid"] },
        ]}
      />

    </div>
  );
}
