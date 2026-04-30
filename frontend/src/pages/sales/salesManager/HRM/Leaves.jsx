import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalProfile, ModalGrid, Button,
} from "../../../../components/shared/Common_Components";
import { kpiLeaves, pendingLeaveRows, leaveHistoryRows } from "./HrmStore";
import { Calendar, CheckCircle, Clock, XCircle, Eye, BadgeCheck, Ban, Trash2, Download } from "lucide-react";

const KPI_ICONS   = [<Calendar size={22} />, <CheckCircle size={22} />, <Clock size={22} />, <XCircle size={22} />];
const KPI_ACCENTS = ["#3b82f6", "#22c55e", "#f59e0b", "#f43f5e"];

// Columns for Pending Leaves table
const PENDING_COLS = [
  { key: "name",      label: "Employee" },
  { key: "role",      label: "Role" },
  { key: "type",      label: "Leave Type" },
  { key: "reason",    label: "Reason" },
  { key: "dateRange", label: "Date Range" },
  { key: "days",      label: "Days" },
  { key: "appliedOn", label: "Applied On" },
];

// Columns for Leave History table
const HISTORY_COLS = [
  { key: "name",      label: "Employee" },
  { key: "role",      label: "Role" },
  { key: "type",      label: "Leave Type" },
  { key: "reason",    label: "Reason" },
  { key: "dateRange", label: "Date Range" },
  { key: "days",      label: "Days" },
  { key: "actionOn",  label: "Actioned On" },
  { key: "status",    label: "Status" },
];

