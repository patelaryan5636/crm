import { useState, useMemo } from "react";
import {
  Heading, DashGrid, EnhancedDashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, Button,
  DataField, SelectField, Option, Grid,
} from "../../../../components/shared/Common_Components";
import DatePicker from "../../../../components/shared/DatePicker";
import { kpiLeaves } from "./HrmStore";
import { useCurrentUser } from "../../../../hooks/useCurrentUser";
import { Calendar, CheckCircle, Clock, XCircle, Eye, Trash2 } from "lucide-react";

const KPI_ICONS   = [<Calendar size={22} />, <CheckCircle size={22} />, <Clock size={22} />, <XCircle size={22} />];
const KPI_ACCENTS = ["#3b82f6", "#22c55e", "#f59e0b", "#f43f5e"];

// Columns for My Leaves table
const MY_LEAVES_COLS = [
  { key: "type",      label: "Leave Type" },
  { key: "reason",    label: "Reason"     },
  { key: "dateRange", label: "Date Range" },
  { key: "days",      label: "Days"       },
  { key: "appliedOn", label: "Applied On" },
  { key: "status",    label: "Status"     },
];

// Columns for Leave History table — own leaves only, no employee/role columns
const HISTORY_COLS = [
  { key: "type",      label: "Leave Type"  },
  { key: "reason",    label: "Reason"      },
  { key: "dateRange", label: "Date Range"  },
  { key: "days",      label: "Days"        },
  { key: "actionOn",  label: "Actioned On" },
  { key: "status",    label: "Status"      },
];

// Seed data — the logged-in Sales Executive's own leaves only
// employeeId matches the logged-in user's _id from localStorage
const MY_LEAVES_SEED = [
  { id: "ML001", employeeId: "SELF", type: "Sick Leave",   from: "2026-04-10", to: "2026-04-11", days: "2", appliedOn: "2026-04-09", reason: "Fever and body ache",                   status: "Accepted"    },
  { id: "ML002", employeeId: "SELF", type: "Casual Leave", from: "2026-04-22", to: "2026-04-22", days: "1", appliedOn: "2026-04-20", reason: "Personal errand",                        status: "Rejected"    },
  { id: "ML003", employeeId: "SELF", type: "Earned Leave", from: "2026-05-01", to: "2026-05-03", days: "3", appliedOn: "2026-04-28", reason: "Family trip planned in advance",          status: "Accepted"    },
  { id: "ML004", employeeId: "SELF", type: "Casual Leave", from: "2026-05-15", to: "2026-05-15", days: "1", appliedOn: "2026-05-13", reason: "Home maintenance work",                   status: "Not Respond" },
  { id: "ML005", employeeId: "SELF", type: "Sick Leave",   from: "2026-05-28", to: "2026-05-29", days: "2", appliedOn: "2026-05-27", reason: "Viral infection — doctor advised rest",   status: "Pending"     },
].map((r) => ({ ...r, dateRange: `${r.from} to ${r.to}` }));

// History and seed are derived inside the component using the logged-in user's ID.

