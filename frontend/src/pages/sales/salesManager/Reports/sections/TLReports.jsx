import { useState } from "react";
import {
  Heading, DashGrid, DataTable,
  openModal, closeModal, Modal, ModalData, ModalGrid, ModalProfile, Button,
} from "../../../../../components/shared/Common_Components";
import { tlReportRows } from "../ReportsStore";
import { Eye } from "lucide-react";

const COLS = [
  { key: "tlName",      label: "Team Leader"  },
  { key: "teamName",    label: "Team"         },
  { key: "sales",       label: "Sales"        },
  { key: "revenue",     label: "Revenue"      },
  { key: "target",      label: "Target"       },
  { key: "achieved",    label: "Achieved %"   },
  { key: "conversion",  label: "Conversion %" },
  { key: "status",      label: "Status"       },
];

export default function TLReports() {
  const [selected, setSelected] = useState(null);

  const actions = [
    {
      icon: <Eye size={15} />, tooltip: "View",
      variant: "ghost",
      onClick: (row) => { setSelected(row); openModal("tl-report-view"); },
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Team Leader" secondaryText="Reports" size={12} />
      </DashGrid>

      <DataTable
        title="Team Leader Reports"
        columns={COLS}
        rows={tlReportRows}
        actions={actions}
        size={12}
        pageSize={10}
        searchable
        date
        exportable
        exportFileName="tl-reports"
        filters={[
          { title: "Team",   type: "toggle", key: "teamName", options: ["Team Alpha","Team Beta","Team Gamma"] },
          { title: "Status", type: "toggle", key: "status",   options: ["Active","Inactive"] },
        ]}
      />

      <Modal id="tl-report-view" title="Team Leader Report Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selected.tlName}
              subtitle={selected.teamName}
              meta={`Status: ${selected.status}`}
            />
            <ModalGrid title="Performance" cols={2}>
              <ModalData label="Assigned Leads"    value={String(selected.assignedLeads)} />
              <ModalData label="Completed Calls"   value={String(selected.completedCalls)} />
              <ModalData label="Prospects"         value={String(selected.prospects)} />
              <ModalData label="Sales"             value={String(selected.sales)} />
              <ModalData label="Dump Leads"        value={String(selected.dumpLeads)} />
              <ModalData label="Missed Follow-ups" value={String(selected.missedFollowups)} />
              <ModalData label="Revenue"           value={selected.revenue} />
              <ModalData label="Target"            value={selected.target} />
              <ModalData label="Achieved %"        value={selected.achieved} />
              <ModalData label="Conversion %"      value={selected.conversion} />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("tl-report-view")} />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