export default function Leaves() {
  const [pending, setPending] = useState(
    pendingLeaveRows.map((r) => ({ ...r, dateRange: `${r.from} to ${r.to}` }))
  );
  const [history, setHistory] = useState(
    leaveHistoryRows.map((r) => ({ ...r, dateRange: `${r.from} to ${r.to}` }))
  );

  // Separate selected state for each modal
  const [pendingSelected, setPendingSelected] = useState(null);
  const [historySelected, setHistorySelected] = useState(null);

  const changeStatus = (row, newStatus) => {
    const today = new Date().toISOString().split("T")[0];

    // Remove from pending
    setPending((prev) => prev.filter((r) => r.id !== row.id));

    // Add/update in history
    setHistory((prev) => {
      const exists = prev.find((r) => r.id === row.id);
      const updated = { ...row, status: newStatus, actionOn: today, dateRange: row.dateRange ?? `${row.from} to ${row.to}` };
      if (exists) return prev.map((r) => r.id === row.id ? updated : r);
      return [updated, ...prev];
    });

    // Keep pending modal in sync if open
    setPendingSelected((s) => s && s.id === row.id ? { ...s, status: newStatus, actionOn: today } : s);
  };

  // Pending table: View + Accept + Reject
  const pendingActions = [
    {
      icon: <Eye size={15} />,
      tooltip: "View Details",
      variant: "ghost",
      onClick: (row) => {
        setPendingSelected(pending.find((r) => r.id === row.id) ?? row);
        openModal("leave-pending-modal");
      },
    },
    {
      icon: <BadgeCheck size={15} />,
      tooltip: "Accept",
      variant: "primary",
      onClick: (row) => changeStatus(row, "Accepted"),
    },
    {
      icon: <Ban size={15} />,
      tooltip: "Reject",
      variant: "danger",
      onClick: (row) => changeStatus(row, "Rejected"),
    },
  ];

  // History table: View + Delete only
  const historyActions = [
    {
      icon: <Eye size={15} />,
      tooltip: "View Details",
      variant: "ghost",
      onClick: (row) => {
        setHistorySelected(history.find((r) => r.id === row.id) ?? row);
        openModal("leave-history-modal");
      },
    },
    {
      icon: <Trash2 size={15} />,
      tooltip: "Delete",
      variant: "danger",
      onClick: (row) => setHistory((prev) => prev.filter((r) => r.id !== row.id)),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="HRM" secondaryText="Leaves" size={12} />
        {kpiLeaves.map((k, i) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={KPI_ICONS[i]} accentColor={KPI_ACCENTS[i]} size={3} />
        ))}
      </DashGrid>

      {/* ── Pending Leaves ─────────────────────────────────────────────────── */}
      <DataTable
        title="Pending Leaves"
        columns={PENDING_COLS}
        rows={pending}
        actions={pendingActions}
        ellipse={3}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="pending-leaves"
        filters={[
          { title: "Leave Type", type: "toggle", key: "type",       options: ["Sick Leave", "Casual Leave", "Earned Leave"] },
          { title: "Team Leader", type: "select", key: "teamLeader", options: [...new Set(pendingLeaveRows.map((r) => r.teamLeader))] },
          { title: "Role",        type: "toggle", key: "role",       options: ["Executive", "Team Leader"] },
        ]}
      />

      {/* ── Leave History ───────────────────────────────────────────────────── */}
      <DataTable
        title="Leave History"
        columns={HISTORY_COLS}
        rows={history}
        actions={historyActions}
        bulkAction
        bulkActions={[
          {
            title: "Delete Selected",
            icon: <Trash2 size={14} />,
            onClick: (selected) => {
              const ids = new Set(selected.map((r) => r.id));
              setHistory((prev) => prev.filter((r) => !ids.has(r.id)));
            },
          },
          {
            title: "Export Selected",
            icon: <Download size={14} />,
            onClick: (selected) => {
              if (!selected.length) return;
              const keys    = Object.keys(selected[0]);
              const header  = keys.join(",");
              const escape  = (v) => { const s = v == null ? "" : String(v); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; };
              const csvRows = selected.map((r) => keys.map((k) => escape(r[k])).join(","));
              const blob    = new Blob(["\uFEFF" + [header, ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
              const url     = URL.createObjectURL(blob);
              const a       = document.createElement("a");
              a.href = url; a.download = "leave-history-selected.csv"; a.click();
              URL.revokeObjectURL(url);
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
          { title: "Status",      type: "toggle", key: "status",     options: ["Accepted", "Rejected", "Not Respond"] },
          { title: "Leave Type",  type: "toggle", key: "type",       options: ["Sick Leave", "Casual Leave", "Earned Leave"] },
          { title: "Team Leader", type: "select", key: "teamLeader", options: [...new Set(leaveHistoryRows.map((r) => r.teamLeader))] },
          { title: "Role",        type: "toggle", key: "role",       options: ["Executive", "Team Leader"] },
        ]}
      />

      {/* ── Pending Leave View Modal (with Accept / Reject) ─────────────────── */}
      <Modal id="leave-pending-modal" title="Leave Request Details" size="md">
        {pendingSelected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={pendingSelected.name}
              subtitle={`${pendingSelected.role} · ${pendingSelected.teamLeader}`}
              meta={`Applied: ${pendingSelected.appliedOn}`}
            />
            <ModalGrid title="Leave Info" cols={2}>
              <ModalData label="Leave Type"  value={pendingSelected.type} />
              <ModalData label="From Date"   value={pendingSelected.from} />
              <ModalData label="To Date"     value={pendingSelected.to} />
              <ModalData label="Total Days"  value={pendingSelected.days} />
              <ModalData label="Team Leader" value={pendingSelected.teamLeader} />
              <ModalData label="Role"        value={pendingSelected.role} />
            </ModalGrid>
            <ModalGrid title="Reason" cols={1}>
              <ModalData label="Full Reason" value={pendingSelected.reason} />
            </ModalGrid>

            {/* Accept / Reject buttons — only when still Pending */}
            {pendingSelected.status === "Pending" && (
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <Button
                  text="Accept"
                  variant="primary"
                  size={6}
                  onClick={() => {
                    changeStatus(pendingSelected, "Accepted");
                    closeModal("leave-pending-modal");
                  }}
                />
                <Button
                  text="Reject"
                  variant="danger"
                  size={6}
                  onClick={() => {
                    changeStatus(pendingSelected, "Rejected");
                    closeModal("leave-pending-modal");
                  }}
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("leave-pending-modal")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Leave History View Modal (read-only) ────────────────────────────── */}
      <Modal id="leave-history-modal" title="Leave Record Details" size="md">
        {historySelected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={historySelected.name}
              subtitle={`${historySelected.role} · ${historySelected.teamLeader}`}
              meta={`Applied: ${historySelected.appliedOn}`}
            />
            <ModalGrid title="Leave Info" cols={2}>
              <ModalData label="Leave Type"          value={historySelected.type} />
              <ModalData label="From Date"           value={historySelected.from} />
              <ModalData label="To Date"             value={historySelected.to} />
              <ModalData label="Total Days"          value={historySelected.days} />
              <ModalData label="Status"              value={historySelected.status} />
              <ModalData label="Accepted/Rejected On" value={historySelected.actionOn || "—"} />
              <ModalData label="Team Leader"         value={historySelected.teamLeader} />
              <ModalData label="Role"                value={historySelected.role} />
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
