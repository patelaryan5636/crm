import { useState, useMemo, useEffect } from "react";
import {
  DataTable, Modal, Button, DataField, SelectField, Option,
  openModal, closeModal, ModalProfile, ModalData, ModalGrid, Grid,
  DashGrid, EnhancedDashCard,
} from "../../../../components/shared/Common_Components.jsx";
import {
  Eye, CheckCircle2, RotateCcw, CalendarClock, AlertTriangle, Calendar,
} from "lucide-react";
import apiClient from "../../../../services/apiClient";
import toast from "react-hot-toast";

const TODAY = new Date().toISOString().split("T")[0];

const COLS = [
  { key: "leadName",     label: "Lead" },
  { key: "type",         label: "Type" },
  { key: "date",         label: "Date" },
  { key: "time",         label: "Time" },
  { key: "priority",     label: "Priority" },
  { key: "assignedExec", label: "Executive" },
  { key: "status",       label: "Status" },
];

const FOLLOWUP_TYPES = ["Call", "Email", "Meeting", "Whatsapp", "Demo"];
const FOLLOWUP_PRIORITIES = ["High", "Medium", "Low"];

const initialForm = {
  leadName: "", date: TODAY, time: "10:00", type: "Call",
  priority: "Medium", assignedExec: "", notes: "", leadId: ""
};

