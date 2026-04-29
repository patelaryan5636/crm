import { DataTable } from "../../../../components/shared/Common_Components";
import { Eye, Pencil, BadgeCheck } from "lucide-react";
import { DUMMY_PROSPECTS, TEAM_LEADERS } from "./leadsStore";

export default function Prospects() {
  return (
    <DataTable
      title="Prospects"
      columns={[
        { key: "name",       label: "Name" },
        { key: "service",    label: "Service" },
        { key: "budget",     label: "Budget" },
        { key: "assignedTL", label: "Assigned TL" },
        { key: "status",     label: "Status" },
      ]}
      rows={DUMMY_PROSPECTS}
      searchable
      filters={[
        { title: "Status",      type: "toggle", key: "status",     options: ["Hot", "Warm", "Cold"] },
        { title: "Assigned TL", type: "select", key: "assignedTL", options: TEAM_LEADERS.map((t) => t.name) },
      ]}
      actions={[
        { icon: <Eye size={15} />,        tooltip: "View",            variant: "ghost",   onClick: () => {} },
        { icon: <Pencil size={15} />,     tooltip: "Edit",            variant: "ghost",   onClick: () => {} },
        { icon: <BadgeCheck size={15} />, tooltip: "Send to Finance", variant: "primary", onClick: () => {} },
      ]}
      size={12}
      pageSize={10}
    />
  );
}
