import {
  Grid,
  DashGrid,
  DashCard,
  GColumnChart,
  GLineChart,
} from "../../../../components/shared/Common_Components";

import {
  deliveryMetrics,
  monthlyDeliveryData,
} from "../reportsStore";

import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  QrCode,
} from "lucide-react";

export default function DeliveryReports() {
  const chartData = monthlyDeliveryData.map((d) => ({
    name: d.month,
    delivered: d.delivered,
    delayed: d.delayed ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">

      <Grid cols={12} gap={4}>
        <DashGrid cols={12} gap={8}>

          <DashCard
            title="Total Delivered"
            value={deliveryMetrics.totalDelivered}
            icon={<CheckCircle size={20} />}
            accentColor="#10b981"
            size={12}
          />

          <DashCard
            title="On-Time Delivery %"
            value={`${deliveryMetrics.onTimePercentage.toFixed(1)}%`}
            icon={<TrendingUp size={20} />}
            accentColor="#3b82f6"
            size={12}
          />

          <DashCard
            title="Delayed Deliveries"
            value={deliveryMetrics.delayedDelivered}
            icon={<AlertCircle size={20} />}
            accentColor="#ef4444"
            size={12}
          />

          <DashCard
            title="Avg Delay Days"
            value={deliveryMetrics.avgDelayDays}
            icon={<AlertCircle size={20} />}
            accentColor="#f59e0b"
            size={12}
          />

        </DashGrid>
      </Grid>

      <Grid cols={12} gap={6}>
        <GColumnChart
          data={chartData}
          bars={[
            { key: "delivered", label: "Delivered", color: "#10b981" },
            { key: "delayed", label: "Delayed", color: "#ef4444" },
          ]}
          title="Monthly Delivery Trend"
          height={260}
          size={12}
        />

        <GLineChart
          data={chartData}
          lines={[
            { key: "delivered", label: "Delivery Growth", color: "#2563eb" },
          ]}
          title="Delivery Growth Analysis"
          height={300}
          size={6}
        />

        <GLineChart
          data={chartData}
          lines={[
            { key: "delayed", label: "Delay Trend Analysis", color: "#dc2626" },
          ]}
          title="Delay Trend Analysis"
          height={300}
          size={6}
        />
      </Grid>

    </div>
  );
}