import { useState } from "react";
import {
  Users,
  Target,
  FolderKanban,
  IndianRupee,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Filter,
  MoreVertical,
  ArrowRight,
  Clock,
  CalendarCheck,
  AlertTriangle,
  Briefcase,
  Receipt,
  UserCheck,
  UserX,
  LogIn,
} from "lucide-react";
import {
  DashGrid,
  DashCard,
  Heading,
  GAreaChart,
} from "../../components/shared/Common_Components";

// ── Palette ──
const C = {
  navy: "#355872",
  blue: "#7AAACE",
  sea: "#9CD5FF",
  cold: "#F7F8F0",
  muted: "#94a3b8",
  subtle: "#64748b",
};

// ── Stat cards ──
const stats = [
  { title: "Total Users", value: "1,245", color: "text-blue-600" },
  { title: "Leads", value: "320", color: "text-purple-600" },
  { title: "Projects", value: "85", color: "text-orange-600" },
  { title: "Revenue", value: "₹2.5L", color: "text-green-600" },
];

function Dashboard() {
  const [financePeriod, setFinancePeriod] = useState("month");
  const [financeMonth, setFinanceMonth] = useState("");
  const activeFinance = financeMonth ? financeMonthData[financeMonth] : (financeDataMap[financePeriod] || financeDataMap.month);

  const [salesPeriod, setSalesPeriod] = useState("month");
  const [salesMonth, setSalesMonth] = useState("");
  const activeSales = salesMonth ? salesMonthData[salesMonth] : (salesDataMap[salesPeriod] || salesDataMap.month);
  const salesOffset = circumference * (1 - activeSales.pct / 100);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div
            key={item.title}
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition border"
          >
            <p className="text-gray-500 text-sm">{item.title}</p>
            <h2 className={`text-2xl font-bold mt-2 ${item.color}`}>
              {item.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
