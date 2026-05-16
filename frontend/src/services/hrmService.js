import apiClient from './apiClient';

// --- Temporary Mock Data (used by some components for initial state) ---
export const MOCK_ATTENDANCE = [
  { id: "AV", employee: "Ankit Verma", role: "Team Leader", teamLeader: "Self", date: "2026-05-03", day: "Sun", checkIn: "08:55", checkOut: "—", hours: "4h 45m", status: "Present", attendancePct: "97%" },
  { id: "AK", employee: "Arjun Kapoor", role: "Executive", teamLeader: "Ankit Verma", date: "2026-05-03", day: "Sun", checkIn: "09:45", checkOut: "—", hours: "6h 30m", status: "Late", attendancePct: "76%" },
  { id: "DN", employee: "Divya Nair", role: "Executive", teamLeader: "Ankit Verma", date: "2026-05-03", day: "Sun", checkIn: "—", checkOut: "—", hours: "—", status: "Absent", attendancePct: "55%" },
  { id: "KP", employee: "Kavya Patel", role: "Executive", teamLeader: "Ankit Verma", date: "2026-05-03", day: "Sun", checkIn: "10:00", checkOut: "—", hours: "3h 20m", status: "Late", attendancePct: "58%" },
  { id: "MJ", employee: "Mohit Joshi", role: "Executive", teamLeader: "Ankit Verma", date: "2026-05-03", day: "Sun", checkIn: "09:30", checkOut: "18:30", hours: "9h 00m", status: "Present", attendancePct: "90%" },
  { id: "NP", employee: "Nisha Patel", role: "Team Leader", teamLeader: "Self", date: "2026-05-03", day: "Sun", checkIn: "08:50", checkOut: "—", hours: "5h 10m", status: "Present", attendancePct: "93%" },
  { id: "PM", employee: "Priya Mehta", role: "Executive", teamLeader: "Nisha Patel", date: "2026-05-03", day: "Sun", checkIn: "09:15", checkOut: "18:00", hours: "8h 45m", status: "Present", attendancePct: "88%" },
  { id: "RS", employee: "Rahul Sharma", role: "Executive", teamLeader: "Nisha Patel", date: "2026-05-03", day: "Sun", checkIn: "09:02", checkOut: "18:05", hours: "9h 03m", status: "Present", attendancePct: "94%" },
  { id: "SR", employee: "Sneha Rajput", role: "Executive", teamLeader: "Nisha Patel", date: "2026-05-03", day: "Sun", checkIn: "—", checkOut: "—", hours: "—", status: "Absent", attendancePct: "62%" },
  { id: "SG", employee: "Sonal Gupta", role: "Team Leader", teamLeader: "Self", date: "2026-05-03", day: "Sun", checkIn: "09:00", checkOut: "18:00", hours: "9h 00m", status: "Present", attendancePct: "95%" },
];

export const MOCK_LEAVES_INIT = [
  { id: 1, type: "Sick", from: "2026-05-13", to: "2026-05-14", days: 2, reason: "Fever and rest.", status: "Approved" },
  { id: 2, type: "Casual", from: "2026-04-10", to: "2026-04-10", days: 1, reason: "Personal work.", status: "Approved" },
  { id: 3, type: "Paid", from: "2026-03-20", to: "2026-03-22", days: 3, reason: "Family function.", status: "Rejected" },
  { id: 4, type: "Sick", from: "2026-06-02", to: "2026-06-02", days: 1, reason: "Doctor appointment.", status: "Pending" },
];

export const hrmService = {
  // GET /hrm/summary
  async getSummary() {
    // This might still be mock or need a real endpoint if available
    const response = await apiClient.get('/attendance/today');
    return response.data;
  },

  // GET /hrm/attendance
  async getAttendance() {
    const response = await apiClient.get('/attendance/today');
    return response.data;
  },

  // GET /hrm/leaves
  async getLeaves() {
    // Assuming there's a leaves endpoint
    const response = await apiClient.get('/leaves');
    return response.data;
  },

  // POST /hrm/leaves
  async applyLeave(payload) {
    const response = await apiClient.post('/leaves', payload);
    return response.data;
  },

  // POST /attendance/clock-in
  async clockIn() {
    const response = await apiClient.post('/attendance/clock-in');
    return response.data;
  },

  // POST /attendance/clock-out
  async clockOut(userId = null) {
    const response = await apiClient.post('/attendance/clock-out', { userId });
    return response.data;
  },

  // POST /attendance/break-toggle
  async toggleBreak(action) {
    const response = await apiClient.post('/attendance/break-toggle', { action });
    return response.data;
  },

  // GET /attendance/today
  async getTodayStatus() {
    const response = await apiClient.get('/attendance/today');
    return response.data;
  },

  // GET /attendance/team
  async getTeamAttendance(params = {}) {
    const response = await apiClient.get('/attendance/team', { params });
    return response.data;
  },
};


