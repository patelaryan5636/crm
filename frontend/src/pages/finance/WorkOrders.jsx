import React, { useState, useEffect } from "react";
import {
  Heading, DashGrid, DashCard, DataTable, Button,
  Modal, ModalProfile, ModalGrid, ModalData,
  DataField, SelectField, Option,
  openModal, closeModal,
} from "../../components/shared/Common_Components";
import { FileText, CheckCircle, PenLine, Clock, ThumbsUp, IndianRupee, Eye } from "lucide-react";
import { workOrderStore } from "./Workorderstore";

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — static work orders that exist before any client sends one
// ─────────────────────────────────────────────────────────────────────────────
const seedWOs = [
  {
    id: "WO-2025-001",
    clientId: "SEED-001",
    client: "Arjun Mehta",
    clientEmail: "arjun@example.com",
    clientMobile: "9876543210",
    salesExec: "Rahul Singh",
    service: "Website Development",
    requirements: [
      { id: 1, title: "UI Design",   cost: "25000", description: "Homepage + 4 inner pages" },
      { id: 2, title: "Development", cost: "45000", description: "React frontend"           },
      { id: 3, title: "SEO Setup",   cost: "10000", description: "On-page optimisation"     },
    ],
    totalCost:     80000,
    discountMode:  "Flat",
    discountValue: "5000",
    discountAmt:   5000,
    netPayable:    75000,
    paymentStatus: "Advance",
    advanceAmount: "30000",
    terms: "50% advance, 50% on delivery. Revisions capped at 3.",
    generatedDate: "2025-07-01",
    signedStatus:  "Signed",
    approvalStatus:"Approved",
  },
  {
    id: "WO-2025-002",
    clientId: "SEED-002",
    client: "Priya Sharma",
    clientEmail: "priya@example.com",
    clientMobile: "9823456789",
    salesExec: "Aarti Verma",
    service: "ERP Integration",
    requirements: [
      { id: 4, title: "ERP Customisation", cost: "200000", description: "" },
      { id: 5, title: "Staff Training",     cost: "50000",  description: "3-day on-site sessions" },
    ],
    totalCost:     250000,
    discountMode:  "Percentage",
    discountValue: "4",
    discountAmt:   10000,
    netPayable:    240000,
    paymentStatus: "Unpaid",
    advanceAmount: "",
    terms: "30% advance, 40% mid, 30% on completion.",
    generatedDate: "2025-07-05",
    signedStatus:  "Unsigned",
    approvalStatus:"Pending",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const statusBadge = (val, colorMap) => {
  const cls = colorMap[val] || "bg-slate-100 text-slate-600";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{val}</span>;
};

const payBadge = (val) => {
  const map = {
    Paid:    "bg-emerald-100 text-emerald-700",
    Unpaid:  "bg-rose-100 text-rose-700",
    Advance: "bg-sky-100 text-sky-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[val] || "bg-slate-100 text-slate-600"}`}>{val || "—"}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function WorkOrders() {
  const [wos, setWos]           = useState(seedWOs);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast]       = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  // ── Subscribe to new work orders pushed from Clients.jsx ─────────────────
  useEffect(() => {
    // Hydrate any entries pushed before this component mounted
    const existing = workOrderStore.getAll();
    if (existing.length) setWos((prev) => mergeWOs(prev, existing));

    // Live updates
    const unsub = workOrderStore.subscribe((all) => {
      setWos((prev) => mergeWOs(prev, all));
    });
    return unsub;
  }, []);

  // Merge incoming store entries with local state (no duplicates)
  const mergeWOs = (local, incoming) => {
    const ids = new Set(local.map((w) => w.id));
    const fresh = incoming.filter((w) => !ids.has(w.id));
    return fresh.length ? [...fresh, ...local] : local; // newest first
  };

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const total          = wos.length;
  const signed         = wos.filter((w) => w.signedStatus  === "Signed").length;
  const pendingApproval= wos.filter((w) => w.approvalStatus === "Pending").length;
  const approved       = wos.filter((w) => w.approvalStatus === "Approved").length;
  const fromClients    = wos.filter((w) => !w.id.startsWith("WO-2025")).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openView = (row) => { setSelected(row); openModal("wo-view"); };
  const openEdit = (row) => {
    setSelected(row);
    setEditForm({
      deliveryDate:  row.deliveryDate  || "",
      terms:         row.terms         || "",
      approvalStatus:row.approvalStatus|| "Pending",
      signedStatus:  row.signedStatus  || "Unsigned",
    });
    openModal("wo-edit");
  };
  const sendEmail = (row) =>
    showToast(`✅ Work order ${row.id} emailed to ${row.clientEmail}`);

  const markApproved = (row) =>
    setWos((prev) => prev.map((w) => w.id === row.id ? { ...w, approvalStatus: "Approved" } : w));

  const saveEdit = () => {
    setWos((prev) => prev.map((w) => w.id === selected.id ? { ...w, ...editForm } : w));
    closeModal("wo-edit");
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    { key: "id",     label: "WO ID" },
    { key: "client", label: "Client Name" },
    {
      key: "service", label: "Service",
      render: (v) => v || "—",
    },
    {
      key: "netPayable", label: "Net Payable",
      render: (v, row) => fmt(v ?? row.totalCost),
    },
    {
      key: "paymentStatus", label: "Payment",
      render: (v) => payBadge(v),
    },
    { key: "generatedDate", label: "Generated" },
    {
      key: "signedStatus", label: "Signed",
      render: (v) => statusBadge(v, {
        Signed:   "bg-emerald-100 text-emerald-700",
        Unsigned: "bg-rose-100 text-rose-700",
      }),
    },
    {
      key: "approvalStatus", label: "Approval",
      render: (v) => statusBadge(v, {
        Approved: "bg-emerald-100 text-emerald-700",
        Pending:  "bg-amber-100 text-amber-700",
        Rejected: "bg-rose-100 text-rose-700",
      }),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Toast */}
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* KPIs */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Work Orders" secondaryText="Management" size={12} />
        <DashCard title="Total Work Orders" value={total}          icon={<FileText   size={22}/>} accentColor="#3b82f6" size={2} />
        <DashCard title="From Clients"      value={fromClients}    icon={<PenLine    size={22}/>} accentColor="#8b5cf6" size={2} />
        <DashCard title="Signed"            value={signed}         icon={<CheckCircle size={22}/>} accentColor="#22c55e" size={2} />
        <DashCard title="Pending Approval"  value={pendingApproval}icon={<Clock      size={22}/>} accentColor="#f59e0b" size={3} />
        <DashCard title="Approved"          value={approved}       icon={<ThumbsUp   size={22}/>} accentColor="#14b8a6" size={3} />
      </DashGrid>

      {/* Table */}
      <DataTable
        title="All Work Orders"
        columns={columns}
        rows={wos}
        pageSize={10}
        searchable
        exportable
        exportFileName="work_orders"
        filters={[
          { title: "Signed",   key: "signedStatus",   type: "toggle", options: ["Signed", "Unsigned"] },
          { title: "Approval", key: "approvalStatus",  type: "toggle", options: ["Approved", "Pending"] },
          { title: "Payment",  key: "paymentStatus",   type: "toggle", options: ["Paid", "Unpaid", "Advance"] },
        ]}
        actions={[
          { icon: <Eye size={15} />,        tooltip: "View work order",    variant: "ghost",   onClick: openView     },
          { icon: <PenLine size={15} />,    tooltip: "Edit work order",    variant: "ghost", onClick: openEdit     },
          { icon: <FileText size={15} />,   tooltip: "Send work order email", variant: "ghost",   onClick: sendEmail  },
          { icon: <CheckCircle size={15} />, tooltip: "Approve work order", variant: "success",  onClick: markApproved },
        ]}
      />

      {/* ════════════════════════════════════════════════════════
          VIEW MODAL
      ════════════════════════════════════════════════════════ */}
      <Modal id="wo-view" title="Work Order Details" size="xl">
        {selected && (() => {
          const advPaid  = parseFloat(selected.advanceAmount) || 0;
          const remaining = Math.max(0, (selected.netPayable ?? selected.totalCost) - advPaid);
          return (
            <div className="flex flex-col gap-4">

              <ModalProfile
                name={selected.client}
                subtitle={`${selected.service || "—"}  ·  Sales: ${selected.salesExec || "—"}`}
                meta={`WO ID: ${selected.id}  ·  Generated: ${selected.generatedDate}`}
              />

              {/* Client contact */}
              <ModalGrid title="Client Contact" cols={2}>
                <ModalData label="Email"  value={selected.clientEmail}  />
                <ModalData label="Mobile" value={selected.clientMobile} />
              </ModalGrid>

              {/* Requirements breakdown */}
              {selected.requirements?.length > 0 && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  {/* header */}
                  <div className="grid grid-cols-[1fr_140px] px-4 py-2 bg-[#2a465a]/5 border-b border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Requirement</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cost</span>
                  </div>
                  {selected.requirements.map((r, idx) => (
                    <div
                      key={r.id}
                      className={`grid grid-cols-[1fr_140px] px-4 py-3 border-b border-slate-100 last:border-0
                        ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
                    >
                      <div>
                        <p className="text-sm font-bold text-[#2a465a]">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>
                        )}
                      </div>
                      <p className="text-sm font-black text-[#2a465a] text-right self-center">{fmt(r.cost)}</p>
                    </div>
                  ))}
                  {/* totals */}
                  <div className="grid grid-cols-[1fr_140px] px-4 py-2 bg-slate-50 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400">Total Cost</span>
                    <span className="text-sm font-black text-[#2a465a] text-right">{fmt(selected.totalCost)}</span>
                  </div>
                  {selected.discountAmt > 0 && (
                    <div className="grid grid-cols-[1fr_140px] px-4 py-2 bg-slate-50 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-400">
                        Discount ({selected.discountMode === "Percentage" ? `${selected.discountValue}%` : fmt(selected.discountValue)})
                      </span>
                      <span className="text-sm font-black text-rose-500 text-right">- {fmt(selected.discountAmt)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_140px] px-4 py-2.5 bg-[#2a465a]">
                    <span className="text-xs font-black text-white/70 uppercase tracking-widest">Net Payable</span>
                    <span className="text-sm font-black text-white text-right flex items-center justify-end gap-0.5">
                      <IndianRupee size={12} />
                      {Number(selected.netPayable ?? selected.totalCost).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment details */}
              <ModalGrid title="Payment" cols={3}>
                <ModalData label="Payment Status" value={selected.paymentStatus || "—"} />
                {selected.paymentStatus === "Advance" && (
                  <>
                    <ModalData label="Advance Paid"  value={fmt(selected.advanceAmount)} />
                    <ModalData label="Remaining"     value={fmt(remaining)}              />
                  </>
                )}
              </ModalGrid>

              {/* Status */}
              <ModalGrid title="Work Order Status" cols={2}>
                <ModalData label="Signed Status"   value={selected.signedStatus}   />
                <ModalData label="Approval Status" value={selected.approvalStatus} />
              </ModalGrid>

              {/* Terms */}
              {selected.terms && (
                <ModalGrid title="Terms & Conditions" cols={1}>
                  <ModalData label="Terms" value={selected.terms} />
                </ModalGrid>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("wo-view")} />
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ════════════════════════════════════════════════════════
          EDIT MODAL
      ════════════════════════════════════════════════════════ */}
      <Modal id="wo-edit" title="Edit Work Order" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selected.client}
              subtitle={selected.service || "—"}
              meta={`WO ID: ${selected.id}`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataField
                label="Delivery Date"
                id="wo-delivery"
                type="date"
                value={editForm.deliveryDate}
                onChange={(e) => setEditForm((p) => ({ ...p, deliveryDate: e.target.value }))}
                size={12}
              />
              <SelectField
                label="Approval Status"
                id="wo-approval"
                value={editForm.approvalStatus}
                onChange={(e) => setEditForm((p) => ({ ...p, approvalStatus: e.target.value }))}
              >
                <Option value="Pending"  label="Pending"  />
                <Option value="Approved" label="Approved" />
              </SelectField>
              <SelectField
                label="Signed Status"
                id="wo-signed"
                value={editForm.signedStatus}
                onChange={(e) => setEditForm((p) => ({ ...p, signedStatus: e.target.value }))}
              >
                <Option value="Unsigned" label="Unsigned" />
                <Option value="Signed"   label="Signed"   />
              </SelectField>
            </div>
            <DataField
              label="Terms & Conditions"
              id="wo-terms"
              type="textarea"
              rows={4}
              value={editForm.terms}
              onChange={(e) => setEditForm((p) => ({ ...p, terms: e.target.value }))}
              size={12}
            />
            <div className="flex gap-3 justify-end pt-2">
              <Button text="Cancel"       variant="ghost"    size={3} onClick={() => closeModal("wo-edit")} />
              <Button text="Save Changes" variant="primary"  size={3} onClick={saveEdit}                   />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}