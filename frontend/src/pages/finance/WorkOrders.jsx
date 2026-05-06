import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, Button,
} from "../../components/shared/Common_Components";
import { ShoppingCart, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";

const kpi = [
  { title: "Total Orders",  value: "84",  accent: "#3b82f6", icon: <ShoppingCart size={22}/> },
  { title: "In Progress",   value: "32",  accent: "#f59e0b", icon: <Clock size={22}/> },
  { title: "Completed",     value: "46",  accent: "#22c55e", icon: <CheckCircle size={22}/> },
  { title: "Overdue",       value: "6",   accent: "#f43f5e", icon: <AlertCircle size={22}/> },
];

const COLS = [
  { key: "orderId",   label: "Order ID"   },
  { key: "client",    label: "Client"     },
  { key: "service",   label: "Service"    },
  { key: "amount",    label: "Amount"     },
  { key: "assignedTo",label: "Assigned To"},
  { key: "dueDate",   label: "Due Date"   },
  { key: "status",    label: "Status"     },
];

const ROWS = [
  { orderId: "WO-001", client: "Acme Corp",        service: "CRM Setup",        amount: "₹1,20,000", assignedTo: "Rahul M.",  dueDate: "2026-05-20", status: "In Progress" },
  { orderId: "WO-002", client: "Global Tech",       service: "API Integration",  amount: "₹85,000",   assignedTo: "Priya S.",  dueDate: "2026-05-15", status: "Completed"   },
  { orderId: "WO-003", client: "Stark Industries",  service: "Data Migration",   amount: "₹2,40,000", assignedTo: "Arjun K.",  dueDate: "2026-04-30", status: "Overdue"     },
  { orderId: "WO-004", client: "Wayne Enterprises", service: "Mobile App",       amount: "₹3,50,000", assignedTo: "Sneha R.",  dueDate: "2026-06-30", status: "In Progress" },
  { orderId: "WO-005", client: "Nexus Labs",        service: "Security Audit",   amount: "₹60,000",   assignedTo: "Vikram T.", dueDate: "2026-05-10", status: "Completed"   },
  { orderId: "WO-006", client: "FinTech Ltd",       service: "Analytics Dashboard",amount:"₹95,000",  assignedTo: "Kavya P.",  dueDate: "2026-06-15", status: "In Progress" },
];

export default function WorkOrders() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="Work Orders" size={12} />
        {kpi.map((k) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={k.icon} accentColor={k.accent} size={3} />
        ))}
      </DashGrid>

      <DataTable
        title="Work Orders"
        columns={COLS}
        rows={ROWS}
        actions={[{
          icon: <Eye size={15}/>, tooltip: "View",
          variant: "ghost",
          onClick: (row) => { setSelected(row); openModal("wo-view"); },
        }]}
        size={12} pageSize={10} searchable date exportable exportFileName="work-orders"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["In Progress","Completed","Overdue"] },
        ]}
      />

      <Modal id="wo-view" title="Work Order Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Order Info" cols={2}>
              <ModalData label="Order ID"    value={selected.orderId}    />
              <ModalData label="Client"      value={selected.client}     />
              <ModalData label="Service"     value={selected.service}    />
              <ModalData label="Amount"      value={selected.amount}     />
              <ModalData label="Assigned To" value={selected.assignedTo} />
              <ModalData label="Due Date"    value={selected.dueDate}    />
              <ModalData label="Status"      value={selected.status}     />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("wo-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
