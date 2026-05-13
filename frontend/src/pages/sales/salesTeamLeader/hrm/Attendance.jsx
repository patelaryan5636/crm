import { useState, useEffect } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  Modal, ModalGrid, ModalData, ModalProfile, Button,
  openModal, closeModal,
} from "../../../../components/shared/Common_Components";
import SessionTimer from "../../../../components/shared/SessionTimer";
import { useAttendance } from "../../../../context/AttendanceContext";
import {
  Users, UserCheck, UserX, Palmtree, Eye,
} from "lucide-react";
import { hrmService } from "../../../../services/hrmService";
import { formatElapsed } from "../../../../context/AttendanceContext";
import { currentTL, attendanceRecords, todayAttendance, ATTENDANCE_STATUS } from "../myTeam/teamStore";

const KPI_ICONS   = [<Users size={22} />, <UserCheck size={22} />, <UserX size={22} />, <Palmtree size={22} />];
const KPI_ACCENTS = ["#3b82f6", "#22c55e", "#f43f5e", "#f59e0b"];

const COLS = [
  { key: "name",     label: "Executive" },
  { key: "date",     label: "Date" },
  { key: "clockIn",  label: "Clock In" },
  { key: "clockOut", label: "Clock Out" },
  { key: "hours",    label: "Hours" },
  { key: "status",   label: "Status" }, // auto-renders as colored badge
];

// ─── Bridge: SessionTimer ← AttendanceContext (shared with Navbar) ──────────
function MyAttendanceWidget() {
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
            date: new Date().toLocaleDateString(),
            clockIn: formatTime(att?.clockIn),
            clockOut: formatTime(att?.clockOut),
            hours: att?.hoursWorked ? `${att.hoursWorked}h` : "—",
            status: status,
            raw: u // Keep raw data for modal
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

  // ── Today's KPIs ──
  const presentCount = teamAttendance.filter((r) => r.status === "Present" || r.status === "Late").length;
  const absentCount  = teamAttendance.filter((r) => r.status === "Absent").length;
  const leaveCount   = teamAttendance.filter((r) => r.status === "Leave").length;
  const onTimeCount  = teamAttendance.filter((r) => r.status === "Present").length;

  const kpis = [
    { title: "Present Today", value: String(presentCount) }, 
    { title: "On Time",       value: String(onTimeCount)  },
    { title: "Absent Today",  value: String(absentCount)  },
    { title: "On Leave",      value: String(leaveCount)   },
  ];


  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Attendance" secondaryText={currentTL.team} size={12} />
        {kpis.map((k, i) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={KPI_ICONS[i]} accentColor={KPI_ACCENTS[i]} size={3} />
        ))}
      </DashGrid>

      {/* ── My Attendance — SessionTimer (shared with Navbar via AttendanceContext) ── */}
      <MyAttendanceWidget />

      {/* ── Team executives' attendance log ───────────────────────────────── */}
      <DataTable
        title="Team Attendance"
        columns={COLS}
        rows={teamAttendance}
        userProfile="name"
        size={12}
        pageSize={10}
        searchable
        date
        exportable
        loading={loading}
        exportFileName="team_attendance"
        filters={[
          { title: "Status",    type: "toggle", key: "status", options: ["Present", "Active", "Absent", "Leave"] },
          { title: "Executive", type: "select", key: "name",   options: [...new Set(teamAttendance.map((r) => r.name))] },
        ]}
        actions={[
          {
            icon: <Eye size={15} />, tooltip: "View Details", variant: "ghost",
            onClick: (row) => { setSelected(row); openModal("tl-hrm-att-view"); },
          },
          {
            icon: <UserX size={15} />, tooltip: "Force Clock Out", variant: "danger",
            onClick: handleClockOutMember,
          }
        ]}
      />

      {/* ── View modal ───────────────────────────────────────────────────── */}
      <Modal id="tl-hrm-att-view" title="Attendance Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selected.name}
              subtitle={`${selected.role} · ${selected.status}`}
              meta={`Date: ${selected.date}`}
            />
            <ModalGrid title="Clock" cols={2}>
              <ModalData label="Clock In"  value={selected.clockIn} />
              <ModalData label="Clock Out" value={selected.clockOut} />
              <ModalData label="Hours"     value={selected.hours} />
              <ModalData label="Status"    value={selected.status} />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="primary" size={3} onClick={() => closeModal("tl-hrm-att-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
