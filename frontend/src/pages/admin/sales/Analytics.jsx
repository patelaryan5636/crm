import { useState, useEffect, useCallback } from "react";
import { getAdminSalesAnalytics } from "../../../services/leadService";
import {
  IndianRupee, Handshake, TrendingUp, BarChart3, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  DashGrid, EnhancedDashCard,
  GDoughnutChart, GAreaChart, GBarChart,
} from "../../../components/shared/Common_Components";

const cardStyle = {
  background: "#f8fafc",
  border:     "1px solid #e2e8f0",
  boxShadow:  "0 4px 20px rgba(0,0,0,0.04)",
};

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await getAdminSalesAnalytics();
      setData(res?.data || null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load analytics");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <RefreshCw className="animate-spin mr-2" size={18} /> Loading analytics…
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
      <AlertCircle size={15} className="shrink-0" /> {error}
      <button onClick={load} className="ml-auto text-xs underline">Retry</button>
    </div>
  );

  const kpi           = data?.kpiData         || {};
  const revenueTrend  = data?.revenueTrend     || [];
  const sourceData    = data?.sourceData       || [];
  const funnelStages  = data?.funnelStages     || [];
  const topPerformers = data?.topPerformers    || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2a465a]">Sales Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">Live insights from your CRM data</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Total Revenue"       value={kpi.totalRevenue     || "₹0"}  icon={<IndianRupee size={22} />} accentColor="#38bdf8" size={4} />
        <EnhancedDashCard title="Revenue This Month"  value={kpi.revenueThisMonth || "₹0"}  icon={<IndianRupee size={22} />} accentColor="#22c55e" size={4} />
        <EnhancedDashCard title="Deals Won"           value={String(kpi.convertedLeads || 0)} icon={<Handshake  size={22} />} accentColor="#3b82f6" size={4} />
        <EnhancedDashCard title="Total Leads"         value={String(kpi.totalLeads || 0)}   icon={<BarChart3   size={22} />} accentColor="#8b5cf6" size={4} />
        <EnhancedDashCard title="Conversion Rate"     value={kpi.conversionRate   || "0%"}  icon={<TrendingUp  size={22} />} accentColor="#f59e0b" size={4} />
        <EnhancedDashCard title="Prospects This Month" value={String(kpi.prospectsThisMonth || 0)} icon={<TrendingUp size={22} />} accentColor="#f43f5e" size={4} />
      </DashGrid>

      {/* Revenue Trend */}
      <GAreaChart
        title="Revenue Trend (This Year)"
        subtitle="Monthly revenue in ₹ thousands"
        data={revenueTrend}
        areas={[{ key: "revenue", label: "Revenue (₹K)", color: "#2a465a" }]}
        size={12}
        height={280}
      />

      {/* Funnel + Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <div className="rounded-2xl p-6 flex flex-col" style={cardStyle}>
          <p className="text-[15px] font-bold text-[#0f172a]">Sales Funnel</p>
          <p className="text-xs text-slate-500 mt-1 mb-5">Lead-to-conversion pipeline</p>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {funnelStages.map((s, i) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#2a465a] w-20 flex-shrink-0">{s.stage}</span>
                <div className="flex-1 h-9 rounded-lg overflow-hidden bg-slate-100">
                  <div
                    className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                    style={{
                      width: `${Math.max(s.pct, 5)}%`,
                      background: `linear-gradient(135deg, ${i < 2 ? "#7AAACE" : i < 4 ? "#5a8fb5" : "#2a465a"}, ${i < 2 ? "#9CD5FF" : i < 4 ? "#7AAACE" : "#3d6880"})`,
                      minWidth: 60,
                    }}
                  >
                    <span className="text-white text-xs font-bold">{s.count}</span>
                  </div>
                </div>
                {i < funnelStages.length - 1 && s.count > 0 && (
                  <span className="text-xs font-bold text-slate-400 w-10 text-right flex-shrink-0">
                    {funnelStages[i + 1].count > 0
                      ? `${Math.round((funnelStages[i + 1].count / s.count) * 100)}%` : "—"}
                  </span>
                )}
              </div>
            ))}
            {funnelStages.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No data</p>
            )}
          </div>
        </div>

        {/* Lead Source Breakdown */}
        <div className="h-[340px] overflow-hidden">
          <GDoughnutChart
            title="Lead Source Breakdown"
            subtitle="By origin channel"
            data={sourceData.length ? sourceData : [{ name: "No Data", value: 1 }]}
            colors={["#2a465a","#7AAACE","#9CD5FF","#f59e0b","#22c55e","#8b5cf6"]}
            size={12}
            height={280}
          />
        </div>
      </div>

      {/* Top Performers */}
      <div className="rounded-2xl p-6 overflow-hidden" style={cardStyle}>
        <p className="text-[15px] font-bold text-[#0f172a]">Top Performers</p>
        <p className="text-xs text-slate-500 mt-1 mb-5">Ranked by deals converted</p>
        {topPerformers.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No conversion data yet</p>
        ) : (
          <div className="space-y-4">
            {topPerformers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  i === 0 ? "bg-amber-100 text-amber-700 ring-2 ring-amber-200"
                  : i === 1 ? "bg-slate-200 text-slate-600"
                  : i === 2 ? "bg-orange-100 text-orange-700"
                  : "bg-slate-100 text-slate-500"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-[#2a465a] truncate pr-2">{p.name}</span>
                    <span className="text-xs font-bold text-[#7AAACE]">{p.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2a465a] to-[#7AAACE] transition-all duration-500"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 flex-shrink-0 w-16 text-right">{p.deals} deals</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
