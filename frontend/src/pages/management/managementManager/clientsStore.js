// Clients dummy data - Packet 3
// clientsStore.js — re-exports from canonical store (TEAM_GUIDE Section 9 rule #2)
export { clientList as clients } from "../store/managementManagerStore";
export const clients = [
  {
    id: "CL-001",
    name: "Acme Corp",
    mobile: "+91 98765 43210",
    email: "contact@acmecorp.com",
    driveLink: "https://drive.google.com/drive/folders/acme-project-files",
    projectIds: ["PRJ-001", "PRJ-005"],
  },
  {
    id: "CL-002",
    name: "TechStart India",
    mobile: "+91 99123 45678",
    email: "hello@techstart.in",
    driveLink: "https://drive.google.com/drive/folders/techstart-files",
    projectIds: ["PRJ-002"],
  },
  {
    id: "CL-003",
    name: "Global Logistics Ltd",
    mobile: "+91 98234 56789",
    email: "ops@globallogistics.com",
    driveLink: "https://drive.google.com/drive/folders/global-logistics",
    projectIds: ["PRJ-003", "PRJ-008"],
  },
  {
    id: "CL-004",
    name: "Fashion Hub",
    mobile: "+91 97456 78901",
    email: "sales@fashionhub.in",
    driveLink: "https://drive.google.com/drive/folders/fashion-hub",
    projectIds: ["PRJ-004", "PRJ-009"],
  },
  {
    id: "CL-005",
    name: "HealthCare Plus",
    mobile: "+91 96789 01234",
    email: "admin@healthcareplus.org",
    driveLink: "https://drive.google.com/drive/folders/healthcare-plus",
    projectIds: ["PRJ-006", "PRJ-010"],
  },
];

export const clientKPIs = {
  totalClients: clients.length,
  activeProjects: 12,
  deliveredThisMonth: 4,
  avgProjectValue: "₹2.5L",
};