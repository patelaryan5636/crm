import { useState, useMemo } from "react";
import {
  DataTable, Modal, Button, DataField, SelectField, Option,
  openModal, closeModal, Grid, ModalProfile, ModalGrid, ModalData,
} from "../../../../components/shared/Common_Components.jsx";
import {
  Pencil, UserCheck, Phone, MessageCircle, Eye, AlertTriangle,
  GitBranch, CheckCircle,
} from "lucide-react";
import {
  INITIAL_LEADS, LEAD_STATUS_OPTIONS, teamExecutives, executiveNames,
} from "./leadsStore";

const COLS = [
  { key: "name",        label: "Name"        },
  { key: "companyName", label: "Company"     },
  { key: "mobile",      label: "Mobile"      },
  { key: "email",       label: "Email"       },
  { key: "status",      label: "Status"      },
  { key: "assignedTo",  label: "Assigned To" },
  { key: "createdAt",   label: "Created"     },
];

const stripPhone = (m) => (m || "").replace(/\D/g, "");

export default function AllLeads() {
  const [leads, setLeads] = useState(INITIAL_LEADS);

  const unassignedLeads = useMemo(() => leads.filter((l) => l.assignedTo === "Unassigned"), [leads]);
  const assignedLeads   = useMemo(() => leads.filter((l) => l.assignedTo !== "Unassigned"), [leads]);

  // ── View / edit / assign state ────────────────────────────────────────────
  const [viewRow,   setViewRow]   = useState(null);
  const [editRow,   setEditRow]   = useState(null);
  const [assignRow, setAssignRow] = useState(null);
  const [assignTo,  setAssignTo]  = useState("");

  // ── Distribution state ────────────────────────────────────────────────────
  const [distSelectedLeads, setDistSelectedLeads] = useState([]);
  const [distRows,          setDistRows]          = useState([]);
  const [distError,         setDistError]         = useState("");
  const [distSuccess,       setDistSuccess]       = useState(false);
  const [distSummary,       setDistSummary]       = useState([]);
  const [totalToDistribute, setTotalToDistribute] = useState(0);

  const callLead     = (row) => { window.location.href = `tel:${stripPhone(row.mobile)}`; };
  const whatsappLead = (row) => { window.open(`https://wa.me/${stripPhone(row.mobile)}`, "_blank", "noopener"); };

  // ── Distribution helpers ──────────────────────────────────────────────────
  const buildDistRows = (pool) =>
    teamExecutives.map((ex) => ({
      id:           ex.id,
      name:         ex.name,
      currentLeads: leads.filter((l) => l.assignedTo === ex.name).length,
      capacity:     250 - leads.filter((l) => l.assignedTo === ex.name).length,
      assignLeads:  0,
    })).filter((r) => r.capacity > 0);

  const openDistModal = (selected) => {
    const pool = selected?.length ? selected : unassignedLeads;
    setDistSelectedLeads(pool);
    setTotalToDistribute(pool.length);
    setDistRows(buildDistRows(pool));
    setDistError("");
    setDistSuccess(false);
    openModal("tl-dist-modal");
  };

  const updateDistRow = (index, raw) => {
    const val = Math.max(0, Number(raw) || 0);
    setDistRows((prev) => {
      const otherAssigned = prev.filter((_, i) => i !== index).reduce((s, r) => s + r.assignLeads, 0);
      const remaining = Math.max(0, totalToDistribute - otherAssigned);
      return prev.map((r, i) =>
        i !== index ? r : { ...r, assignLeads: Math.min(val, r.capacity, remaining) }
      );
    });
  };

  const totalToAssign = useMemo(() => distRows.reduce((s, r) => s + r.assignLeads, 0), [distRows]);

  const confirmDistribute = () => {
    if (totalToAssign === 0) { setDistError("Please assign at least 1 lead."); return; }
    const shuffled = [...distSelectedLeads].sort(() => Math.random() - 0.5);
    let pointer = 0;
    const today = new Date().toISOString().split("T")[0];

    setLeads((prev) => {
      const updated = [...prev];
      for (const r of distRows) {
        if (r.assignLeads === 0) continue;
        const slice = shuffled.slice(pointer, pointer + r.assignLeads);
        pointer += r.assignLeads;
        slice.forEach((lead) => {
          const idx = updated.findIndex((l) => l.id === lead.id);
          if (idx !== -1) updated[idx] = { ...updated[idx], assignedTo: r.name, assignedAt: today };
        });
      }
      return updated;
    });

    setDistSuccess(true);
    setDistSummary(distRows.filter((r) => r.assignLeads > 0));
  };

  // ── Single assign ─────────────────────────────────────────────────────────
  const openAssign = (row) => {
    setAssignRow(row);
    setAssignTo("");
    openModal("tl-lead-assign");
  };

  const confirmAssign = () => {
    if (!assignTo || !assignRow) return;
    const today = new Date().toISOString().split("T")[0];
    setLeads((prev) =>
      prev.map((l) => l.id === assignRow.id ? { ...l, assignedTo: assignTo, assignedAt: today } : l)
    );
    closeModal("tl-lead-assign");
  };

  // ── Row actions ───────────────────────────────────────────────────────────
  const baseActions = [
    {
      icon: <Eye size={15} />, tooltip: "View", variant: "ghost",
      onClick: (row) => { setViewRow(leads.find((l) => l.id === row.id)); openModal("tl-lead-view"); },
    },
    { icon: <Phone size={15} />,         tooltip: "Call",      variant: "ghost",   onClick: callLead },
    { icon: <MessageCircle size={15} />, tooltip: "WhatsApp",  variant: "ghost",   onClick: whatsappLead },
    {
      icon: <Pencil size={15} />, tooltip: "Edit", variant: "ghost",
      onClick: (row) => { setEditRow({ ...leads.find((l) => l.id === row.id) }); openModal("tl-lead-edit"); },
    },
    { icon: <UserCheck size={15} />, tooltip: "Assign", variant: "primary", onClick: openAssign },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Distribute button ─────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={() => openDistModal(unassignedLeads)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2a465a] text-white text-sm font-bold hover:bg-[#1e3a52] transition active:scale-95 shadow-sm"
        >
          <GitBranch size={16} /> Distribute Leads
        </button>
      </div>

      {/* ── Unassigned pool ───────────────────────────────────────────────── */}
      <DataTable
        title="Unassigned Pool"
        columns={COLS}
        rows={unassignedLeads}
        actions={baseActions.filter((a) => ["View", "Assign"].includes(a.tooltip))}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="unassigned_leads"
        bulkAction
        bulkActions={[{ title: "Distribute", icon: <GitBranch size={14} />, onClick: openDistModal }]}
        filters={[{ title: "Status", type: "toggle", key: "status", options: LEAD_STATUS_OPTIONS }]}
      />

      {/* ── Assigned leads ────────────────────────────────────────────────── */}
      <DataTable
        title="Team Assignments"
        columns={COLS}
        rows={assignedLeads}
        actions={baseActions}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="team_assignments"
        filters={[
          { title: "Status",    type: "toggle", key: "status",     options: LEAD_STATUS_OPTIONS },
          { title: "Executive", type: "select", key: "assignedTo", options: executiveNames },
        ]}
      />

      {/* ── Distribution Modal ────────────────────────────────────────────── */}
      <Modal id="tl-dist-modal" title="Distribute Leads to Team" size="xl">
        <div className="flex flex-col gap-5">

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5">
            <div>
              <p className="text-sm font-bold text-[#2a465a]">{distSelectedLeads.length} leads selected</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Assigned: <span className="font-bold text-emerald-600">{totalToAssign}</span> / {totalToDistribute}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Remaining</p>
              <p className="text-lg font-black text-[#2a465a]">{Math.max(0, totalToDistribute - totalToAssign)}</p>
            </div>
          </div>

          {distSuccess ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl">
                <CheckCircle size={18} />
                <p className="text-sm font-semibold">Distribution successful!</p>
              </div>
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="py-3 px-4 text-left font-bold text-[#2a465a]">Executive</th>
                      <th className="py-3 px-4 text-left font-bold text-[#2a465a]">Leads Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distSummary.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="py-3 px-4 font-medium">{r.name}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">+{r.assignLeads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button text="Close" variant="primary" size={3} onClick={() => closeModal("tl-dist-modal")} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {distRows.map((r, i) => {
                  const usedAfter = r.currentLeads + r.assignLeads;
                  const pct = Math.round((usedAfter / 250) * 100);
                  const barColor = pct >= 95 ? "bg-rose-500" : pct >= 75 ? "bg-amber-400" : "bg-emerald-500";
                  return (
                    <div key={r.id} className="rounded-2xl border border-slate-200 p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-bold text-[#2a465a]">{r.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                            {r.currentLeads} / 250 Leads
                          </p>
                        </div>
                        <input
                          type="number" min={0} max={r.capacity}
                          value={r.assignLeads}
                          onChange={(e) => updateDistRow(i, e.target.value)}
                          className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {distError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} /> {distError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button text="Cancel"               variant="ghost"    size={3} onClick={() => closeModal("tl-dist-modal")} />
                <Button text="Confirm Distribution" variant="primary"  size={4} disabled={totalToAssign === 0} onClick={confirmDistribute} />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── View Modal ────────────────────────────────────────────────────── */}
      <Modal id="tl-lead-view" title="Lead Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile name={viewRow.name} subtitle={`${viewRow.companyName} · ${viewRow.status}`} meta={`ID: ${viewRow.id}`} />
            <ModalGrid title="Contact" cols={2}>
              <ModalData label="Mobile" value={viewRow.mobile} />
              <ModalData label="Email"  value={viewRow.email}  />
            </ModalGrid>
            <ModalGrid title="Assignment" cols={2}>
              <ModalData label="Assigned To" value={viewRow.assignedTo} />
              <ModalData label="Created"     value={viewRow.createdAt}  />
            </ModalGrid>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button text="Call"  variant="ghost"   size={2} onClick={() => callLead(viewRow)} />
              <Button text="Close" variant="primary" size={3} onClick={() => closeModal("tl-lead-view")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Assign Modal ──────────────────────────────────────────────────── */}
      <Modal id="tl-lead-assign" title="Assign Lead" size="sm">
        {assignRow && (
          <div className="flex flex-col gap-4">
            <SelectField label="Select Executive" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              <Option value="" label="-- Select Member --" />
              {teamExecutives.map((ex) => (
                <Option key={ex.id} value={ex.name} label={ex.name} />
              ))}
            </SelectField>
            <div className="flex gap-2 pt-2">
              <Button text="Cancel"  variant="secondary" size={6} onClick={() => closeModal("tl-lead-assign")} />
              <Button text="Confirm" variant="primary"   size={6} onClick={confirmAssign} disabled={!assignTo} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <Modal id="tl-lead-edit" title="Edit Lead" size="md">
        {editRow && (
          <Grid cols={12} gap={4}>
            <DataField label="Name"   value={editRow.name}   size={6} onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))} />
            <DataField label="Mobile" value={editRow.mobile} size={6} onChange={(e) => setEditRow((p) => ({ ...p, mobile: e.target.value }))} />
            <SelectField label="Status" value={editRow.status} size={12} onChange={(e) => setEditRow((p) => ({ ...p, status: e.target.value }))}>
              {LEAD_STATUS_OPTIONS.map((s) => <Option key={s} value={s} label={s} />)}
            </SelectField>
            <Button text="Save Changes" variant="primary"   size={6} onClick={() => { setLeads((p) => p.map((l) => l.id === editRow.id ? editRow : l)); closeModal("tl-lead-edit"); }} />
            <Button text="Cancel"       variant="secondary" size={6} onClick={() => closeModal("tl-lead-edit")} />
          </Grid>
        )}
      </Modal>

    </div>
  );
}