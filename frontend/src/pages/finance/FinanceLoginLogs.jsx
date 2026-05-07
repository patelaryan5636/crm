import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable,
  openModal, closeModal, Modal, ModalData, ModalProfile, ModalGrid, Button,
} from "../../components/shared/Common_Components";
import { LogIn, UserCheck, ShieldAlert, AlertTriangle, Eye } from "lucide-react";

const kpi = [
  { title: "Total Logins",     value: "124", accent: "#3b82f6", icon: <LogIn size={22}/> },
  { title: "Active Sessions",  value: "8",   accent: "#22c55e", icon: <UserCheck size={22}/> },
  { title: "Failed Attempts",  value: "3",   accent: "#f59e0b", icon: <AlertTriangle size={22}/> },
  { title: "Suspicious",       value: "1",   accent: "#f43f5e", icon: <ShieldAlert size={22}/> },
];

const COLS = [
  { key: "name",      label: "User"       },
  { key: "email",     label: "Email"      },
  { key: "role",      label: "Role"       },
  { key: "date",      label: "Date"       },
  { key: "time",      label: "Time"       },
  { key: "ip",        label: "IP Address" },
  { key: "latitude",  label: "Latitude"   },
  { key: "longitude", label: "Longitude"  },
];

const ROWS = [
  { name: "Finance Manager", email: "fm@crm.in",    role: "Finance Manager", date: "2026-05-03", time: "09:00 AM", ip: "192.168.2.10", latitude: "23.0225° N", longitude: "72.5714° E", status: "Active",   device: "Chrome / Windows 11" },
  { name: "Accounts Head",   email: "ah@crm.in",    role: "Accounts",        date: "2026-05-03", time: "09:15 AM", ip: "192.168.2.11", latitude: "19.0760° N", longitude: "72.8777° E", status: "Active",   device: "Safari / macOS"      },
  { name: "Finance Exec",    email: "fe@crm.in",    role: "Executive",       date: "2026-05-03", time: "09:30 AM", ip: "192.168.2.12", latitude: "28.6139° N", longitude: "77.2090° E", status: "Active",   device: "Chrome / Windows 10" },
  { name: "Billing Exec",    email: "be@crm.in",    role: "Executive",       date: "2026-05-03", time: "10:00 AM", ip: "103.45.72.20", latitude: "Unknown",    longitude: "Unknown",    status: "Rejected", device: "Edge / Windows 11"   },
  { name: "Finance Manager", email: "fm@crm.in",    role: "Finance Manager", date: "2026-05-02", time: "08:55 AM", ip: "192.168.2.10", latitude: "23.0225° N", longitude: "72.5714° E", status: "Active",   device: "Chrome / Windows 11" },
];

export default function FinanceLoginLogs() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="Login Logs" size={12} />
        {kpi.map((k) => (
          <DashCard key={k.title} title={k.title} value={k.value}
            icon={k.icon} accentColor={k.accent} size={3} />
        ))}
      </DashGrid>

      <DataTable
        title="Login Records"
        columns={COLS}
        rows={ROWS}
        actions={[{
          icon: <Eye size={15}/>, tooltip: "View Details",
          variant: "ghost",
          onClick: (row) => { setSelected(row); openModal("fin-log-view"); },
        }]}
        size={12} pageSize={10} searchable date exportable exportFileName="finance-login-logs"
        filters={[
          { title: "Role",   type: "toggle", key: "role",   options: ["Finance Manager","Accounts","Executive"] },
          { title: "Status", type: "toggle", key: "status", options: ["Active","Rejected","Pending"] },
        ]}
      />

      <Modal id="fin-log-view" title="Login Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selected.name}
              subtitle={selected.role}
              meta={`${selected.date} at ${selected.time}`}
            />
            <ModalGrid title="Login Info" cols={2}>
              <ModalData label="Email"     value={selected.email}     />
              <ModalData label="Role"      value={selected.role}      />
              <ModalData label="Date"      value={selected.date}      />
              <ModalData label="Time"      value={selected.time}      />
              <ModalData label="IP"        value={selected.ip}        />
              <ModalData label="Status"    value={selected.status}    />
              <ModalData label="Latitude"  value={selected.latitude}  />
              <ModalData label="Longitude" value={selected.longitude} />
              <ModalData label="Device"    value={selected.device}    />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("fin-log-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
