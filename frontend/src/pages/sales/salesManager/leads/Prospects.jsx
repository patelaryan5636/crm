/**
 * PROSPECTS — Sales Manager view
 * Fetches prospect forms filled by SALES_TL and SALES_EXECUTIVE.
 * No budget field. Full view + edit modals.
 */
import { useState, useEffect, useCallback } from "react";
import {
  DataTable, Modal, Button, DataField, SelectField, Option,
  openModal, closeModal, ModalProfile, ModalData, ModalGrid, Grid,
} from "../../../../components/shared/Common_Components";
import { Eye, Pencil, Loader2, AlertTriangle } from "lucide-react";
import { useLeads } from "./LeadsContext";

const STAGE_OPTIONS    = ["Interested", "Negotiating", "Proposal Sent", "Closing"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];
const STATUS_OPTIONS   = ["OPEN", "IN_NEGOTIATION", "SENT_TO_FINANCE", "WON", "LOST"];

const STATUS_LABEL = {
  OPEN:             "Open",
  IN_NEGOTIATION:   "Negotiating",
  SENT_TO_FINANCE:  "Sent to Finance",
  WON:              "Won",
  LOST:             "Lost",
};

const PRIORITY_COLOR = {
  High:   "text-rose-600 bg-rose-50 border-rose-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Low:    "text-emerald-600 bg-emerald-50 border-emerald-200",
};

