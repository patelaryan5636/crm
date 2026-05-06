import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, Button,
} from "../../components/shared/Common_Components";
import { Globe, CheckCircle, Clock, XCircle, Eye } from "lucide-react";

const kpi = [
  { title: "Global Transactions", value: "94",     accent: "#3b82f6", icon: <Globe size={22}/> },
  { title: "Successful",          value: "78",     accent: "#22c55e", icon: <CheckCircle size={22}/> },
  { title: "Pending",             value: "12",     accent: "#f59e0b", icon: <Clock size={22}/> },
  { title: "Failed",              value: "4",      accent: "#f43f5e", icon: <XCircle size={22}/> },
];

const COLS = [
  { key: "txnId",    label: "Txn ID"    },
  { key: "client",   label: "Client"    },
  { key: "country",  label: "Country"   },
  { key: "amount",   label: "Amount"    },
  { key: "currency", label: "Currency"  },
  { key: "gateway",  label: "Gateway"   },
  { key: "date",     label: "Date"      },
  { key: "status",   label: "Status"    },
];

const ROWS = [
  { txnId: "GP-001", client: "Acme Corp",    country: "USA",       amount: "$14,500", currency: "USD", gateway: "Stripe",     date: "2026-05-01", status: "Success" },
  { txnId: "GP-002", client: "TechGlobal",   country: "UK",        amount: "£8,200",  currency: "GBP", gateway: "PayPal",     date: "2026-05-02", status: "Success" },
  { txnId: "GP-003", client: "EuroSoft",     country: "Germany",   amount: "€11,000", currency: "EUR", gateway: "Stripe",     date: "2026-05-03", status: "Pending" },
  { txnId: "GP-004", client: "AsiaTech",     country: "Singapore", amount: "S$18,000",currency: "SGD", gateway: "Razorpay",   date: "2026-05-04", status: "Success" },
  { txnId: "GP-005", client: "MidEast Corp", country: "UAE",       amount: "AED 42,000",currency:"AED",gateway: "PayTabs",    date: "2026-05-05", status: "Failed"  },
  { txnId: "GP-006", client: "CanadaCo",     country: "Canada",    amount: "C$9,800", currency: "CAD", gateway: "Stripe",     date: "2026-05-06", status: "Pending" },
  { txnId: "GP-007", client: "AusTrade",     country: "Australia", amount: "A$22,000",currency: "AUD", gateway: "PayPal",     date: "2026-05-07", status: "Success" },
];

export default function GlobalPayment() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="Global Payments" size={12} />
        {kpi.map((k) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={k.icon} accentColor={k.accent} size={3} />
        ))}
      </DashGrid>

      <DataTable
        title="Global Payment Records"
        columns={COLS}
        rows={ROWS}
        actions={[{
          icon: <Eye size={15}/>, tooltip: "View",
          variant: "ghost",
          onClick: (row) => { setSelected(row); openModal("gp-view"); },
        }]}
        size={12} pageSize={10} searchable date exportable exportFileName="global-payments"
        filters={[
          { title: "Status",   type: "toggle", key: "status",   options: ["Success","Pending","Failed"] },
          { title: "Gateway",  type: "toggle", key: "gateway",  options: ["Stripe","PayPal","Razorpay","PayTabs"] },
          { title: "Currency", type: "toggle", key: "currency", options: ["USD","GBP","EUR","SGD","AED","CAD","AUD"] },
        ]}
      />

      <Modal id="gp-view" title="Global Payment Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Transaction Info" cols={2}>
              <ModalData label="Txn ID"    value={selected.txnId}    />
              <ModalData label="Client"    value={selected.client}   />
              <ModalData label="Country"   value={selected.country}  />
              <ModalData label="Amount"    value={selected.amount}   />
              <ModalData label="Currency"  value={selected.currency} />
              <ModalData label="Gateway"   value={selected.gateway}  />
              <ModalData label="Date"      value={selected.date}     />
              <ModalData label="Status"    value={selected.status}   />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("gp-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
