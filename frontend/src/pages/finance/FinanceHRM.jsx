import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalProfile, ModalGrid, Button,
} from "../../components/shared/Common_Components";
import SessionTimer from "../../components/shared/SessionTimer";
import { useAttendance } from "../../context/AttendanceContext";
import { Users, UserCheck, Umbrella, Clock, Eye } from "lucide-react";

const kpi = [
  { title: "Total Staff",    value: "12", accent: "#3b82f6", icon: <Users size={22}/> },
  { title: "Present Today",  value: "9",  accent: "#22c55e", icon: <UserCheck size={22}/> },
  { title: "On Leave",       value: "2",  accent: "#f59e0b", icon: <Umbrella size={22}/> },
  { title: "Absent",         value: "1",  accent: "#f43f5e", icon: <Clock size={22}/> },
];

const ATT_COLS = [
  { key: "name",   label: "Name"       },
  { key: "role",   label: "Role"       },
  { key: "clockIn",label: "Clock In"   },
  { key: "clockOut",label:"Clock Out"  },
  { key: "hours",  label: "Hours"      },
  { key: "status", label: "Status"     },
];

const ATT_ROWS = [
  { name: "Finance Manager", role: "Finance Manager", clockIn: "09:00", clockOut: "18:00", hours: "9h 00m", status: "Present"  },
  { name: "Accounts Head",   role: "Accounts",        clockIn: "09:15", clockOut: "18:10", hours: "8h 55m", status: "Present"  },
  { name: "Finance Exec 1",  role: "Executive",       clockIn: "09:30", clockOut: "—",     hours: "5h 30m", status: "Working"  },
  { name: "Finance Exec 2",  role: "Executive",       clockIn: "—",     clockOut: "—",     hours: "—",      status: "Absent"   },
  { name: "Billing Exec",    role: "Executive",       clockIn: "09:45", clockOut: "18:00", hours: "8h 15m", status: "Present"  },
  { name: "Payroll Exec",    role: "Executive",       clockIn: "—",     clockOut: "—",     hours: "—",      status: "Leave"    },
];

const LEAVE_COLS = [
  { key: "name",      label: "Name"       },
  { key: "type",      label: "Leave Type" },
  { key: "from",      label: "From"       },
  { key: "to",        label: "To"         },
  { key: "days",      label: "Days"       },
  { key: "status",    label: "Status"     },
];

const LEAVE_ROWS = [
  { name: "Finance Exec 2", type: "Sick Leave",   from: "2026-05-03", to: "2026-05-04", days: 2, status: "Approved" },
  { name: "Payroll Exec",   type: "Casual Leave", from: "2026-05-03", to: "2026-05-03", days: 1, status: "Approved" },
  { name: "Accounts Head",  type: "Earned Leave", from: "2026-05-20", to: "2026-05-22", days: 3, status: "Pending"  },
];

function AttendanceWidget() {
  const ctx = useAttendance();
  return (
    <SessionTimer
      label="Today's Attendance"
      targetSeconds={8 * 60 * 60}
      status={ctx.status}
      elapsed={ctx.elapsed}
      pct={ctx.pct}
      remaining={ctx.remaining}
      checkInAt={ctx.checkInAt}
      checkOutAt={ctx.checkOutAt}
      targetReached={ctx.targetReached}
      onCheckIn={ctx.checkIn}
      onPause={ctx.pause}
      onResume={ctx.resume}
      onCheckOut={ctx.checkOut}
    />
  );
}

export default function FinanceHRM() {
  const [attSelected,   setAttSelected]   = useState(null);
  const [leaveSelected, setLeaveSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="HRM" size={12} />
        {kpi.map((k) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={k.icon} accentColor={k.accent} size={3} />
        ))}
      </DashGrid>

      {/* Attendance widget */}
      <AttendanceWidget />

      {/* Attendance table */}
      <DataTable
        title="Attendance Records"
        columns={ATT_COLS}
        rows={ATT_ROWS}
        actions={[{
          icon: <Eye size={15}/>, tooltip: "View",
          variant: "ghost",
          onClick: (row) => { setAttSelected(row); openModal("fin-att-view"); },
        }]}
        size={12} pageSize={8} searchable exportable exportFileName="finance-attendance"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Present","Working","Absent","Leave"] },
        ]}
      />

      {/* Leave table */}
      <DataTable
        title="Leave Records"
        columns={LEAVE_COLS}
        rows={LEAVE_ROWS}
        actions={[{
          icon: <Eye size={15}/>, tooltip: "View",
          variant: "ghost",
          onClick: (row) => { setLeaveSelected(row); openModal("fin-leave-view"); },
        }]}
        size={12} pageSize={5} searchable exportable exportFileName="finance-leaves"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Approved","Pending","Rejected"] },
        ]}
      />

      {/* Attendance modal */}
      <Modal id="fin-att-view" title="Attendance Details" size="md">
        {attSelected && (
          <div className="flex flex-col gap-4">
            <ModalProfile name={attSelected.name} subtitle={attSelected.role} meta={`Status: ${attSelected.status}`} />
            <ModalGrid title="Attendance Info" cols={2}>
              <ModalData label="Clock In"  value={attSelected.clockIn}  />
              <ModalData label="Clock Out" value={attSelected.clockOut} />
              <ModalData label="Hours"     value={attSelected.hours}    />
              <ModalData label="Status"    value={attSelected.status}   />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("fin-att-view")} />
            </div>
          </div>
        )}
      </Modal>

      {/* Leave modal */}
      <Modal id="fin-leave-view" title="Leave Details" size="md">
        {leaveSelected && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Leave Info" cols={2}>
              <ModalData label="Name"       value={leaveSelected.name}   />
              <ModalData label="Leave Type" value={leaveSelected.type}   />
              <ModalData label="From"       value={leaveSelected.from}   />
              <ModalData label="To"         value={leaveSelected.to}     />
              <ModalData label="Days"       value={String(leaveSelected.days)} />
              <ModalData label="Status"     value={leaveSelected.status} />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("fin-leave-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