export default function FollowUps() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewRow,  setViewRow]  = useState(null);
  const [reschRow, setReschRow] = useState(null);
  const [reschTo,  setReschTo]  = useState({ date: "", time: "" });

  const [form,     setForm]     = useState(initialForm);
  const [formErr,  setFormErr]  = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [followupsRes, workspaceRes] = await Promise.all([
        apiClient.get("/sales-team-leader/follow-ups"),
        apiClient.get("/sales-team-leader/leads/workspace")
      ]);
      if (followupsRes.data.success) {
        setRows(followupsRes.data.data.followUps || []);
        setStats(followupsRes.data.data.stats || {});
      }
      if (workspaceRes.data.success) {
        setExecutives(workspaceRes.data.data.targets || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const executiveNames = useMemo(() => executives.map(e => e.name), [executives]);

  const markDone = async (row) => {
    try {
      const res = await apiClient.patch(`/sales-team-leader/follow-ups/${row.id}/done`);
      if (res.data.success) {
        toast.success("Follow-up marked as done");
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to mark done");
    }
  };

  const openResch = (row) => {
    setReschRow(row);
    setReschTo({ date: row.date, time: row.time });
    openModal("tl-fu-resch");
  };

  const confirmResch = async () => {
    try {
      const remindAt = new Date(`${reschTo.date}T${reschTo.time}`).toISOString();
      const res = await apiClient.put(`/sales-team-leader/follow-ups/${reschRow.id}/reschedule`, { remindAt });
      if (res.data.success) {
        toast.success("Follow-up rescheduled");
        fetchData();
        closeModal("tl-fu-resch");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to reschedule");
    }
  };

  const openAdd = () => {
    setForm(initialForm);
    setFormErr({});
    openModal("tl-fu-add");
  };

  const saveAdd = async () => {
    const errs = {};
    if (!form.date)              errs.date         = "Date is required.";
    if (!form.time)              errs.time         = "Time is required.";
    if (!form.assignedExec)      errs.assignedExec = "Pick an executive.";
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    try {
      const remindAt = new Date(`${form.date}T${form.time}`).toISOString();
      const payload = {
        title: form.leadName || "Follow-up",
        note: form.notes,
        remindAt,
        type: form.type,
        priority: form.priority,
        executiveId: form.assignedExec
      };
      const res = await apiClient.post("/sales-team-leader/follow-ups", payload);
      if (res.data.success) {
        toast.success("Reminder added");
        fetchData();
        closeModal("tl-fu-add");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add reminder");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading follow-ups...</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Today"     value={String(stats.today || 0)}    icon={<CalendarClock size={22} />} accentColor="#3b82f6" size={3} />
        <EnhancedDashCard title="Overdue"   value={String(stats.overdue || 0)}  icon={<AlertTriangle size={22} />} accentColor="#f43f5e" size={3} />
        <EnhancedDashCard title="Upcoming"  value={String(stats.pending || 0)} icon={<Calendar      size={22} />} accentColor="#14b8a6" size={3} />
        <EnhancedDashCard title="Completed" value={String(stats.completed || 0)}     icon={<CheckCircle2  size={22} />} accentColor="#22c55e" size={3} />
      </DashGrid>

      {/* ── Add reminder button ──────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button text="+  Add Reminder" variant="primary" onClick={openAdd} />
      </div>

      {/* ── Follow-ups table ─────────────────────────────────────────────── */}
      <DataTable
        title="Team Follow-ups"
        columns={COLS}
        rows={rows}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="team_followups"
        filters={[
          { title: "Status",    type: "toggle", key: "status",       options: ["Pending", "Overdue", "Done", "Missed"] },
          { title: "Type",      type: "toggle", key: "type",         options: FOLLOWUP_TYPES },
          { title: "Priority",  type: "toggle", key: "priority",     options: FOLLOWUP_PRIORITIES },
          { title: "Executive", type: "select", key: "assignedExec", options: executiveNames },
        ]}
        actions={[
          { icon: <Eye size={15} />,           tooltip: "View",        variant: "ghost",
            onClick: (row) => { setViewRow(rows.find((r) => r.id === row.id)); openModal("tl-fu-view"); } },
          { icon: <CheckCircle2 size={15} />,  tooltip: "Mark Done",   variant: "primary",
            onClick: markDone },
          { icon: <RotateCcw size={15} />,     tooltip: "Reschedule",  variant: "ghost",
            onClick: openResch },
        ]}
      />

      {/* ── View modal ───────────────────────────────────────────────────── */}
      <Modal id="tl-fu-view" title="Follow-up Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={viewRow.leadName}
              subtitle={`${viewRow.type} · ${viewRow.status}`}
              meta={`Assigned to ${viewRow.assignedExec}`}
            />
            <ModalGrid title="Schedule" cols={2}>
              <ModalData label="Date"     value={viewRow.date} />
              <ModalData label="Time"     value={viewRow.time} />
              <ModalData label="Type"     value={viewRow.type} />
              <ModalData label="Priority" value={viewRow.priority} />
            </ModalGrid>
            <ModalGrid title="Notes" cols={1}>
              <ModalData label="Agenda" value={viewRow.notes || "—"} />
            </ModalGrid>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {viewRow.status !== "Done" && (
                <Button text="Mark Done" variant="primary" size={3}
                  onClick={() => { markDone(viewRow); closeModal("tl-fu-view"); }} />
              )}
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("tl-fu-view")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add reminder modal ───────────────────────────────────────────── */}
      <Modal id="tl-fu-add" title="Add Reminder" size="md">
        <div className="space-y-4">
          <Grid cols={12} gap={4}>
            <DataField label="Lead Name / Title" id="tl-fu-lead" value={form.leadName} size={12}
              onChange={(e) => { setForm((p) => ({ ...p, leadName: e.target.value })); setFormErr((er) => ({ ...er, leadName: "" })); }} />
            {formErr.leadName && <p className="col-span-12 -mt-2 text-xs text-rose-600 px-1">{formErr.leadName}</p>}

            <DataField label="Date" id="tl-fu-date" type="date" value={form.date} size={6}
              onChange={(e) => { setForm((p) => ({ ...p, date: e.target.value })); setFormErr((er) => ({ ...er, date: "" })); }} />
            <DataField label="Time" id="tl-fu-time" type="time" value={form.time} size={6}
              onChange={(e) => { setForm((p) => ({ ...p, time: e.target.value })); setFormErr((er) => ({ ...er, time: "" })); }} />

            <SelectField label="Type" value={form.type} size={6} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {FOLLOWUP_TYPES.map((t) => <Option key={t} value={t} label={t} />)}
            </SelectField>
            <SelectField label="Priority" value={form.priority} size={6} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
              {FOLLOWUP_PRIORITIES.map((p) => <Option key={p} value={p} label={p} />)}
            </SelectField>

            <SelectField label="Assigned Executive" value={form.assignedExec} size={12}
              onChange={(e) => { setForm((p) => ({ ...p, assignedExec: e.target.value })); setFormErr((er) => ({ ...er, assignedExec: "" })); }}>
              <Option value="" label="-- Pick an executive --" />
              {executives.map((ex) => <Option key={ex.id} value={ex.name} label={ex.name} />)}
            </SelectField>
            {formErr.assignedExec && <p className="col-span-12 -mt-2 text-xs text-rose-600 px-1">{formErr.assignedExec}</p>}

            <DataField label="Notes / Agenda" id="tl-fu-notes" value={form.notes} size={12}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />

            <Button text="Save Reminder" variant="primary"   size={6} onClick={saveAdd} />
            <Button text="Cancel"        variant="secondary" size={6} onClick={() => closeModal("tl-fu-add")} />
          </Grid>
        </div>
      </Modal>

      {/* ── Reschedule modal ─────────────────────────────────────────────── */}
      <Modal id="tl-fu-resch" title="Reschedule Follow-up" size="sm">
        {reschRow && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Current" cols={2}>
              <ModalData label="Lead" value={reschRow.leadName} />
              <ModalData label="When" value={`${reschRow.date} ${reschRow.time}`} />
            </ModalGrid>
            <Grid cols={12} gap={4}>
              <DataField label="New Date" id="tl-fu-resch-date" type="date" value={reschTo.date} size={6}
                onChange={(e) => setReschTo((p) => ({ ...p, date: e.target.value }))} />
              <DataField label="New Time" id="tl-fu-resch-time" type="time" value={reschTo.time} size={6}
                onChange={(e) => setReschTo((p) => ({ ...p, time: e.target.value }))} />
            </Grid>
            <Grid cols={12} gap={2}>
              <Button text="Cancel"  variant="secondary" size={6} onClick={() => closeModal("tl-fu-resch")} />
              <Button text="Confirm" variant="primary"   size={6} onClick={confirmResch} disabled={!reschTo.date || !reschTo.time} />
            </Grid>
          </div>
        )}
      </Modal>
    </div>
  );
}
