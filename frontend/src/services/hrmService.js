// hrmService.js — API layer for HRM module
// Replace delay() + mock data with real fetch() calls when backend is ready.

export const MOCK_ATTENDANCE = [
  { date: "2026-05-01", day: "Fri", checkIn: "09:02", checkOut: "18:05", hours: "9h 03m", status: "Present" },
  { date: "2026-05-04", day: "Mon", checkIn: "09:45", checkOut: "18:10", hours: "8h 25m", status: "Late"    },
  { date: "2026-05-05", day: "Tue", checkIn: "08:58", checkOut: "18:00", hours: "9h 02m", status: "Present" },
  { date: "2026-05-06", day: "Wed", checkIn: "09:01", checkOut: "18:03", hours: "9h 02m", status: "Present" },
  { date: "2026-05-07", day: "Thu", checkIn: "-",     checkOut: "-",     hours: "-",      status: "Absent"  },
  { date: "2026-05-08", day: "Fri", checkIn: "09:00", checkOut: "18:00", hours: "9h 00m", status: "Present" },
  { date: "2026-05-13", day: "Wed", checkIn: "-",     checkOut: "-",     hours: "-",      status: "Leave"   },
];

export const MOCK_LEAVES_INIT = [
  { id: 1, type: "Sick",   from: "2026-05-13", to: "2026-05-14", days: 2, reason: "Fever and rest.",     status: "Approved" },
  { id: 2, type: "Casual", from: "2026-04-10", to: "2026-04-10", days: 1, reason: "Personal work.",      status: "Approved" },
  { id: 3, type: "Paid",   from: "2026-03-20", to: "2026-03-22", days: 3, reason: "Family function.",    status: "Rejected" },
  { id: 4, type: "Sick",   from: "2026-06-02", to: "2026-06-02", days: 1, reason: "Doctor appointment.", status: "Pending"  },
];

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export const hrmService = {
  // GET /hrm/summary
  async getSummary() {
    await delay();
    return {
      success: true,
      data: {
        totalWorkingDays: MOCK_ATTENDANCE.filter(r => !["Weekend","Holiday"].includes(r.status)).length,
        presentDays:      MOCK_ATTENDANCE.filter(r => r.status === "Present").length,
        absentDays:       MOCK_ATTENDANCE.filter(r => r.status === "Absent").length,
        monthLabel:       "May 2026",
      },
    };
  },

  // GET /hrm/attendance
  async getAttendance() {
    await delay();
    return { success: true, data: MOCK_ATTENDANCE };
  },

  // GET /hrm/leaves
  async getLeaves() {
    await delay();
    return { success: true, data: MOCK_LEAVES_INIT };
  },

  // POST /hrm/leaves
  async applyLeave(payload) {
    await delay(900);
    // Replace with: const res = await fetch("/api/leaves", { method: "POST", body: JSON.stringify(payload) });
    return { success: true, data: { ...payload, id: Date.now(), status: "Pending" } };
  },

  // POST /hrm/attendance/clock-in
  async clockIn() {
    await delay(600);
    return { success: true, data: { time: new Date().toISOString() } };
  },

  // POST /hrm/attendance/clock-out
  async clockOut() {
    await delay(600);
    return { success: true, data: { time: new Date().toISOString() } };
  },

  // POST /hrm/attendance/auto-mark  (called on login)
  async autoMarkAttendance() {
    await delay(200);
    const today = new Date().toISOString().slice(0, 10);
    const record = MOCK_ATTENDANCE.find(r => r.date === today);
    return { success: true, data: { status: record?.status ?? null, record } };
  },
};
