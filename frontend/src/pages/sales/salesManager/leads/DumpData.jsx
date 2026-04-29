import { useState } from "react";
import {
  DataTable, Modal, Button, SelectField, Option,
  openModal, closeModal, ModalProfile, ModalData, ModalGrid,
} from "../../../../components/shared/Common_Components";
import { Eye, Pencil, UserCheck, Trash2, AlertTriangle } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { TEAM_LEADERS, MAX_LEADS } from "./leadsStore";

export default function DumpData() {
  const { dumpData, reassignFromDump, deleteDumpRow } = useLeads();

  const [reassignRow,     setReassignRow]     = useState(null);
  const [reassignTL,      setReassignTL]      = useState("");
  const [reassignWarning, setReassignWarning] = useState("");
  const [deleteTarget,    setDeleteTarget]    = useState(null);

  const confirmReassign = () => {
    if (!reassignTL) return;
    const result = reassignFromDump(reassignRow, reassignTL);
    if (result.error) { setReassignWarning(result.error); return; }
    setReassignRow(null);
    setReassignTL("");
    setReassignWarning("");
    closeModal("dd-reassign-modal");
  };

  return (
    <>
      <DataTable
        title="Dump Data"
        columns={[
          { key: "name",       label: "Name" },
          { key: "dumpReason", label: "Dump Reason" },
          { key: "dumpedBy",   label: "Dumped By" },
          { key: "dumpDate",   label: "Dump Date" },
        ]}
        rows={dumpData}
        searchable
        actions={[
          { icon: <Eye size={15} />,       tooltip: "View",     variant: "ghost",   onClick: () => {} },
          { icon: <Pencil size={15} />,    tooltip: "Edit",     variant: "ghost",   onClick: () => {} },
          { icon: <UserCheck size={15} />, tooltip: "Reassign", variant: "primary", onClick: (row) => {
            const d = dumpData.find((x) => x.id === row.id);
            setReassignRow(d); setReassignTL(""); setReassignWarning("");
            openModal("dd-reassign-modal");
          }},
          { icon: <Trash2 size={15} />,    tooltip: "Delete",   variant: "danger",  onClick: (row) => {
            setDeleteTarget(dumpData.find((d) => d.id === row.id));
            openModal("dd-delete-modal");
          }},
        ]}
        size={12}
        pageSize={10}
      />

      {/* Reassign Modal */}
      <Modal id="dd-reassign-modal" title="Reassign Lead" size="md">
        {reassignRow && (
          <div className="space-y-4">
            <ModalProfile name={reassignRow.name} subtitle={reassignRow.mobile} meta={reassignRow.email} />
            <SelectField label="Select Team Leader" value={reassignTL}
              onChange={(e) => { setReassignTL(e.target.value); setReassignWarning(""); }}
              placeholder="Choose a TL">
              {TEAM_LEADERS.map((tl) => {
                const cap = MAX_LEADS - tl.currentLeads;
                return <Option key={tl.id} value={tl.name} label={`${tl.name} (${cap} capacity)`} disabled={cap === 0} />;
              })}
            </SelectField>
            {reassignWarning && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
                <AlertTriangle size={15} /> {reassignWarning}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button text="Reassign" variant="primary" size={6} onClick={confirmReassign} />
              <Button text="Cancel" variant="secondary" size={6} onClick={() => closeModal("dd-reassign-modal")} />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal id="dd-delete-modal" title="Delete Lead" size="sm">
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-[#2a465a]">{deleteTarget.name}</span> from dump data? This cannot be undone.
            </p>
            <ModalGrid title="Lead Info" cols={2}>
              <ModalData label="Mobile"      value={deleteTarget.mobile} />
              <ModalData label="Dump Reason" value={deleteTarget.dumpReason} />
            </ModalGrid>
            <div className="flex justify-end gap-2 pt-1">
              <Button text="Cancel" variant="ghost"  size={4} onClick={() => { setDeleteTarget(null); closeModal("dd-delete-modal"); }} />
              <Button text="Delete" variant="danger" size={4} onClick={() => {
                deleteDumpRow(deleteTarget.id);
                setDeleteTarget(null);
                closeModal("dd-delete-modal");
              }} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
