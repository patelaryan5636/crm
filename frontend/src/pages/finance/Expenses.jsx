import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, Button,
  GDoughnutChart,
} from "../../components/shared/Common_Components";
import { Receipt, TrendingDown, CheckCircle, Clock, Eye } from "lucide-react";

const kpi = [
  { title: "Total Expenses",  value: "₹18.6L", accent: "#f43f5e", icon: <TrendingDown size={22}/> },
  { title: "This Month",      value: "₹3.8L",  accent: "#f59e0b", icon: <Receipt size={22}/> },
  { title: "Approved",        value: "142",     accent: "#22c55e", icon: <CheckCircle size={22}/> },
  { title: "Pending Approval",value: "18",      accent: "#3b82f6", icon: <Clock size={22}/> },
];

const categoryData = [
  { name: "Salaries",   value: 44 },
  { name: "Operations", value: 18 },
  { name: "Marketing",  value: 11 },
  { name: "Infra",      value: 10 },
  { name: "Misc",       value: 6  },
  { name: "Travel",     value: 11 },
];
const categoryColors = ["#3b82f6","#8b5cf6","#f59e0b","#14b8a6","#f43f5e","#22c55e"];

const COLS = [
  { key: "expId",    label: "Exp ID"    },
  { key: "category", label: "Category"  },
  { key: "amount",   label: "Amount"    },
  { key: "paidBy",   label: "Paid By"   },
  { key: "date",     label: "Date"      },
  { key: "notes",    label: "Notes"     },
  { key: "status",   label: "Status"    },
];

const ROWS = [
  { expId: "EXP-001", category: "Salaries",   amount: "₹8,20,000", paidBy: "Finance Dept", date: "2026-05-01", notes: "Monthly payroll",          status: "Approved" },
  { expId: "EXP-002", category: "Marketing",  amount: "₹45,000",   paidBy: "Rahul M.",     date: "2026-05-03", notes: "Ad campaign — May",         status: "Approved" },
  { expId: "EXP-003", category: "Infra",      amount: "₹1,20,000", paidBy: "IT Dept",      date: "2026-05-04", notes: "Server upgrade",            status: "Pending"  },
  { expId: "EXP-004", category: "Travel",     amount: "₹28,000",   paidBy: "Priya S.",     date: "2026-05-05", notes: "Client visit — Bangalore",  status: "Approved" },
  { expId: "EXP-005", category: "Operations", amount: "₹62,000",   paidBy: "Ops Team",     date: "2026-05-06", notes: "Office supplies & utilities",status: "Approved" },
  { expId: "EXP-006", category: "Misc",       amount: "₹15,000",   paidBy: "Admin",        date: "2026-05-07", notes: "Miscellaneous",             status: "Pending"  },
];

export default function Expenses() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="Expenses" size={12} />
        {kpi.map((k) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={k.icon} accentColor={k.accent} size={3} />
        ))}
      </DashGrid>

      <DashGrid cols={12} gap={4}>
        <GDoughnutChart
          title="Expense by Category"
          subtitle="Current period breakdown"
          data={categoryData}
          colors={categoryColors}
          size={4} height={280}
        />
        <DataTable
          title="Expense Records"
          columns={COLS}
          rows={ROWS}
          actions={[{
            icon: <Eye size={15}/>, tooltip: "View",
            variant: "ghost",
            onClick: (row) => { setSelected(row); openModal("exp-view"); },
          }]}
          size={8} pageSize={6} searchable date exportable exportFileName="expenses"
          filters={[
            { title: "Status",   type: "toggle", key: "status",   options: ["Approved","Pending"] },
            { title: "Category", type: "toggle", key: "category", options: ["Salaries","Marketing","Infra","Travel","Operations","Misc"] },
          ]}
        />
      </DashGrid>

      <Modal id="exp-view" title="Expense Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Expense Info" cols={2}>
              <ModalData label="Exp ID"    value={selected.expId}    />
              <ModalData label="Category"  value={selected.category} />
              <ModalData label="Amount"    value={selected.amount}   />
              <ModalData label="Paid By"   value={selected.paidBy}   />
              <ModalData label="Date"      value={selected.date}     />
              <ModalData label="Status"    value={selected.status}   />
            </ModalGrid>
            <ModalGrid title="Notes" cols={1}>
              <ModalData label="Description" value={selected.notes} />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("exp-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
