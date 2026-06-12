import { useState, useEffect, useCallback } from "react";
import {
  Heading, DashGrid, EnhancedDashCard, DataTable, DataField,
  Button, Modal, ModalData, ModalGrid, ModalProfile,
  Grid, openModal, closeModal,
} from "../../../components/shared/Common_Components.jsx";
import {
  Target, CheckCircle2, Clock, AlertTriangle, Eye,
  TrendingUp, Plus, Trash2, RefreshCw, AlertCircle, CalendarDays,
} from "lucide-react";
import salesTargetService from "../../../services/salesTargetService";

// ─── constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_COLORS = {
  "Completed":   "bg-emerald-100 text-emerald-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Pending":     "bg-amber-100 text-amber-700",
  "Overdue":     "bg-red-100 text-red-600",
};

const TARGET_COLS = [
  { key: "memberName",    label: "Team Member" },
  { key: "period",        label: "Period" },
  { key: "targetCalls",   label: "Target Calls" },
  { key: "achievedCalls", label: "Achieved Calls" },
  { key: "targetSales",   label: "Target Sales" },
  { key: "achievedSales", label: "Achieved Sales" },
  { key: "progressBar",   label: "Progress" },
  { key: "status",        label: "Status" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

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
      {status}
    </span>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1 text-xs underline hover:no-underline">
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

// ─── Default form ─────────────────────────────────────────────────────────────

const now = new Date();
const DEFAULT_FORM = {
  userId:        "",
  month:         now.getMonth() + 1,
  year:          now.getFullYear(),
  targetCalls:  "",
  targetSales:  "",
  notes:        "",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SalesTeamLeaderTargets() {
  const [targets,     setTargets]     = useState([]);
  const [stats,       setStats]       = useState({ totalTargets: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 });
  const [members,     setMembers]     = useState([]);
  const [teamName,    setTeamName]    = useState("");
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [error,       setError]       = useState(null);
  const [submitting,  setSubmitting]  = useState(false);

  // Selected month/year
  const [selMonth,    setSelMonth]    = useState(now.getMonth() + 1);
  const [selYear,     setSelYear]     = useState(now.getFullYear());

  // Modals
  const [viewRow,     setViewRow]     = useState(null);
  const [editRow,     setEditRow]     = useState(null);
  const [form,        setForm]        = useState(DEFAULT_FORM);
  const [formErrors,  setFormErrors]  = useState({});

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const load = useCallback(async (m, y) => {
    setLoading(true);
    setError(null);
    try {
      const [teamData, targetData] = await Promise.all([
        salesTargetService.getTeamMembers(),
        salesTargetService.getTeamTargets(m, y),
      ]);
      setMembers(teamData.members || []);
      setTeamName(teamData.team?.name || "");
      setTargets(targetData.targets || []);
      setStats(targetData.stats || {});
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load targets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(selMonth, selYear); }, [load, selMonth, selYear]);

  // ── Rows for table ────────────────────────────────────────────────────────

  const rows = targets.map(t => ({
    ...t,
    memberName: t.user?.name ?? "—",
    period:     `${MONTHS[(t.month ?? 1) - 1]} ${t.year}`,
    progressBar: (
      <ProgressBar
        achieved={t.achievedSales}
        target={t.targetSales}
        color={t.status === "Completed" ? "#22c55e" : t.status === "Overdue" ? "#f43f5e" : "#3b82f6"}
      />
    ),
    status: <StatusBadge status={t.status} />,
  }));

  // ── Create ────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM, month: selMonth, year: selYear });
    setFormErrors({});
    openModal("tl-tgt-create");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.userId)                  errs.userId        = "Select a team member";
    if (!form.targetCalls && !form.targetSales) errs.targetCalls = "Set at least one target";
    return errs;
  };

  const handleCreate = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      await salesTargetService.createTarget({
        userId:      form.userId,
        month:       Number(form.month),
        year:        Number(form.year),
        targetCalls: Number(form.targetCalls) || 0,
        targetSales: Number(form.targetSales) || 0,
        notes:       form.notes,
      });
      closeModal("tl-tgt-create");
      load(selMonth, selYear);
    } catch (e) {
      setFormErrors({ api: e.response?.data?.message || "Failed to create target" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      targetCalls:   row.targetCalls,
      targetSales:   row.targetSales,
      achievedCalls: row.achievedCalls,
      achievedSales: row.achievedSales,
      notes:         row.notes || "",
    });
    setFormErrors({});
    openModal("tl-tgt-edit");
  };

  const handleEdit = async () => {
    setSubmitting(true);
    try {
      await salesTargetService.updateTarget(editRow._id, {
        targetCalls:   Number(form.targetCalls),
        targetSales:   Number(form.targetSales),
        achievedCalls: Number(form.achievedCalls),
        achievedSales: Number(form.achievedSales),
        notes:         form.notes,
      });
      closeModal("tl-tgt-edit");
      load(selMonth, selYear);
    } catch (e) {
      setFormErrors({ api: e.response?.data?.message || "Failed to update" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete target for ${row.memberName}? This cannot be undone.`)) return;
    try {
      await salesTargetService.deleteTarget(row._id);
      load(selMonth, selYear);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete");
    }
  };

  // ── Sync ─────────────────────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    try {
      await salesTargetService.syncProgress();
      load(selMonth, selYear);
    } catch (e) {
      alert("Sync failed: " + (e.response?.data?.message || e.message));
    } finally {
      setSyncing(false);
    }
  };

  // ── Year options ──────────────────────────────────────────────────────────
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <DashGrid cols={12} gap={4}>
        <Heading
          primaryText={teamName ? `${teamName} —` : "Team"}
          secondaryText="Monthly Targets"
          size={12}
        />
        <EnhancedDashCard title="Total Targets"  value={String(stats.totalTargets || 0)} icon={<Target size={22} />}        accentColor="#3b82f6" size={3} />
        <EnhancedDashCard title="Completed"       value={String(stats.completed    || 0)} icon={<CheckCircle2 size={22} />}  accentColor="#22c55e" size={3} />
        <EnhancedDashCard title="In Progress"     value={String(stats.inProgress   || 0)} icon={<Clock size={22} />}         accentColor="#f59e0b" size={3} />
        <EnhancedDashCard title="Pending / Overdue" value={String((stats.pending || 0) + (stats.overdue || 0))} icon={<AlertTriangle size={22} />} accentColor="#f43f5e" size={3} />
      </DashGrid>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <CalendarDays size={15} className="text-slate-400" />
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={selMonth}
            onChange={e => setSelMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync Progress"}
        </button>

        {/* Create target button */}
        <button
          onClick={openCreate}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-[#1a2e3f] rounded-xl px-4 py-2 shadow hover:bg-[#243d55] transition-colors ml-auto"
        >
          <Plus size={15} />
          Set New Target
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => load(selMonth, selYear)} />}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <DataTable
        title={`${MONTHS[selMonth - 1]} ${selYear} — Team Targets`}
        columns={TARGET_COLS}
        rows={rows}
        loading={loading}
        searchable
        exportable
        exportFileName="team_targets"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Completed", "In Progress", "Pending", "Overdue"] },
        ]}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Details",
            onClick: (row) => { setViewRow(targets.find(t => t._id === row._id)); openModal("tl-tgt-view"); },
          },
          {
            icon: <TrendingUp size={15} />,
            tooltip: "Update Progress",
            onClick: (row) => openEdit(targets.find(t => t._id === row._id)),
          },
          {
            icon: <Trash2 size={15} />,
            tooltip: "Delete Target",
            variant: "danger",
            onClick: handleDelete,
          },
        ]}
        size={12}
        pageSize={10}
      />

      {/* ── View modal ─────────────────────────────────────────────────── */}
      <Modal id="tl-tgt-view" title="Target Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={viewRow.user?.name ?? "Team"}
              subtitle={`${viewRow.user?.role ?? "USER"} · ${MONTHS[(viewRow.month ?? 1) - 1]} ${viewRow.year}`}
              meta={`Set by: ${viewRow.setBy?.name ?? "—"}`}
            />
            <ModalGrid title="Target vs Achieved" cols={3}>
              <ModalData label="Target Calls"    value={viewRow.targetCalls} />
              <ModalData label="Achieved Calls"  value={viewRow.achievedCalls} />
              <ModalData label="Remaining Calls" value={viewRow.remainingCalls} />
              <ModalData label="Target Sales"    value={viewRow.targetSales} />
              <ModalData label="Achieved Sales"  value={viewRow.achievedSales} />
              <ModalData label="Remaining Sales" value={viewRow.remainingSales} />
              <ModalData label="Status"          value={viewRow.status} />
            </ModalGrid>
            {/* Progress bars */}
            <div className="space-y-3 bg-slate-50 rounded-xl p-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Calls Progress</span>
                  <span>{pct(viewRow.achievedCalls, viewRow.targetCalls)}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct(viewRow.achievedCalls, viewRow.targetCalls)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Sales Progress</span>
                  <span>{pct(viewRow.achievedSales, viewRow.targetSales)}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct(viewRow.achievedSales, viewRow.targetSales)}%` }} />
                </div>
              </div>
            </div>
            {viewRow.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <strong>Notes:</strong> {viewRow.notes}
              </div>
            )}
            <div className="flex justify-end">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("tl-tgt-view")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create modal ───────────────────────────────────────────────── */}
      <Modal id="tl-tgt-create" title="Set New Monthly Target" size="md">
        <div className="flex flex-col gap-4">
          {formErrors.api && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formErrors.api}</div>
          )}
          <ModalGrid title="Assign To" cols={2}>
            {/* Member select */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Team Member *</label>
              <select
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.userId ? "border-red-400" : "border-slate-200"}`}
                value={form.userId}
                onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
              >
                <option value="">— Select member —</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.name} ({m.role.replace('SALES_', '')})</option>
                ))}
              </select>
              {formErrors.userId && <p className="text-xs text-red-500">{formErrors.userId}</p>}
            </div>
            {/* Month + Year */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Month</label>
              <select
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.month}
                onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Year</label>
              <select
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </ModalGrid>

          <ModalGrid title="Target Values" cols={2}>
            <DataField label="Target Calls"       id="tc" type="number" placeholder="e.g. 150"
              value={form.targetCalls} onChange={e => setForm(f => ({ ...f, targetCalls: e.target.value }))} />
            <DataField label="Target Conversions" id="ts" type="number" placeholder="e.g. 10"
              value={form.targetSales} onChange={e => setForm(f => ({ ...f, targetSales: e.target.value }))} />
          </ModalGrid>
          {formErrors.targetCalls && <p className="text-xs text-red-500 -mt-2">{formErrors.targetCalls}</p>}

          <DataField label="Notes (optional)" id="notes" type="text" placeholder="Any instructions…"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

          <Grid cols={12} gap={2}>
            <Button text="Cancel" variant="secondary" size={6} onClick={() => closeModal("tl-tgt-create")} />
            <Button text={submitting ? "Saving…" : "Set Target"} variant="primary" size={6} onClick={handleCreate} disabled={submitting} />
          </Grid>
        </div>
      </Modal>

      {/* ── Edit / Progress modal ──────────────────────────────────────── */}
      <Modal id="tl-tgt-edit" title="Update Target / Progress" size="md">
        {editRow && (
          <div className="flex flex-col gap-4">
            {formErrors.api && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formErrors.api}</div>
            )}
            <ModalProfile
              name={editRow.user?.name ?? "Team"}
              subtitle={`${MONTHS[(editRow.month ?? 1) - 1]} ${editRow.year}`}
            />
            <ModalGrid title="Edit Targets" cols={2}>
              <DataField label="Target Calls"       id="et-tc" type="number"
                value={form.targetCalls} onChange={e => setForm(f => ({ ...f, targetCalls: e.target.value }))} />
              <DataField label="Target Conversions" id="et-ts" type="number"
                value={form.targetSales} onChange={e => setForm(f => ({ ...f, targetSales: e.target.value }))} />
            </ModalGrid>
            <ModalGrid title="Override Achieved (optional)" cols={2}>
              <DataField label="Achieved Calls"    id="et-ac" type="number"
                value={form.achievedCalls} onChange={e => setForm(f => ({ ...f, achievedCalls: e.target.value }))} />
              <DataField label="Achieved Conversions" id="et-as" type="number"
                value={form.achievedSales} onChange={e => setForm(f => ({ ...f, achievedSales: e.target.value }))} />
            </ModalGrid>
            <DataField label="Notes" id="et-notes" type="text"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <Grid cols={12} gap={2}>
              <Button text="Cancel" variant="secondary" size={6} onClick={() => closeModal("tl-tgt-edit")} />
              <Button text={submitting ? "Saving…" : "Save Changes"} variant="primary" size={6} onClick={handleEdit} disabled={submitting} />
            </Grid>
          </div>
        )}
      </Modal>
    </div>
  );
}
