// communicationStore.js — dummy data for Communication pages

// Team and executive reference data
export const TEAMS = [
  { id: "T1", name: "Team Alpha",  leader: "Ankit Verma"  },
  { id: "T2", name: "Team Beta",   leader: "Sonal Gupta"  },
  { id: "T3", name: "Team Gamma",  leader: "Nisha Patel"  },
];

export const TEAM_LEADERS = [
  "Ankit Verma",
  "Sonal Gupta",
  "Nisha Patel",
];

export const EXECUTIVES = [
  "Rahul Sharma",
  "Priya Mehta",
  "Arjun Kapoor",
  "Sneha Rajput",
  "Vikram Tiwari",
  "Kavya Patel",
];

// Compute status: Active if expiry is today or future, Expired otherwise
const today = new Date().toISOString().slice(0, 10);
const computeStatus = (expiryDate) =>
  !expiryDate || expiryDate >= today ? "Active" : "Expired";

export const initialAnnouncements = [
  {
    id: "ANN-001",
    title: "Q2 Sales Target Announcement",
    type: "Announcement",
    audience: "All",
    audienceDetail: "",
    sentDate: "2026-04-28",
    expiryDate: "2026-06-30",
    body: "Team, Q2 targets have been revised. Please review the updated targets in the Performance tab.",
    status: computeStatus("2026-06-30"),
  },
  {
    id: "ANN-002",
    title: "Warning: Low Call Count — Team Beta",
    type: "Warning",
    audience: "Team",
    audienceDetail: "Team Beta",
    sentDate: "2026-04-30",
    expiryDate: "2026-05-10",
    body: "Team Beta has shown below-average call counts this week. Improvement expected by end of week.",
    status: computeStatus("2026-05-10"),
  },
  {
    id: "ANN-003",
    title: "Appreciation: Top Performers",
    type: "Appreciation",
    audience: "Executive",
    audienceDetail: "Rahul Sharma",
    sentDate: "2026-05-01",
    expiryDate: "2026-05-31",
    body: "Congratulations to Rahul Sharma for achieving 100%+ of their monthly targets!",
    status: computeStatus("2026-05-31"),
  },
  {
    id: "ANN-004",
    title: "System Maintenance Notice",
    type: "Announcement",
    audience: "All",
    audienceDetail: "",
    sentDate: "2026-05-02",
    expiryDate: "2026-05-06",
    body: "CRM system will be down for maintenance on May 5, 2026 from 11 PM to 2 AM.",
    status: computeStatus("2026-05-06"),
  },
  {
    id: "ANN-005",
    title: "New Lead Assignment Policy",
    type: "Announcement",
    audience: "Team Leaders",
    audienceDetail: "",
    sentDate: "2026-05-03",
    expiryDate: "2026-07-01",
    body: "All team leaders must review and approve lead assignments before distribution to executives.",
    status: computeStatus("2026-07-01"),
  },
];
