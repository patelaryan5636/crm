// ─── Shared constants & dummy data for the Leads section ─────────────────────
// All sub-pages import from here so data stays in one place.

export const TEAM_LEADERS = [
  { id: "TL001", name: "Rahul Mehta",  currentLeads: 1200, email: "rahul@crm.com" },
  { id: "TL002", name: "Sneha Patel",  currentLeads: 980,  email: "sneha@crm.com" },
  { id: "TL003", name: "Arjun Verma",  currentLeads: 450,  email: "arjun@crm.com" },
  { id: "TL004", name: "Priya Sharma", currentLeads: 1490, email: "priya@crm.com" },
  { id: "TL005", name: "Kabir Singh",  currentLeads: 300,  email: "kabir@crm.com" },
];

export const MAX_LEADS = 1500;

export const INITIAL_LEADS = [
  { id: "L001", name: "Amit Joshi",    mobile: "9876543210", email: "amit@gmail.com",    status: "New",       assignedTo: "Rahul Mehta", createdAt: "2025-04-01", assignedAt: "2025-04-01" },
  { id: "L002", name: "Nisha Agarwal", mobile: "9123456780", email: "nisha@yahoo.com",   status: "Follow-up", assignedTo: "Sneha Patel", createdAt: "2025-04-02", assignedAt: "2025-04-02" },
  { id: "L003", name: "Rohit Kumar",   mobile: "8765432109", email: "rohit@gmail.com",   status: "Prospect",  assignedTo: "Arjun Verma", createdAt: "2025-04-03", assignedAt: "2025-04-03" },
  { id: "L004", name: "Deepa Singh",   mobile: "7654321098", email: "deepa@outlook.com", status: "New",       assignedTo: "Unassigned",  createdAt: "2025-04-04", assignedAt: "" },
  { id: "L005", name: "Vikram Shah",   mobile: "6543210987", email: "vikram@gmail.com",  status: "Prospect",  assignedTo: "Kabir Singh", createdAt: "2025-04-05", assignedAt: "2025-04-05" },
  { id: "L006", name: "Meera Nair",    mobile: "9988776655", email: "meera@gmail.com",   status: "New",       assignedTo: "Unassigned",  createdAt: "2025-04-06", assignedAt: "" },
  { id: "L007", name: "Suresh Babu",   mobile: "8877665544", email: "suresh@gmail.com",  status: "Follow-up", assignedTo: "Rahul Mehta", createdAt: "2025-04-07", assignedAt: "2025-04-07" },
  { id: "L008", name: "Kavya Reddy",   mobile: "7766554433", email: "kavya@gmail.com",   status: "Converted", assignedTo: "Sneha Patel", createdAt: "2025-04-08", assignedAt: "2025-04-08" },
];

export const DUMMY_PROSPECTS = [
  { id: "P001", name: "Amit Joshi",   mobile: "9876543210", email: "amit@gmail.com",   service: "CRM Software",  budget: "₹50,000",   assignedTL: "Rahul Mehta", status: "Hot"  },
  { id: "P002", name: "Rohit Kumar",  mobile: "8765432109", email: "rohit@gmail.com",  service: "HR Module",     budget: "₹30,000",   assignedTL: "Arjun Verma", status: "Warm" },
  { id: "P003", name: "Vikram Shah",  mobile: "6543210987", email: "vikram@gmail.com", service: "Payroll Suite", budget: "₹80,000",   assignedTL: "Kabir Singh", status: "Cold" },
  { id: "P004", name: "Pooja Tiwari", mobile: "9871234560", email: "pooja@gmail.com",  service: "ERP System",    budget: "₹1,50,000", assignedTL: "Rahul Mehta", status: "Hot"  },
];

export const DUMMY_FOLLOWUPS = [
  { name: "Amit Joshi",    assignedTL: "Rahul Mehta", assignedExec: "Raj Patel",   followUpDate: "2025-04-28", priority: "High",   status: "Pending" },
  { name: "Nisha Agarwal", assignedTL: "Sneha Patel", assignedExec: "Priti Shah",  followUpDate: "2025-04-29", priority: "Medium", status: "Pending" },
  { name: "Rohit Kumar",   assignedTL: "Arjun Verma", assignedExec: "Sunita Roy",  followUpDate: "2025-04-30", priority: "Low",    status: "Done"    },
  { name: "Meera Nair",    assignedTL: "Rahul Mehta", assignedExec: "Raj Patel",   followUpDate: "2025-05-01", priority: "High",   status: "Pending" },
];

export const INITIAL_DUMP = [
  { id: "D001", name: "Old Lead 1", mobile: "9000000001", email: "old1@gmail.com", dumpReason: "Invalid Number", dumpedBy: "Rahul Mehta", dumpDate: "2025-03-15" },
  { id: "D002", name: "Old Lead 2", mobile: "9000000002", email: "old2@gmail.com", dumpReason: "Not Interested", dumpedBy: "Sneha Patel", dumpDate: "2025-03-18" },
  { id: "D003", name: "Old Lead 3", mobile: "9000000003", email: "old3@gmail.com", dumpReason: "Duplicate",      dumpedBy: "Arjun Verma", dumpDate: "2025-03-20" },
];

// ─── CSV row validator ────────────────────────────────────────────────────────
export function validateCSVRows(rows, existingLeads) {
  const seenMobiles  = new Set(existingLeads.map((l) => l.mobile));
  const seenEmails   = new Set(existingLeads.map((l) => l.email));
  const localMobiles = new Set();
  const localEmails  = new Set();

  return rows
    .filter((row) => row.name?.trim() || row.mobile?.trim() || row.email?.trim())
    .map((row, idx) => {
      const errors = [];
      if (!row.name?.trim()) errors.push("Name required");
      if (!/^\d{10}$/.test((row.mobile || "").trim())) errors.push("Mobile must be 10 digits");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((row.email || "").trim())) errors.push("Invalid email");
      if (seenMobiles.has(row.mobile?.trim()) || localMobiles.has(row.mobile?.trim())) errors.push("Duplicate mobile");
      if (seenEmails.has(row.email?.trim())   || localEmails.has(row.email?.trim()))   errors.push("Duplicate email");
      localMobiles.add(row.mobile?.trim());
      localEmails.add(row.email?.trim());
      return {
        _idx: idx,
        name:             row.name?.trim()   || "",
        mobile:           row.mobile?.trim() || "",
        email:            row.email?.trim()  || "",
        validationStatus: errors.length === 0 ? "Valid" : "Invalid",
        errorReason:      errors.join("; "),
        selected:         errors.length === 0,
      };
    });
}
