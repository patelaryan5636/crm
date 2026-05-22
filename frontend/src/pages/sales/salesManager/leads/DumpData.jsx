/**
 * DUMP DATA — Sales Manager view
 * - Fetches real dump leads from API
 * - Bulk Restore: selected leads → restored to active (unassigned)
 * - Single Restore: one lead → restored to active
 * - Single Delete: soft-delete one lead
 * - Dump count badge in tab is driven by dumpCount from context
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DataTable, Modal, Button,
  openModal, closeModal, ModalProfile, ModalData, ModalGrid,
} from "../../../../components/shared/Common_Components";
import {
  Eye, Loader2, RotateCcw, Trash2, AlertTriangle, CheckCircle,
} from "lucide-react";
import { useLeads } from "./LeadsContext";

export default function DumpData() {
  const {
    fetchDumpLeads, restoreDumpLeads, softDeleteDumpLead,
    fetchLeads, fetchAssignedLeads,
  } = useLeads();

  const [dumpData,      setDumpData]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  // View modal
  const [viewRow,       setViewRow]       = useState(null);

  // Action feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [toast,         setToast]         = useState(null); // { msg, type }

  // Delete confirm modal
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load dump leads ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const data = await fetchDumpLeads();
    setDumpData(data);
    setLoading(false);
  }, [fetchDumpLeads]);

  useEffect(() => { load(); }, [load]);

  // ── Bulk Restore ───────────────────────────────────────────────────────────
  const handleBulkRestore = async (selected) => {
    const ids = selected
      .map((r) => String(r.id || r._id || ""))
      .filter(Boolean);

    if (ids.length === 0) return;
    setActionLoading(true);

    const result = await restoreDumpLeads(ids);
    await load();
    await fetchLeads();
    await fetchAssignedLeads();
    setActionLoading(false);

    if (result.restored > 0) {
      showToast(`${result.restored} lead${result.restored !== 1 ? "s" : ""} restored successfully.`);
    }
    if (result.failed > 0) {
      showToast(`${result.failed} lead${result.failed !== 1 ? "s" : ""} could not be restored.`, "error");
    }
  };

  // ── Single Restore ─────────────────────────────────────────────────────────
  const handleRestore = async (row) => {
    const id = String(row.id || row._id || "");
    if (!id) return;
    setActionLoading(true);

    const result = await restoreDumpLeads([id]);
    await load();
    await fetchLeads();
    await fetchAssignedLeads();
    setActionLoading(false);

    if (result.restored > 0) {
      showToast("Lead restored successfully.");
    } else {
      showToast("Failed to restore lead.", "error");
    }
  };

  // ── Single Soft Delete ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);

    const result = await softDeleteDumpLead(String(deleteTarget.id || deleteTarget._id));
    await load();
    setActionLoading(false);
    setDeleteTarget(null);
    closeModal("dd-delete-modal");

    if (result.success) {
      showToast("Lead deleted.");
    } else {
      showToast(result.error || "Failed to delete lead.", "error");
    }
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
        title="Dump Data"
        columns={[
          { key: "name",       label: "Name"        },
          { key: "mobile",     label: "Mobile"      },
          { key: "email",      label: "Email"       },
          { key: "dumpReason", label: "Dump Reason" },
          { key: "dumpedBy",   label: "Dumped By"   },
          { key: "dumpDate",   label: "Dump Date"   },
        ]}
        rows={dumpData}
        searchable
        bulkAction
        bulkActions={[
          {
            title: "Restore",
            icon: <RotateCcw size={14} />,
            onClick: handleBulkRestore,
          },
        ]}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View",
            variant: "ghost",
            onClick: (row) => {
              setViewRow(dumpData.find((d) => String(d.id) === String(row.id)));
              openModal("dd-view-modal");
            },
          },
          {
            icon: <RotateCcw size={15} />,
            tooltip: "Restore",
            variant: "primary",
            onClick: handleRestore,
          },
          {
            icon: <Trash2 size={15} />,
            tooltip: "Delete",
            variant: "danger",
            onClick: (row) => {
              setDeleteTarget(dumpData.find((d) => String(d.id) === String(row.id)));
              openModal("dd-delete-modal");
            },
          },
        ]}
        size={12}
        pageSize={10}
      />

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[10000] flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-2xl transition-all duration-300 ${
          toast.type === "error" ? "bg-rose-500" : "bg-emerald-500"
        }`}>
          {toast.type === "error"
            ? <AlertTriangle size={16} />
            : <CheckCircle size={16} />
          }
          {toast.msg}
        </div>
      )}

      {/* ── View Modal ──────────────────────────────────────────────────────── */}
      <Modal id="dd-view-modal" title="Dump Lead Details" size="md">
        {viewRow && (
          <div className="space-y-4">
            <ModalProfile
              name={viewRow.name}
              subtitle={viewRow.mobile}
              meta={viewRow.email}
            />
            <ModalGrid title="Dump Info" cols={2}>
              <ModalData label="Dump Reason"    value={viewRow.dumpReason   || "—"} />
              <ModalData label="Dumped By"      value={viewRow.dumpedBy     || "—"} />
              <ModalData label="Dump Date"      value={viewRow.dumpDate     || "—"} />
              <ModalData label="Assigned To"    value={viewRow.assignedTo   || "—"} />
              <ModalData label="Team"           value={viewRow.team         || "—"} />
              <ModalData label="Not-Talk Count" value={viewRow.notTalkCount ?? "—"} />
            </ModalGrid>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                text="Restore Lead"
                variant="primary"
                size={4}
                onClick={() => {
                  closeModal("dd-view-modal");
                  handleRestore(viewRow);
                }}
              />
              <Button
                text="Close"
                variant="ghost"
                size={3}
                onClick={() => closeModal("dd-view-modal")}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      <Modal id="dd-delete-modal" title="Delete Lead" size="sm">
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
              <AlertTriangle size={18} className="text-rose-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-800">Permanently delete this lead?</p>
                <p className="text-xs text-rose-600 mt-0.5">
                  <strong>{deleteTarget.name}</strong> · {deleteTarget.mobile}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              This will soft-delete the lead. It will no longer appear anywhere in the system.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                text="Cancel"
                variant="ghost"
                size={4}
                onClick={() => { setDeleteTarget(null); closeModal("dd-delete-modal"); }}
              />
              <Button
                text={actionLoading ? "Deleting…" : "Delete"}
                variant="danger"
                size={4}
                disabled={actionLoading}
                onClick={handleDelete}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
