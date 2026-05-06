import { teamExecutives, currentTL } from "../teamLeaderStore";

export { teamExecutives, currentTL };

export const attendanceRecords = [
  { id: 1, name: "Rahul Sharma",  date: "2025-05-06", status: "Present",  clockIn: "09:02", clockOut: "18:05" },
  { id: 2, name: "Priya Mehta",   date: "2025-05-06", status: "Present",  clockIn: "09:10", clockOut: "18:00" },
  { id: 3, name: "Arjun Kapoor",  date: "2025-05-06", status: "Absent",   clockIn: "-",     clockOut: "-" },
  { id: 4, name: "Sneha Rajput",  date: "2025-05-06", status: "Present",  clockIn: "08:55", clockOut: "17:50" },
  { id: 5, name: "Vikram Tiwari", date: "2025-05-06", status: "On Leave", clockIn: "-",     clockOut: "-" },
  { id: 6, name: "Kavya Patel",   date: "2025-05-06", status: "Late",     clockIn: "10:30", clockOut: "18:10" },
];

export const leaveRequests = [
  { id: 1, name: "Vikram Tiwari", type: "Sick Leave",   from: "2025-05-06", to: "2025-05-08", reason: "Fever",         status: "Pending" },
  { id: 2, name: "Priya Mehta",   type: "Casual Leave", from: "2025-05-10", to: "2025-05-10", reason: "Personal work", status: "Pending" },
  { id: 3, name: "Arjun Kapoor",  type: "Sick Leave",   from: "2025-05-07", to: "2025-05-07", reason: "Doctor visit",  status: "Pending" },
];