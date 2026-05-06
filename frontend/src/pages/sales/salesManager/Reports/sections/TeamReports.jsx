import { useState } from "react";
import {
  Heading, DashGrid, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, Button,
} from "../../../../../components/shared/Common_Components";
import { teamReportRows } from "../ReportsStore";
import { Eye } from "lucide-react";

const COLS = [
  { key: "teamName",       label: "Team Name"    },
  { key: "teamLeader",     label: "Team Leader"  },
  { key: "totalExec",      label: "Executives"   },
  { key: "completedCalls", label: "Calls"        },
  { key: "sales",          label: "Sales"        },
  { key: "revenue",        label: "Revenue"      },
  { key: "conversion",     label: "Conversion %" },
  { key: "status",         label: "Status"       },
];

export default function TeamReports() {
  const [selected, setSelected] = useState(null);

  const actions = [
    {
      icon: <Eye size={15} />, tooltip: "View",
      variant: "ghost",
      onClick: (row) => { setSelected(row); openModal("team-report-view"); },
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Team" secondaryText="Reports" size={12} />
      </DashGrid>

      <DataTable
        title="Team Reports"
        columns={COLS}
        rows={teamReportRows}
        actions={actions}
        size={12}
        pageSize={10}
        searchable
        date
        exportable
        exportFileName="team-reports"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Active", "Inactive"] },
        ]}
      />

      <Modal id="team-report-view" title="Team Report Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Team Info" cols={2}>
              <ModalData label="Team Name"    value={selected.teamName} />
              <ModalData label="Team Leader"  value={selected.teamLeader} />
              <ModalData label="Executives"   value={String(selected.totalExec)} />
              <ModalData label="Status"       value={selected.status} />
            </ModalGrid>
            <ModalGrid title="Performance" cols={2}>
              <ModalData label="Assigned Leads"    value={String(selected.assignedLeads)} />
              <ModalData label="Completed Calls"   value={String(selected.completedCalls)} />
              <ModalData label="Prospects"         value={String(selected.prospects)} />
              <ModalData label="Sales"             value={String(selected.sales)} />
              <ModalData label="Dump Leads"        value={String(selected.dumpLeads)} />
              <ModalData label="Missed Follow-ups" value={String(selected.missedFollowups)} />
              <ModalData label="Revenue"           value={selected.revenue} />
              <ModalData label="Conversion %"      value={selected.conversion} />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("team-report-view")} />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
