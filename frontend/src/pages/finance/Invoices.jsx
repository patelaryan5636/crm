import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, Button,
} from "../../components/shared/Common_Components";
import { FileText, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";

const kpi = [
  { title: "Total Invoices", value: "218",     accent: "#3b82f6", icon: <FileText size={22}/> },
  { title: "Paid",           value: "162",     accent: "#22c55e", icon: <CheckCircle size={22}/> },
  { title: "Pending",        value: "42",      accent: "#f59e0b", icon: <Clock size={22}/> },
  { title: "Overdue",        value: "14",      accent: "#f43f5e", icon: <AlertCircle size={22}/> },
];

const COLS = [
  { key: "invoiceId", label: "Invoice ID" },
  { key: "client",    label: "Client"     },
  { key: "amount",    label: "Amount"     },
  { key: "issueDate", label: "Issue Date" },
  { key: "dueDate",   label: "Due Date"   },
  { key: "status",    label: "Status"     },
];

const ROWS = [
  { invoiceId: "INV-2001", client: "Acme Corp",        amount: "₹1,20,000", issueDate: "2026-04-01", dueDate: "2026-04-30", status: "Paid"    },
  { invoiceId: "INV-2002", client: "Global Tech",       amount: "₹3,45,000", issueDate: "2026-04-05", dueDate: "2026-05-05", status: "Pending" },
  { invoiceId: "INV-2003", client: "Stark Industries",  amount: "₹89,000",   issueDate: "2026-03-15", dueDate: "2026-04-15", status: "Overdue" },
  { invoiceId: "INV-2004", client: "Wayne Enterprises", amount: "₹4,50,000", issueDate: "2026-04-10", dueDate: "2026-05-10", status: "Paid"    },
  { invoiceId: "INV-2005", client: "Oscorp",            amount: "₹2,10,000", issueDate: "2026-04-20", dueDate: "2026-05-20", status: "Pending" },
  { invoiceId: "INV-2006", client: "Nexus Labs",        amount: "₹75,000",   issueDate: "2026-04-25", dueDate: "2026-05-25", status: "Paid"    },
  { invoiceId: "INV-2007", client: "FinTech Ltd",       amount: "₹1,80,000", issueDate: "2026-03-01", dueDate: "2026-03-31", status: "Overdue" },
];

export default function Invoices() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="Invoices" size={12} />
        {kpi.map((k) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={k.icon} accentColor={k.accent} size={3} />
        ))}
      </DashGrid>

      <DataTable
        title="Invoice Records"
        columns={COLS}
        rows={ROWS}
        actions={[{
          icon: <Eye size={15}/>, tooltip: "View",
          variant: "ghost",
          onClick: (row) => { setSelected(row); openModal("inv-view"); },
        }]}
        size={12} pageSize={10} searchable date exportable exportFileName="invoices"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Paid","Pending","Overdue"] },
        ]}
      />

      <Modal id="inv-view" title="Invoice Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Invoice Info" cols={2}>
              <ModalData label="Invoice ID"  value={selected.invoiceId} />
              <ModalData label="Client"      value={selected.client}    />
              <ModalData label="Amount"      value={selected.amount}    />
              <ModalData label="Issue Date"  value={selected.issueDate} />
              <ModalData label="Due Date"    value={selected.dueDate}   />
              <ModalData label="Status"      value={selected.status}    />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("inv-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
