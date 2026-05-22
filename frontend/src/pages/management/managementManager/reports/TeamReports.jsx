import {
  Grid,
  DataTable,
  GLineChart,
} from "../../../../components/shared/Common_Components";

import { teamReports } from "../reportsStore";

export default function TeamReports() {
  const totalProjects = teamReports.reduce(
    (acc, item) => acc + item.totalProjects,
    0
  );

  const totalCompleted = teamReports.reduce(
    (acc, item) => acc + item.completed,
    0
  );

  const totalDelayed = teamReports.reduce(
    (acc, item) => acc + item.delayed,
    0
  );

  const chartData = teamReports.map((team) => ({
    name: team.name,
    completed: team.completed,
    delayed: team.delayed,
    inProgress: team.inProgress,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <Grid cols={12} gap={4}>
        <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            Total Projects
          </p>

          <h2 className="text-3xl font-bold text-[#2a465a] mt-2">
            {totalProjects}
          </h2>
        </div>

        <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            Completed Projects
          </p>

          <h2 className="text-3xl font-bold text-emerald-600 mt-2">
            {totalCompleted}
          </h2>
        </div>

        <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            Delayed Projects
          </p>

          <h2 className="text-3xl font-bold text-red-500 mt-2">
            {totalDelayed}
          </h2>
        </div>
      </Grid>

      {/* Charts */}
      <Grid cols={12} gap={6}>
        <GLineChart
          data={chartData}
          lines={[
            {
              key: "completed",
              label: "Completed",
              color: "#10b981",
            },
            {
              key: "inProgress",
              label: "In Progress",
              color: "#f59e0b",
            },
            {
              key: "delayed",
              label: "Delayed",
              color: "#ef4444",
            },
          ]}
          title="Team Performance Analytics"
          height={320}
          size={12}
        />

        <GLineChart
          data={chartData}
          lines={[
            {
              key: "completed",
              label: "Completion Trend",
              color: "#2563eb",
            },
          ]}
          title="Completed Projects by Team"
          height={300}
          size={6}
        />

        <GLineChart
          data={chartData}
          lines={[
            {
              key: "delayed",
              label: "Delay Trend",
              color: "#dc2626",
            },
          ]}
          title="Delayed Projects by Team"
          height={300}
          size={6}
        />
      </Grid>

      {/* Data Table */}
      <Grid cols={12} gap={4}>
        <DataTable
          title="Team Performance Report"
          columns={[
            { key: "id", label: "Team Leader ID" },
            { key: "name", label: "Team Leader Name" },
            { key: "totalProjects", label: "Total Projects" },
            { key: "completed", label: "Completed" },
            { key: "inProgress", label: "In Progress" },
            { key: "delayed", label: "Delayed" },
          ]}
          rows={teamReports}
          size={12}
          pageSize={10}
          searchable
          exportable
          exportFileName="team_reports_export"
        />
      </Grid>
    </div>
  );
}