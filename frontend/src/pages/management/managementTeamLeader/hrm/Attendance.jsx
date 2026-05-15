import { useState } from "react";
import {
  Heading, DashGrid, EnhancedDashCard, DataTable, Grid,
  GColumnChart, GDoughnutChart, GPieChart, GAreaChart,
  Modal, ModalGrid, ModalData, ModalProfile, Button,
  openModal, closeModal, DataField, SelectField, Option
} from "../../../../components/shared/Common_Components";
import SessionTimer from "../../../../components/shared/SessionTimer";
import { useAttendance } from "../../../../context/AttendanceContext";
import { Users, UserCheck, UserX, CalendarClock, Eye, Clock, TrendingUp } from "lucide-react";
import {
  kpiAttendance, attendanceRows, ATTENDANCE_STATUS, currentTL,
  weeklyAttendance, attendanceDistribution, myTimingLogs, employeeAttendanceSummary,
  monthlyAttendanceGraph, employeeAttendanceBar, clockInTrendGraph, leaveTypeDistribution
} from "./hrmStore";

const KPI_ICONS   = [<Users size={20} />, <UserCheck size={20} />, <UserX size={20} />, <CalendarClock size={20} />];
const KPI_ACCENTS = ["#3b82f6", "#22c55e", "#f43f5e", "#f59e0b"];

const COLS = [
  { key: "employeeId", label: "Emp ID",      width: "10%" },
  { key: "name",       label: "Member",      width: "15%" },
  { key: "role",       label: "Role",        width: "10%" },
  { key: "department", label: "Department",  width: "15%" },
  { key: "date",       label: "Date",        width: "10%" },
  { key: "clockIn",    label: "Clock In",    width: "10%" },
  { key: "clockOut",   label: "Clock Out",   width: "10%" },
  { key: "hours",      label: "Total Hours", width: "10%" },
  { key: "status",     label: "Status",      width: "10%" },
];

// ── Bridge: SessionTimer ← AttendanceContext ──────────────────────────────────
function MyAttendanceWidget() {
  const ctx = useAttendance();
  return (
  );
}

export default function Attendance() {
  const [selected, setSelected] = useState(null);

        {kpiAttendance.map((k, i) => (
          <EnhancedDashCard
            key={k.title}
            title={k.title}
            value={k.value}
            icon={KPI_ICONS[i]}
            accentColor={KPI_ACCENTS[i]}
            size={3}
          />
        ))}
      </DashGrid>

      {/* ── My attendance session timer ───────────────────────────────────── */}
      <MyAttendanceWidget />

        />
      </Grid>

      {/* ── Team attendance table ─────────────────────────────────────────── */}
      <DataTable
        title="Team Attendance Log"
        columns={COLS}
        rows={attendanceRows}
        userProfile="name"
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="team_attendance"
        filters={[
        ]}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Details",
            variant: "ghost",
            onClick: (row) => {
              const summary = row;
              const log = attendanceRows.find((r) => r.name === summary.name) || {};
              setSelected({ log, summary });
              openModal("mtl-hrm-att-view");
            },
          },
        ]}
      />

            </ModalGrid>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("mtl-hrm-att-view")} />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
