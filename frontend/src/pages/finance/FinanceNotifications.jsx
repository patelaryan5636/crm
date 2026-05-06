import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, Button,
} from "../../components/shared/Common_Components";
import { Bell, AlertCircle, CheckCircle, Info, Eye } from "lucide-react";

const kpi = [
  { title: "Total",    value: "48", accent: "#3b82f6", icon: <Bell size={22}/> },
  { title: "Unread",   value: "12", accent: "#f59e0b", icon: <AlertCircle size={22}/> },
  { title: "Alerts",   value: "6",  accent: "#f43f5e", icon: <AlertCircle size={22}/> },
  { title: "Info",     value: "30", accent: "#22c55e", icon: <Info size={22}/> },
];

const COLS = [
  { key: "notifId",  label: "ID"       },
  { key: "type",     label: "Type"     },
  { key: "title",    label: "Title"    },
  { key: "module",   label: "Module"   },
  { key: "date",     label: "Date"     },
  { key: "status",   label: "Status"   },
];

const ROWS = [
  { notifId: "NF-001", type: "Alert",   title: "Invoice INV-2003 overdue",          module: "Invoices",  date: "2026-05-06", status: "Unread" },
  { notifId: "NF-002", type: "Info",    title: "Payment TXN-005 received",          module: "Payments",  date: "2026-05-05", status: "Read"   },
  { notifId: "NF-003", type: "Alert",   title: "Work Order WO-003 past due date",   module: "Work Orders",date:"2026-05-04", status: "Unread" },
  { notifId: "NF-004", type: "Info",    title: "New deal DL-006 created",           module: "Deals",     date: "2026-05-04", status: "Read"   },
  { notifId: "NF-005", type: "Alert",   title: "Global payment GP-005 failed",      module: "Global Pay",date: "2026-05-05", status: "Unread" },
  { notifId: "NF-006", type: "Info",    title: "Expense EXP-003 pending approval",  module: "Expenses",  date: "2026-05-04", status: "Unread" },
  { notifId: "NF-007", type: "Info",    title: "Monthly payroll processed",         module: "Expenses",  date: "2026-05-01", status: "Read"   },
  { notifId: "NF-008", type: "Alert",   title: "Invoice INV-2007 overdue",          module: "Invoices",  date: "2026-05-03", status: "Unread" },
];

export default function FinanceNotifications() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="Notifications" size={12} />
        {kpi.map((k) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={k.icon} accentColor={k.accent} size={3} />
        ))}
      </DashGrid>

      <DataTable
        title="Notifications"
        columns={COLS}
        rows={ROWS}
        actions={[{
          icon: <Eye size={15}/>, tooltip: "View",
          variant: "ghost",
          onClick: (row) => { setSelected(row); openModal("notif-view"); },
        }]}
        size={12} pageSize={10} searchable date exportable exportFileName="finance-notifications"
        filters={[
          { title: "Type",   type: "toggle", key: "type",   options: ["Alert","Info"] },
          { title: "Status", type: "toggle", key: "status", options: ["Unread","Read"] },
          { title: "Module", type: "toggle", key: "module", options: ["Invoices","Payments","Work Orders","Deals","Global Pay","Expenses"] },
        ]}
      />

      <Modal id="notif-view" title="Notification Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Notification Info" cols={2}>
              <ModalData label="ID"     value={selected.notifId} />
              <ModalData label="Type"   value={selected.type}    />
              <ModalData label="Module" value={selected.module}  />
              <ModalData label="Date"   value={selected.date}    />
              <ModalData label="Status" value={selected.status}  />
            </ModalGrid>
            <ModalGrid title="Message" cols={1}>
              <ModalData label="Title" value={selected.title} />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("notif-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
