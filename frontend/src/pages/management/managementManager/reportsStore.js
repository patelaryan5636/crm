// Reports dummy data - Packet 3

export const projectReports = [
  { date: "2026-05-01", delivered: 3, inProgress: 5, delayed: 1 },
  { date: "2026-05-02", delivered: 2, inProgress: 6, delayed: 0 },
  { date: "2026-05-03", delivered: 4, inProgress: 4, delayed: 2 },
  { date: "2026-05-04", delivered: 1, inProgress: 7, delayed: 1 },
  { date: "2026-05-05", delivered: 5, inProgress: 3, delayed: 0 },
  { date: "2026-05-06", delivered: 3, inProgress: 5, delayed: 1 },
  { date: "2026-05-07", delivered: 2, inProgress: 6, delayed: 2 },
  { date: "2026-05-08", delivered: 4, inProgress: 4, delayed: 0 },
  { date: "2026-05-09", delivered: 3, inProgress: 5, delayed: 1 },
  { date: "2026-05-10", delivered: 6, inProgress: 2, delayed: 0 },
];

export const teamReports = [
  {
    id: "TL-101",
    name: "Ravi Khanna",
    totalProjects: 12,
    completed: 8,
    inProgress: 3,
    delayed: 1,
    avgCompletionDays: 14,
    onTimePercentage: 87,
  },
  {
    id: "TL-102",
    name: "Priya Sharma",
    totalProjects: 10,
    completed: 7,
    inProgress: 2,
    delayed: 1,
    avgCompletionDays: 12,
    onTimePercentage: 90,
  },
  {
    id: "TL-103",
    name: "Amit Patel",
    totalProjects: 9,
    completed: 6,
    inProgress: 2,
    delayed: 1,
    avgCompletionDays: 15,
    onTimePercentage: 84,
  },
  {
    id: "TL-104",
    name: "Neha Singh",
    totalProjects: 8,
    completed: 6,
    inProgress: 1,
    delayed: 1,
    avgCompletionDays: 13,
    onTimePercentage: 88,
  },
];

export const deliveryMetrics = {
  totalDelivered: 27,
  onTimeDelivered: 24,
  delayedDelivered: 3,
  onTimePercentage: 88.9,
  avgDelayDays: 2.5,
};

export const monthlyDeliveryData = [
  { month: "Mar", delivered: 12, delayed: 2 },
  { month: "Apr", delivered: 15, delayed: 3 },
  { month: "May", delivered: 8, delayed: 1 },
];

export const tlReports = teamReports;

export const reportKPIs = {
  totalProjects: 39,
  completedProjects: 27,
  onTimePercentage: 88.9,
  avgCompletionDays: 13.5,
};