export default function Leaves() {
  const currentUser = useCurrentUser();
  // Logged-in user's ID — used to filter leaves so only own records are shown.
  // In mock data employeeId is "SELF"; with real API data it will be user._id.
  const myId = currentUser?._id ?? "SELF";

  // Filter seed data to only this user's leaves (security: never show other employees)
  const mySeed = useMemo(
    () => MY_LEAVES_SEED.filter((r) => r.employeeId === myId || r.employeeId === "SELF"),
    [myId]
  );
  const myHistorySeed = useMemo(
    () => mySeed.filter((r) => r.status === "Accepted" || r.status === "Rejected")
               .map((r) => ({ ...r, actionOn: r.appliedOn })),
    [mySeed]
  );

  // Own leaves only
  const [myLeaves,    setMyLeaves]    = useState(mySeed);
  const [myLeaveView, setMyLeaveView] = useState(null);

  // History = own actioned leaves only (no other employees)
  const [history,         setHistory]         = useState(myHistorySeed);
  const [historySelected, setHistorySelected] = useState(null);

  // ── Apply Leave form ──────────────────────────────────────────────────────
  const LEAVE_TYPES = [
    "Sick Leave", "Casual Leave", "Earned Leave",
    "Maternity Leave", "Paternity Leave", "Bereavement Leave",
    "Unpaid Leave", "Other",
  ];
  const [applyForm,  setApplyForm]  = useState({ leaveType: "", reason: "", dateFrom: "", dateTo: "" });
  const [applyError, setApplyError] = useState({});

  const calcDays = (from, to) => {
    if (!from || !to) return "";
    const diff = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24);
    return diff < 0 ? "" : String(diff + 1);
  };
  const applyDays = calcDays(applyForm.dateFrom, applyForm.dateTo);

  const handleApplyChange = (field, value) => {
    setApplyForm((prev) => ({ ...prev, [field]: value }));
    if (applyError[field]) setApplyError((e) => ({ ...e, [field]: "" }));
  };

  const handleApplySubmit = () => {
    const errs = {};
    if (!applyForm.leaveType)              errs.leaveType = "Please select a leave type.";
    if (!applyForm.reason.trim())          errs.reason    = "Reason is required.";
    if (!applyForm.dateFrom)               errs.dateFrom  = "Start date is required.";
    if (!applyForm.dateTo)                 errs.dateTo    = "End date is required.";
    if (applyForm.dateFrom && applyForm.dateTo && applyForm.dateTo < applyForm.dateFrom)
      errs.dateTo = "End date must be on or after start date.";
    if (Object.keys(errs).length) { setApplyError(errs); return; }

    const today    = new Date().toISOString().split("T")[0];
    const newLeave = {
      id:         `ML${Date.now()}`,
      employeeId: myId,           // tag with logged-in user's ID
      type:       applyForm.leaveType,
      reason:     applyForm.reason,
      from:       applyForm.dateFrom,
      to:         applyForm.dateTo,
      days:       applyDays,
      dateRange:  `${applyForm.dateFrom} to ${applyForm.dateTo}`,
      appliedOn:  today,
      status:     "Pending",
    };
    setMyLeaves((prev) => [newLeave, ...prev]);
    setApplyForm({ leaveType: "", reason: "", dateFrom: "", dateTo: "" });
    setApplyError({});
    closeModal("apply-leave-modal");
  };

  return (
    <div className="flex flex-col gap-6">

      {/* KPI cards */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="HRM" secondaryText="Leaves" size={12} />
        {kpiLeaves.map((k, i) => (
          <EnhancedDashCard key={k.title} title={k.title} value={k.value}
            icon={KPI_ICONS[i]} accentColor={KPI_ACCENTS[i]} size={3} />
        ))}
      </DashGrid>

      {/* Apply Leave button */}
      <div className="flex justify-end">
        <Button text="+ &nbsp; Apply Leave" onClick={() => openModal("apply-leave-modal")} />
      </div>

      {/* ── My Leaves ──────────────────────────────────────────────────────── */}
      <DataTable
        title="My Leaves"
        columns={MY_LEAVES_COLS}
        rows={myLeaves}
        ellipse={4}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Details",
            variant: "ghost",
            onClick: (row) => {
              setMyLeaveView(myLeaves.find((r) => r.id === row.id) ?? row);
              openModal("my-leave-view-modal");
            },
          },
          {
            icon: <Trash2 size={15} />,
            tooltip: "Cancel / Delete",
            variant: "danger",
            // Only show delete for Pending or Not Respond — not for Accepted/Rejected
            show: (row) => row.status === "Pending" || row.status === "Not Respond",
            onClick: (row) => setMyLeaves((prev) => prev.filter((r) => r.id !== row.id)),
          },
        ]}
        size={12}
        pageSize={5}
        searchable
        exportable
        exportFileName="my-leaves"
        filters={[
          { title: "Status",     type: "toggle", key: "status", options: ["Pending", "Accepted", "Rejected", "Not Respond"] },
          { title: "Leave Type", type: "toggle", key: "type",   options: ["Sick Leave", "Casual Leave", "Earned Leave", "Maternity Leave", "Paternity Leave", "Bereavement Leave", "Unpaid Leave", "Other"] },
        ]}
      />

      {/* ── Leave History — own actioned leaves only ────────────────────────── */}
      <DataTable
        title="Leave History"
        columns={HISTORY_COLS}
        rows={history}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Details",
            variant: "ghost",
            onClick: (row) => {
              setHistorySelected(history.find((r) => r.id === row.id) ?? row);
              openModal("leave-history-modal");
            },
          },
        ]}
        ellipse={3}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="leave-history"
        filters={[
          { title: "Status",     type: "toggle", key: "status", options: ["Accepted", "Rejected"] },
          { title: "Leave Type", type: "toggle", key: "type",   options: ["Sick Leave", "Casual Leave", "Earned Leave", "Maternity Leave", "Paternity Leave", "Bereavement Leave", "Unpaid Leave", "Other"] },
        ]}
      />

      {/* ── My Leave View Modal ─────────────────────────────────────────────── */}
      <Modal id="my-leave-view-modal" title="My Leave Details" size="md">
        {myLeaveView && (
          <div className="flex flex-col gap-4">
            {/* Status banner */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold ${
              myLeaveView.status === "Accepted"    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : myLeaveView.status === "Rejected"    ? "bg-rose-50 border-rose-200 text-rose-700"
            : myLeaveView.status === "Pending"     ? "bg-amber-50 border-amber-200 text-amber-700"
            :                                        "bg-slate-50 border-slate-200 text-slate-600"
            }`}>
              <span className="text-xs font-black uppercase tracking-widest">Status:</span>
              {myLeaveView.status}
            </div>

            <ModalGrid title="Leave Info" cols={2}>
              <ModalData label="Leave Type" value={myLeaveView.type} />
              <ModalData label="Applied On" value={myLeaveView.appliedOn} />
              <ModalData label="From Date"  value={myLeaveView.from} />
              <ModalData label="To Date"    value={myLeaveView.to} />
              <ModalData label="Total Days" value={`${myLeaveView.days} day${myLeaveView.days === "1" ? "" : "s"}`} />
              <ModalData label="Status"     value={myLeaveView.status} />
            </ModalGrid>

            <ModalGrid title="Reason" cols={1}>
              <ModalData label="Full Reason" value={myLeaveView.reason} />
            </ModalGrid>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              {(myLeaveView.status === "Pending" || myLeaveView.status === "Not Respond") && (
                <button
                  onClick={() => {
                    setMyLeaves((prev) => prev.filter((r) => r.id !== myLeaveView.id));
                    closeModal("my-leave-view-modal");
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition active:scale-95"
                >
                  Cancel Application
                </button>
              )}
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("my-leave-view-modal")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Apply Leave Modal ───────────────────────────────────────────────── */}
      <Modal id="apply-leave-modal" title="Apply for Leave" size="lg">
        <div className="space-y-5">
          <Grid cols={12} gap={4}>

            <div className="col-span-12">
              <SelectField label="Leave Type" id="apply-leave-type" size={12}
                placeholder="Select leave type..." value={applyForm.leaveType}
                onChange={(e) => handleApplyChange("leaveType", e.target.value)}>
                {LEAVE_TYPES.map((t) => <Option key={t} value={t} label={t} />)}
              </SelectField>
              {applyError.leaveType && <p className="text-xs text-rose-600 mt-1 px-1">{applyError.leaveType}</p>}
            </div>

            <div className="col-span-5">
              <DatePicker label="Date From" id="apply-date-from"
                value={applyForm.dateFrom} onChange={(v) => handleApplyChange("dateFrom", v)} />
              {applyError.dateFrom && <p className="text-xs text-rose-600 mt-1 px-1">{applyError.dateFrom}</p>}
            </div>

            <div className="col-span-5">
              <DatePicker label="Date To" id="apply-date-to"
                value={applyForm.dateTo} minDate={applyForm.dateFrom || undefined}
                onChange={(v) => handleApplyChange("dateTo", v)} />
              {applyError.dateTo && <p className="text-xs text-rose-600 mt-1 px-1">{applyError.dateTo}</p>}
            </div>

            <div className="col-span-2">
              <DataField label="Days" id="apply-days" type="text" size={12}
                value={applyDays ? `${applyDays} day${applyDays === "1" ? "" : "s"}` : ""}
                placeholder="# Days" disabled />
            </div>

            <div className="col-span-12">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                placeholder="Briefly describe the reason for your leave..."
                value={applyForm.reason}
                onChange={(e) => handleApplyChange("reason", e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-[#2a465a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2a465a]/20 focus:border-[#2a465a]/40 resize-none transition duration-200"
              />
              {applyError.reason && <p className="text-xs text-rose-600 mt-1 px-1">{applyError.reason}</p>}
            </div>

          </Grid>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button text="Cancel" variant="ghost"
              onClick={() => {
                setApplyForm({ leaveType: "", reason: "", dateFrom: "", dateTo: "" });
                setApplyError({});
                closeModal("apply-leave-modal");
              }}
            />
            <Button text="Submit Application" onClick={handleApplySubmit} />
          </div>
        </div>
      </Modal>

      {/* ── Leave History View Modal — own leave, read-only ──────────────────── */}
      <Modal id="leave-history-modal" title="Leave Details" size="md">
        {historySelected && (
          <div className="flex flex-col gap-4">
            {/* Status banner */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold ${
              historySelected.status === "Accepted" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : historySelected.status === "Rejected" ? "bg-rose-50 border-rose-200 text-rose-700"
            :                                          "bg-slate-50 border-slate-200 text-slate-600"
            }`}>
              <span className="text-xs font-black uppercase tracking-widest">Status:</span>
              {historySelected.status}
            </div>

            <ModalGrid title="Leave Info" cols={2}>
              <ModalData label="Leave Type"          value={historySelected.type} />
              <ModalData label="Applied On"          value={historySelected.appliedOn} />
              <ModalData label="From Date"           value={historySelected.from} />
              <ModalData label="To Date"             value={historySelected.to} />
              <ModalData label="Total Days"          value={`${historySelected.days} day${historySelected.days === "1" ? "" : "s"}`} />
              <ModalData label="Actioned On"         value={historySelected.actionOn || "—"} />
            </ModalGrid>

            <ModalGrid title="Reason" cols={1}>
              <ModalData label="Full Reason" value={historySelected.reason} />
            </ModalGrid>

            <div className="flex justify-end">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("leave-history-modal")} />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
