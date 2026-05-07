import {
  DashGrid, DashCard, Heading, HeadingForDataTable,
  GLineChart, GColumnChart, GDoughnutChart, GPieChart,
  DataTable,
} from "../../components/shared/Common_Components";
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Receipt, FileText, CheckCircle,
} from "lucide-react";

// ── Dummy Data ────────────────────────────────────────────────────────────────
const revenueVsExpense = [
  { name: "Jan", Revenue: 52, Expense: 21 },
  { name: "Feb", Revenue: 48, Expense: 19.5 },
  { name: "Mar", Revenue: 61, Expense: 24 },
  { name: "Apr", Revenue: 57, Expense: 22 },
  { name: "May", Revenue: 69, Expense: 26 },
  { name: "Jun", Revenue: 73, Expense: 28 },
  { name: "Jul", Revenue: 65, Expense: 25 },
];

const monthlyRevenue = [
  { name: "Jan", Revenue: 52 },
  { name: "Feb", Revenue: 48 },
  { name: "Mar", Revenue: 61 },
  { name: "Apr", Revenue: 57 },
  { name: "May", Revenue: 69 },
  { name: "Jun", Revenue: 73 },
  { name: "Jul", Revenue: 65 },
];

const paymentStatusData = [
  { name: "Successful", value: 142 },
  { name: "Pending",    value: 38  },
  { name: "Failed",     value: 12  },
  { name: "Partial",    value: 24  },
];

const expenseCategoryData = [
  { name: "Operations",    value: 38 },
  { name: "Marketing",     value: 15 },
  { name: "Salaries",      value: 52 },
  { name: "Technology",    value: 9  },
  { name: "Miscellaneous", value: 4.5},
];

const recentPayments = [
  { id: "PAY-001", client: "Arjun Mehta", amount: "₹45,000", method: "UPI", status: "Successful", date: "2025-07-10" },
  { id: "PAY-002", client: "Priya Sharma", amount: "₹82,500", method: "Net Banking", status: "Pending", date: "2025-07-11" },
  { id: "PAY-003", client: "Rohan Gupta", amount: "₹30,000", method: "Card", status: "Successful", date: "2025-07-12" },
  { id: "PAY-004", client: "Sneha Patil", amount: "₹60,000", method: "UPI", status: "Failed", date: "2025-07-12" },
  { id: "PAY-005", client: "Kavya Nair", amount: "₹1,20,000", method: "Net Banking", status: "Successful", date: "2025-07-13" },
];

const recentInvoices = [
  { id: "INV-2025-001", client: "Arjun Mehta", amount: "₹45,000", gst: "₹8,100", total: "₹53,100", status: "Paid", date: "2025-07-08" },
  { id: "INV-2025-002", client: "Priya Sharma", amount: "₹82,500", gst: "₹14,850", total: "₹97,350", status: "Unpaid", date: "2025-07-09" },
  { id: "INV-2025-003", client: "Rohan Gupta", amount: "₹30,000", gst: "₹5,400", total: "₹35,400", status: "Paid", date: "2025-07-10" },
  { id: "INV-2025-004", client: "TechNova Pvt Ltd", amount: "₹2,50,000", gst: "₹45,000", total: "₹2,95,000", status: "Pending", date: "2025-07-11" },
  { id: "INV-2025-005", client: "Kavya Nair", amount: "₹1,20,000", gst: "₹21,600", total: "₹1,41,600", status: "Paid", date: "2025-07-12" },
];

const paymentColumns = [
  { key: "id", label: "Payment ID" },
  { key: "client", label: "Client Name" },
  { key: "amount", label: "Amount" },
  { key: "method", label: "Method" },
  {
    key: "status", label: "Status", render: (val) => {
      const color = val === "Successful" ? "bg-emerald-100 text-emerald-700" : val === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
      return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{val}</span>;
    }
  },
  { key: "date", label: "Date" },
];

const invoiceColumns = [
  { key: "id", label: "Invoice ID" },
  { key: "client", label: "Client Name" },
  { key: "amount", label: "Amount" },
  { key: "gst", label: "GST" },
  { key: "total", label: "Total" },
  {
    key: "status", label: "Status", render: (val) => {
      const color = val === "Paid" ? "bg-emerald-100 text-emerald-700" : val === "Unpaid" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
      return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{val}</span>;
    }
  },
  { key: "date", label: "Date" },
];

export default function FinanceDashboard() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="Dashboard" size={12} />
      </DashGrid>

      {/* KPI Cards */}
      <DashGrid cols={12} gap={4}>
        <DashCard title="Total Revenue" value="₹48.5L" icon={<DollarSign size={22} />} accentColor="#22c55e" size={3} />
        <DashCard title="Today Revenue" value="₹1.2L" icon={<TrendingUp size={22} />} accentColor="#3b82f6" size={3} />
        <DashCard title="Pending Payments" value="38" icon={<AlertCircle size={22} />} accentColor="#f59e0b" size={3} />
        <DashCard title="Failed Payments" value="12" icon={<TrendingDown size={22} />} accentColor="#f43f5e" size={3} />
        <DashCard title="Total Expenses" value="₹11.85L" icon={<Receipt size={22} />} accentColor="#8b5cf6" size={3} />
        <DashCard title="Net Profit" value="₹36.65L" icon={<TrendingUp size={22} />} accentColor="#14b8a6" size={3} />
        <DashCard title="Total Invoices" value="216" icon={<FileText size={22} />} accentColor="#38bdf8" size={3} />
        <DashCard title="Work Orders Signed" value="84" icon={<CheckCircle size={22} />} accentColor="#22c55e" size={3} />
      </DashGrid>

      {/* Charts */}
      <DashGrid cols={12} gap={4}>
        <GLineChart
          title="Revenue vs Expense"
          subtitle="Monthly comparison (₹ Lakhs)"
          data={revenueVsExpense}
          lines={[
            { key: "Revenue", color: "#22c55e", label: "Revenue (L)" },
            { key: "Expense", color: "#f43f5e", label: "Expense (L)" },
          ]}
          size={8}
        />
        <GDoughnutChart
          title="Payment Status"
          subtitle="Distribution by status"
          data={paymentStatusData}
          size={4}
        />
        <GColumnChart
          title="Monthly Revenue"
          subtitle="Revenue trend this year (₹ Lakhs)"
          data={monthlyRevenue}
          bars={[{ key: "Revenue", color: "#3b82f6", label: "Revenue (L)" }]}
          size={6}
        />
        <GPieChart
          title="Expense by Category"
          subtitle="Category-wise expense split"
          data={expenseCategoryData}
          size={6}
        />
      </DashGrid>

      {/* Recent Tables */}
      <DashGrid cols={12} gap={4}>
        <div className="col-span-12">
          <HeadingForDataTable primaryText="Recent" secondaryText="Payments" />
        </div>
        <div className="col-span-12">
          <DataTable
            columns={paymentColumns}
            rows={recentPayments}
            pageSize={5}
          />
        </div>
        <div className="col-span-12 mt-4">
          <HeadingForDataTable primaryText="Recent" secondaryText="Invoices" />
        </div>
        <div className="col-span-12">
          <DataTable
            columns={invoiceColumns}
            rows={recentInvoices}
            pageSize={5}
          />
        </div>
      </DashGrid>
    </div>
  );
}