export default function Prospects() {
  const { fetchProspects, updateProspect } = useLeads();

  const [prospects,  setProspects]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const [viewRow,    setViewRow]    = useState(null);
  const [editRow,    setEditRow]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState("");

  // ── Load on mount ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const data = await fetchProspects();
    setProspects(data);
    setLoading(false);
  }, [fetchProspects]);

  useEffect(() => { load(); }, [load]);

  // ── Save edit ──────────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    setSaveError("");
    const result = await updateProspect(editRow.id, {
      stage:         editRow.stage,
      priority:      editRow.priority,
      notes:         editRow.notes,
      status:        editRow.status,
      contactPerson: editRow.contactPerson,
      company:       editRow.company,
      requirement:   editRow.service,
      probability:   editRow.probability,
      expectedClose: editRow.expectedClose || null,
    });
    setSaving(false);
    if (!result.success) {
      setSaveError(result.error || "Failed to save changes.");
      return;
    }
    // Update local state
    setProspects((prev) =>
      prev.map((p) => (p.id === editRow.id ? { ...p, ...editRow } : p))
    );
    closeModal("pr-edit-modal");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
        <AlertTriangle size={16} /> {error}
        <button onClick={load} className="ml-auto text-xs font-bold underline">Retry</button>
      </div>
    );
  }

  return (
    <>
      <DataTable
        title="Prospects"
        columns={[
          { key: "name",       label: "Name"        },
          { key: "service",    label: "Service"     },
          { key: "assignedTL", label: "Assigned TL" },
          { key: "priority",   label: "Priority"    },
          { key: "stage",      label: "Stage"       },
          { key: "status",     label: "Status"      },
          { key: "createdAt",  label: "Date"        },
        ]}
        rows={prospects.map((p) => ({
          ...p,
          status: STATUS_LABEL[p.status] || p.status,
        }))}
        searchable
        filters={[
          { title: "Priority", type: "toggle", key: "priority", options: PRIORITY_OPTIONS },
          { title: "Stage",    type: "toggle", key: "stage",    options: STAGE_OPTIONS    },
        ]}
        actions={[
          {
            icon: <Eye size={15} />, tooltip: "View", variant: "ghost",
            onClick: (row) => {
              setViewRow(prospects.find((p) => String(p.id) === String(row.id)));
              openModal("pr-view-modal");
            },
          },
          {
            icon: <Pencil size={15} />, tooltip: "Edit", variant: "ghost",
            onClick: (row) => {
              setEditRow({ ...prospects.find((p) => String(p.id) === String(row.id)) });
              setSaveError("");
              openModal("pr-edit-modal");
            },
          },
        ]}
        size={12}
        pageSize={10}
      />

      {/* ── View Modal ──────────────────────────────────────────────────────── */}
      <Modal id="pr-view-modal" title="Prospect Details" size="md">
        {viewRow && (
          <div className="space-y-4">
            <ModalProfile
              name={viewRow.name}
              subtitle={`${viewRow.assignedTL || "—"} · ${viewRow.priority}`}
              meta={viewRow.filledBy ? `Filed by: ${viewRow.filledBy} (${viewRow.filledByRole})` : ""}
            />
            <ModalGrid title="Contact Info" cols={2}>
              <ModalData label="Mobile"  value={viewRow.mobile}  />
              <ModalData label="Email"   value={viewRow.email}   />
              <ModalData label="Company" value={viewRow.company} />
            </ModalGrid>
            <ModalGrid title="Deal Info" cols={2}>
              <ModalData label="Service / Requirement" value={viewRow.service}      />
              <ModalData label="Priority"              value={viewRow.priority}     />
              <ModalData label="Stage"                 value={viewRow.stage}        />
              <ModalData label="Probability"           value={`${viewRow.probability}%`} />
              <ModalData label="Expected Close"        value={viewRow.expectedClose || "—"} />
              <ModalData label="Status"                value={STATUS_LABEL[viewRow.status] || viewRow.status} />
              <ModalData label="Assigned TL"           value={viewRow.assignedTL || "—"} />
              <ModalData label="Team"                  value={viewRow.team || "—"} />
            </ModalGrid>
            {viewRow.notes && (
              <ModalGrid title="Notes" cols={1}>
                <ModalData label="Notes" value={viewRow.notes} />
              </ModalGrid>
            )}
            <div className="flex justify-end pt-2">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("pr-view-modal")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      <Modal id="pr-edit-modal" title="Edit Prospect" size="md">
        {editRow && (
          <div className="space-y-4">
            <Grid cols={12} gap={4}>
              <DataField
                label="Contact Person" id="pr-contact" value={editRow.contactPerson} size={6}
                onChange={(e) => setEditRow((p) => ({ ...p, contactPerson: e.target.value }))}
              />
              <DataField
                label="Company" id="pr-company" value={editRow.company} size={6}
                onChange={(e) => setEditRow((p) => ({ ...p, company: e.target.value }))}
              />
              <DataField
                label="Service / Requirement" id="pr-service" value={editRow.service} size={12}
                onChange={(e) => setEditRow((p) => ({ ...p, service: e.target.value }))}
              />
              <SelectField
                label="Priority" value={editRow.priority} size={6}
                onChange={(e) => setEditRow((p) => ({ ...p, priority: e.target.value }))}
              >
                {PRIORITY_OPTIONS.map((o) => <Option key={o} value={o} label={o} />)}
              </SelectField>
              <SelectField
                label="Stage" value={editRow.stage} size={6}
                onChange={(e) => setEditRow((p) => ({ ...p, stage: e.target.value }))}
              >
                {STAGE_OPTIONS.map((o) => <Option key={o} value={o} label={o} />)}
              </SelectField>
              <DataField
                label="Probability (%)" id="pr-prob" type="number" value={String(editRow.probability)} size={6}
                onChange={(e) => setEditRow((p) => ({ ...p, probability: Number(e.target.value) }))}
              />
              <DataField
                label="Expected Close" id="pr-close" type="date" value={editRow.expectedClose || ""} size={6}
                onChange={(e) => setEditRow((p) => ({ ...p, expectedClose: e.target.value }))}
              />
              <SelectField
                label="Status" value={editRow.status} size={12}
                onChange={(e) => setEditRow((p) => ({ ...p, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((o) => <Option key={o} value={o} label={STATUS_LABEL[o] || o} />)}
              </SelectField>
              <DataField
                label="Notes" id="pr-notes" type="textarea" rows={3} value={editRow.notes || ""} size={12}
                onChange={(e) => setEditRow((p) => ({ ...p, notes: e.target.value }))}
              />
            </Grid>

            {saveError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
                <AlertTriangle size={14} /> {saveError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                text={saving ? "Saving…" : "Save Changes"}
                variant="primary" size={6}
                onClick={saveEdit}
                disabled={saving}
              />
              <Button
                text="Cancel" variant="secondary" size={6}
                onClick={() => { closeModal("pr-edit-modal"); setSaveError(""); }}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
