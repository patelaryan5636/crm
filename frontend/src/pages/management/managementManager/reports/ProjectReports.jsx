import { Grid, GLineChart } from "../../../../components/shared/Common_Components";
import { projectReports } from "../reportsStore";

export default function ProjectReports() {
  const chartData = {
    labels: projectReports.map((p) => p.date),
    datasets: [
      {
        label: "Delivered",
        data: projectReports.map((p) => p.delivered),
        borderColor: "#10b981",
        backgroundColor: "#d1fae5",
        tension: 0.4,
      },
      {
        label: "In Progress",
        data: projectReports.map((p) => p.inProgress),
        borderColor: "#f59e0b",
        backgroundColor: "#fef3c7",
        tension: 0.4,
      },
      {
        label: "Delayed",
        data: projectReports.map((p) => p.delayed),
        borderColor: "#ef4444",
        backgroundColor: "#fee2e2",
        tension: 0.4,
      },
    ],
  };

  return (
    <Grid cols={12} gap={4}>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Daily Project Status Trend
        </h2>
        <GLineChart data={chartData} height={300} />
      </div>
    </Grid>
  );
}