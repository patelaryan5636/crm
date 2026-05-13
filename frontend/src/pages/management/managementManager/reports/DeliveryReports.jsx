import { Grid, DashGrid, DashCard, GColumnChart } from "../../../../components/shared/Common_Components";
import { deliveryMetrics, monthlyDeliveryData } from "../reportsStore";
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

export default function DeliveryReports() {
  const chartData = {
    labels: monthlyDeliveryData.map((d) => d.month),
    datasets: [
      {
        label: "On-Time Delivered",
        data: monthlyDeliveryData.map((d) => d.delivered),
        backgroundColor: "#10b981",
      },
      {
        label: "Delayed Delivered",
        data: monthlyDeliveryData.map((d) => d.delayed),
        backgroundColor: "#ef4444",
      },
    ],
  };

  return (
    <Grid cols={12} gap={4}>
      {/* KPI Cards */}
      <DashGrid cols={12} gap={4}>
        <DashCard
          title="Total Delivered"
          value={deliveryMetrics.totalDelivered}
          icon={<CheckCircle size={20} />}
          accentColor="#10b981"
          size={2}
        />
        <DashCard
          title="On-Time Delivery %"
          value={`${deliveryMetrics.onTimePercentage.toFixed(1)}%`}
          icon={<TrendingUp size={20} />}
          accentColor="#3b82f6"
          size={2}
        />
        <DashCard
          title="Delayed Deliveries"
          value={deliveryMetrics.delayedDelivered}
          icon={<AlertCircle size={20} />}
          accentColor="#ef4444"
          size={2}
        />
        <DashCard
          title="Avg Delay Days"
          value={deliveryMetrics.avgDelayDays}
          icon={<AlertCircle size={20} />}
          accentColor="#f59e0b"
          size={2}
        />
      </DashGrid>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 col-span-12">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Monthly Delivery Trend
        </h2>
        <GColumnChart data={chartData} height={300} />
      </div>
    </Grid>
  );
}