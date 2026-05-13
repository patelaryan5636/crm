// reportsStore.js — computed from canonical store (TEAM_GUIDE Section 9)
import { projects, teamLeaders } from "./managementManagerStore";

export const teamReports = teamLeaders.map((tl) => {
  const tlProjects = projects.filter((p) => p.assignedTL === tl.id);
  const delivered  = tlProjects.filter((p) => p.status === "Delivered").length;
  const inProgress = tlProjects.filter((p) =>
    ["In Progress", "Work Started", "Review Stage", "Finalization"].includes(p.status)
  ).length;
  const delayed = tlProjects.filter((p) => p.status === "Delayed").length;

  return {
    id:            tl.id,
    name:          tl.name,
    totalProjects: tlProjects.length,
    completed:     delivered,
    inProgress,
    delayed,
  };
});

export const tlReports = teamReports;

export const deliveryMetrics = {
  totalDelivered:   projects.filter((p) => p.status === "Delivered").length,
  onTimeDelivered:  projects.filter((p) => p.status === "Delivered" && p.handoverLink).length,
  delayedDelivered: projects.filter((p) => p.status === "Delivered" && !p.handoverLink).length,
  onTimePercentage:
    Math.round(
      (projects.filter((p) => p.status === "Delivered" && p.handoverLink).length /
        Math.max(projects.filter((p) => p.status === "Delivered").length, 1)) *
        1000
    ) / 10,
  avgDelayDays: 2.5,
};

const monthMap = {};
projects.forEach((p) => {
  if (!p.deliveredDate) return;
  const mon = new Date(p.deliveredDate).toLocaleString("en-IN", { month: "short" });
  if (!monthMap[mon]) monthMap[mon] = { month: mon, delivered: 0, delayed: 0 };
  monthMap[mon].delivered++;
});
export const monthlyDeliveryData = Object.values(monthMap);

export const reportKPIs = {
  totalProjects:     projects.length,
  completedProjects: projects.filter((p) => p.status === "Delivered").length,
  onTimePercentage:  deliveryMetrics.onTimePercentage,
  avgCompletionDays: 13.5,
};

const dailyMap = {};
projects.forEach((p) => {
  const d = p.lastUpdated;
  if (!dailyMap[d]) dailyMap[d] = { date: d, delivered: 0, inProgress: 0, delayed: 0 };
  if (p.status === "Delivered") dailyMap[d].delivered++;
  if (["In Progress", "Work Started", "Review Stage", "Finalization"].includes(p.status))
    dailyMap[d].inProgress++;
  if (p.status === "Delayed") dailyMap[d].delayed++;
});
export const projectReports = Object.values(dailyMap).sort((a, b) =>
  a.date.localeCompare(b.date)
);