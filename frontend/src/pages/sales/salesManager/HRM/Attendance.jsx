import { useState, useEffect } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalProfile, ModalGrid, Button,
} from "../../../../components/shared/Common_Components";
import SessionTimer from "../../../../components/shared/SessionTimer";
import { kpiAttendance, attendanceRows } from "./HrmStore";
import { Users, UserCheck, UserX, Clock, Calendar, Eye } from "lucide-react";
import { useAttendance } from "../../../../context/AttendanceContext";
import { hrmService } from "../../../../services/hrmService";

const KPI_ICONS = [<Users size={22} />, <UserCheck size={22} />, <UserX size={22} />, <Calendar size={22} />, <Clock size={22} />];
const KPI_ACCENTS = ["#3b82f6", "#22c55e", "#f43f5e", "#f59e0b", "#8b5cf6"];

const COLS = [
  { key: "name", label: "Employee" },
  { key: "role", label: "Role" },
  { key: "teamLeader", label: "Team Leader" },
  { key: "date", label: "Date" },
  { key: "clockIn", label: "Clock In" },
  { key: "clockOut", label: "Clock Out" },
  { key: "hours", label: "Hours" },
  { key: "status", label: "Status" },
];

// ── Bridge: SessionTimer ← AttendanceContext (shared with Navbar) ────────────
function AttendanceWidget() {
  const ctx = useAttendance();
  return (
    <SessionTimer
      label="Today's Attendance"
      targetSeconds={8 * 60 * 60}
      {...ctx}
      onCheckIn={ctx.checkIn}
      onPause={ctx.pause}
      onResume={ctx.resume}
      onCheckOut={ctx.checkOut}
    />
  );
}


// ── Main Attendance Page ──────────────────────────────────────────────────────
export default function Attendance() {
  const [selected, setSelected] = useState(null);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await hrmService.getTeamAttendance();
      if (res.success) {
        const mapped = res.data.map(u => {
          const att = u.attendance;
          let status = "Absent";
          if (att) {
            if (att.clockIn) status = "Present";
          }

          const formatTime = (date) => {
             if (!date) return "—";
             const d = new Date(date);
             return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          };

          return {
            id: u.id,
            name: u.name,
            role: u.role?.replace('SALES_', '').replace('_', ' '),
            teamLeader: u.teamLeader,
            date: new Date().toLocaleDateString(),
            clockIn: formatTime(att?.clockIn),
            clockOut: formatTime(att?.clockOut),
            hours: att?.hoursWorked ? `${att.hoursWorked}h` : "—",
            status: status,
            raw: u
          };
        });
        setTeamAttendance(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch team attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    const interval = setInterval(fetchTeam, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const handleClockOutMember = async (row) => {
    if (!window.confirm(`Are you sure you want to clock out ${row.name}?`)) return;
    try {
      const res = await hrmService.clockOut(row.id);
      if (res.success) {
        fetchTeam(); // Refresh table
      }
    } catch (err) {
      console.error("Failed to clock out member:", err);
    }
  };

  const present = teamAttendance.filter(r => r.status === "Present").length;
  const absent  = teamAttendance.filter(r => r.status === "Absent").length;
  
  const kpis = [
    { title: "Total Employees", value: String(teamAttendance.length) },
    { title: "Present Today",   value: String(present) },
    { title: "Absent Today",    value: String(absent) },
    { title: "On Leave",        value: "0" }, // Mock for now
    { title: "Avg Performance", value: "92%" },
  ];

  const teamLeaders = [...new Set(teamAttendance.map(r => r.teamLeader).filter(t => t !== "Self"))];

  return (
    <div className="flex flex-col gap-6">

      {/* KPI cards */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="HRM" secondaryText="Attendance" size={12} />
        {kpis.map((k, i) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={KPI_ICONS[i]} accentColor={KPI_ACCENTS[i]} size={3} />
        ))}
      </DashGrid>

      {/* ── Check In / Out Widget ── */}
      <AttendanceWidget />

      {/* ── Attendance Table ── */}
      <DataTable
        title="Attendance Records"
        userProfile="name"
        columns={COLS}
        rows={teamAttendance}
        loading={loading}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Details",
            variant: "ghost",
            onClick: (row) => { setSelected(row); openModal("att-view-modal"); },
          },
          {
            icon: <UserX size={15} />,
            tooltip: "Force Clock Out",
            variant: "danger",
            onClick: handleClockOutMember,
          },
        ]}
        size={12}
        pageSize={10}
        searchable
        onDateFilter={true}
        date
        exportable
        exportFileName="attendance-report"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Present", "Active", "Absent", "Leave"] },
          { title: "Role", type: "toggle", key: "role", options: ["Executive", "Team Leader"] },
          { title: "Team Leader", type: "select", key: "teamLeader", options: teamLeaders },
        ]}
      />

      {/* View modal */}
      <Modal id="att-view-modal" title="Attendance Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selected.name}
              subtitle={`${selected.role} · ${selected.teamLeader}`}
              meta={`Date: ${selected.date}`}
            />
            <ModalGrid title="Attendance Info" cols={2}>
              <ModalData label="Clock In" value={selected.clockIn} />
              <ModalData label="Clock Out" value={selected.clockOut} />
              <ModalData label="Working Hours" value={selected.hours} />
              <ModalData label="Attendance %" value={selected.attendancePct} />
              <ModalData label="Status" value={selected.status} />
              <ModalData label="Team Leader" value={selected.teamLeader} />
              <ModalData label="Role" value={selected.role} />
            </ModalGrid>
            <div className="flex justify-end pt-2">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("att-view-modal")} />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
