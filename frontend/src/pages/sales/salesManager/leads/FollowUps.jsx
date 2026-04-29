import { DataTable } from "../../../../components/shared/Common_Components";
import { Eye, CalendarClock, BadgeCheck } from "lucide-react";
import { DUMMY_FOLLOWUPS } from "./leadsStore";

export default function FollowUps() {
  return (
    <DataTable
      title="Follow-ups"
      columns={[
        { key: "name",         label: "Lead Name" },
        { key: "assignedTL",   label: "Assigned TL" },
        { key: "followUpDate", label: "Follow-up Date" },
        { key: "priority",     label: "Priority" },
        { key: "status",       label: "Status" },
      ]}
      rows={DUMMY_FOLLOWUPS}
      searchable
      date={true}
      filters={[
        { title: "Priority", type: "toggle", key: "priority", options: ["High", "Medium", "Low"] },
        { title: "Status",   type: "toggle", key: "status",   options: ["Pending", "Done"] },
      ]}
      actions={[
        { icon: <Eye size={15} />,          tooltip: "View",       variant: "ghost",   onClick: () => {} },
        { icon: <CalendarClock size={15} />, tooltip: "Reschedule", variant: "ghost",   onClick: () => {} },
        { icon: <BadgeCheck size={15} />,   tooltip: "Mark Done",  variant: "primary", onClick: () => {} },
      ]}
      size={12}
      pageSize={10}
    />
  );
}
