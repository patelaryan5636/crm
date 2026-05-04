import { useState } from "react";
import {
  Heading, DashGrid, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, ModalProfile, Button,
} from "../../../../../components/shared/Common_Components";
import { execReportRows } from "../ReportsStore";
import { Eye } from "lucide-react";

const COLS = [
  { key: "execName",       label: "Executive"    },
  { key: "teamLeader",     label: "Team Leader"  },
  { key: "teamName",       label: "Team"         },
  { key: "completedCalls", label: "Calls"        },
  { key: "sales",          label: "Sales"        },
  { key: "revenue",        label: "Revenue"      },
  { key: "conversion",     label: "Conversion %" },
  { key: "status",         label: "Status"       },
];

export default function ExecReports() {
  const [selected, setSelected] = useState(null);

  const actions = [
    {
      icon: <Eye size={15} />, tooltip: "View",
      variant: "ghost",
      onClick: (row) => { setSelected(row); openModal("exec-report-view"); },
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Executive" secondaryText="Reports" size={12} />
      </DashGrid>

      <DataTable
        title="Executive Reports"
        columns={COLS}
        rows={execReportRows}
        actions={actions}
        size={12}
        pageSize={10}
        searchable
        date
        exportable
        exportFileName="executive-reports"
        filters={[
          { title: "Team",        type: "toggle", key: "teamName",   options: ["Team Alpha","Team Beta","Team Gamma"] },
          { title: "Team Leader", type: "select", key: "teamLeader", options: ["Ankit Verma","Sonal Gupta","Nisha Patel"] },
          { title: "Status",      type: "toggle", key: "status",     options: ["Active","Inactive"] },
        ]}
      />

      <Modal id="exec-report-view" title="Executive Report Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selected.execName}
              subtitle={`${selected.teamName} · ${selected.teamLeader}`}
              meta={`Status: ${selected.status}`}
            />
            <ModalGrid title="Call Breakdown" cols={2}>
              <ModalData label="Assigned Leads"   value={String(selected.assignedLeads)} />
              <ModalData label="Completed Calls"  value={String(selected.completedCalls)} />
              <ModalData label="Talk"             value={String(selected.talk)} />
              <ModalData label="Not Talk"         value={String(selected.notTalk)} />
              <ModalData label="Interested"       value={String(selected.interested)} />
              <ModalData label="Prospects"        value={String(selected.prospects)} />
            </ModalGrid>
            <ModalGrid title="Results" cols={2}>
              <ModalData label="Sales"             value={String(selected.sales)} />
              <ModalData label="Dump Leads"        value={String(selected.dumpLeads)} />
              <ModalData label="Missed Follow-ups" value={String(selected.missedFollowups)} />
              <ModalData label="Revenue"           value={selected.revenue} />
              <ModalData label="Conversion %"      value={selected.conversion} />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("exec-report-view")} />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
