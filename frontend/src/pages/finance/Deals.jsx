import { useState } from "react";
import {
  Heading, DashGrid, DashCard, DataTable, Button,
  Modal, ModalProfile, ModalGrid, ModalData,
  DataField, SelectField, Option,
  openModal, closeModal,
} from "../../components/shared/Common_Components";
import { Briefcase, Clock, CheckCircle, Tag, Eye, Pencil } from "lucide-react";

// ── Dummy Data ────────────────────────────────────────────────────────────────
const initialDeals = [
  {
    id: "DEAL-001", client: "Arjun Mehta", mobile: "9876543210", email: "arjun@example.com",
    suggestedServices: "SEO, Social Media", suggestedAmount: 85000,
    discountType: "Flat", discount: 5000, finalAmount: 80000,
    status: "Pending", salesExec: "Rahul Singh",
    finalServices: "SEO, Social Media", notes: "Client wants monthly reports.",
  },
  {
    id: "DEAL-002", client: "Priya Sharma", mobile: "9823456789", email: "priya@example.com",
    suggestedServices: "Website Development", suggestedAmount: 150000,
    discountType: "Percentage", discount: 10, finalAmount: 135000,
    status: "Finalized", salesExec: "Aarti Verma",
    finalServices: "Website Development, Maintenance", notes: "Includes 1 year support.",
  },
  {
    id: "DEAL-003", client: "TechNova Pvt Ltd", mobile: "9988776655", email: "contact@technova.in",
    suggestedServices: "ERP Integration", suggestedAmount: 320000,
    discountType: "Flat", discount: 20000, finalAmount: 300000,
    status: "Pending", salesExec: "Suresh Patel",
    finalServices: "ERP Integration", notes: "Q3 delivery required.",
  },
  {
    id: "DEAL-004", client: "Kavya Nair", mobile: "9012345678", email: "kavya@nair.com",
    suggestedServices: "Brand Design", suggestedAmount: 45000,
    discountType: "None", discount: 0, finalAmount: 45000,
    status: "Finalized", salesExec: "Rahul Singh",
    finalServices: "Brand Design, Logo", notes: "Rush delivery.",
  },
  {
    id: "DEAL-005", client: "Rohan Gupta", mobile: "9812398123", email: "rohan@gupta.com",
    suggestedServices: "Google Ads, Meta Ads", suggestedAmount: 60000,
    discountType: "Percentage", discount: 5, finalAmount: 57000,
    status: "Pending", salesExec: "Aarti Verma",
    finalServices: "Google Ads, Meta Ads", notes: "Budget capped at ₹57k.",
  },
];

const statusColor = (s) =>
  s === "Finalized" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";

export default function Deals() {
  const [deals, setDeals] = useState(initialDeals);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});

  const totalDeals = deals.length;
  const pendingDeals = deals.filter(d => d.status === "Pending").length;
  const finalizedDeals = deals.filter(d => d.status === "Finalized").length;
  const totalDiscount = deals.reduce((acc, d) => {
    if (d.discountType === "Flat") return acc + d.discount;
    if (d.discountType === "Percentage") return acc + Math.round(d.suggestedAmount * d.discount / 100);
    return acc;
  }, 0);

  const openView = (row) => { setSelected(row); openModal("deal-view"); };
  const openEdit = (row) => {
    setSelected(row);
    setEditForm({
      finalServices: row.finalServices,
      discountType: row.discountType,
      discount: row.discount,
      finalAmount: row.finalAmount,
      notes: row.notes,
      status: row.status,
    });
    openModal("deal-edit");
  };

  const calcFinalAmount = (form, suggested) => {
    const disc = parseFloat(form.discount) || 0;
    if (form.discountType === "Flat") return suggested - disc;
    if (form.discountType === "Percentage") return suggested - Math.round(suggested * disc / 100);
    return suggested;
  };

  const handleEditChange = (field, val) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: val };
      if (field === "discountType" || field === "discount") {
        updated.finalAmount = calcFinalAmount(updated, selected?.suggestedAmount ?? 0);
      }
      return updated;
    });
  };

  const saveEdit = () => {
    setDeals(prev => prev.map(d => d.id === selected.id ? { ...d, ...editForm } : d));
    closeModal("deal-edit");
  };

  const finalizeFromEdit = () => {
    const updated = { ...editForm, status: "Finalized" };
    setDeals(prev => prev.map(d => d.id === selected.id ? { ...d, ...updated } : d));
    closeModal("deal-edit");
  };

  const columns = [
    { key: "id", label: "Deal ID" },
    { key: "client", label: "Client Name" },
    { key: "mobile", label: "Mobile" },
    { key: "email", label: "Email" },
    { key: "suggestedServices", label: "Suggested Services" },
    { key: "suggestedAmount", label: "Suggested Amt", render: v => `₹${v.toLocaleString()}` },
    { key: "discount", label: "Discount", render: (v, row) => row.discountType === "Percentage" ? `${v}%` : `₹${v}` },
    { key: "finalAmount", label: "Final Amt", render: v => `₹${v.toLocaleString()}` },
    {
      key: "status", label: "Status",
      render: v => <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor(v)}`}>{v}</span>
    },
  ];

  return (
    <div>
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Deals" secondaryText="Finalization" size={12} />
        <DashCard title="Total Deals" value={totalDeals} icon={<Briefcase size={22} />} accentColor="#3b82f6" size={3} />
        <DashCard title="Pending Finalization" value={pendingDeals} icon={<Clock size={22} />} accentColor="#f59e0b" size={3} />
        <DashCard title="Finalized Deals" value={finalizedDeals} icon={<CheckCircle size={22} />} accentColor="#22c55e" size={3} />
        <DashCard title="Discount Given" value={`₹${totalDiscount.toLocaleString()}`} icon={<Tag size={22} />} accentColor="#8b5cf6" size={3} />
        
        <DataTable
          title="All Deals"
          columns={columns}
          rows={deals}
          pageSize={10}
          actions={[
            { icon: <Eye size={15}/>,    tooltip: "View Details", variant: "ghost",   onClick: openView },
            { icon: <Pencil size={15}/>, tooltip: "Edit Deal",    variant: "primary", onClick: openEdit },
          ]}
        />
      </DashGrid>

      {/* View Modal */}
      <Modal id="deal-view" title="Deal Details" size="lg">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selected.client}
              subtitle={`Sales Exec: ${selected.salesExec}`}
              meta={`Deal ID: ${selected.id}`}
            />
            <ModalGrid title="Client Info" cols={2}>
              <ModalData label="Mobile" value={selected.mobile} />
              <ModalData label="Email" value={selected.email} />
            </ModalGrid>
            <ModalGrid title="Deal Info" cols={2}>
              <ModalData label="Suggested Services" value={selected.suggestedServices} />
              <ModalData label="Final Services" value={selected.finalServices} />
              <ModalData label="Suggested Amount" value={`₹${selected.suggestedAmount?.toLocaleString()}`} />
              <ModalData label="Discount" value={selected.discountType === "Percentage" ? `${selected.discount}%` : `₹${selected.discount}`} />
              <ModalData label="Final Amount" value={`₹${selected.finalAmount?.toLocaleString()}`} />
              <ModalData label="Status" value={selected.status} />
            </ModalGrid>
            <ModalGrid title="Notes" cols={1}>
              <ModalData label="Notes" value={selected.notes || "—"} />
            </ModalGrid>
            <div className="flex justify-end pt-2">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("deal-view")} />
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal id="deal-edit" title="Edit Deal" size="lg">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={selected.client}
              subtitle={`Deal ID: ${selected.id}`}
              meta={`Suggested Amount: ₹${selected.suggestedAmount?.toLocaleString()}`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataField label="Final Services" id="finalServices" value={editForm.finalServices} onChange={e => handleEditChange("finalServices", e.target.value)} size={12} />
              <SelectField label="Discount Type" id="discountType" value={editForm.discountType} onChange={e => handleEditChange("discountType", e.target.value)} size={12}>
                <Option value="None" label="None" />
                <Option value="Flat" label="Flat (₹)" />
                <Option value="Percentage" label="Percentage (%)" />
              </SelectField>
              <DataField label="Discount Value" id="discount" type="number" value={editForm.discount} onChange={e => handleEditChange("discount", e.target.value)} size={12} />
              <DataField label="Final Amount (₹)" id="finalAmount" type="number" value={editForm.finalAmount} readOnly size={12} />
              <SelectField label="Status" id="status" value={editForm.status} onChange={e => handleEditChange("status", e.target.value)} size={12}>
                <Option value="Pending" label="Pending" />
                <Option value="Finalized" label="Finalized" />
              </SelectField>
              <DataField label="Notes" id="notes" type="textarea" value={editForm.notes} onChange={e => handleEditChange("notes", e.target.value)} size={12} />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button text="Cancel" variant="ghost" size={3} onClick={() => closeModal("deal-edit")} />
              <Button text="Save Changes" variant="secondary" size={3} onClick={saveEdit} />
              <Button text="Finalize Deal ✓" variant="success" size={3} onClick={finalizeFromEdit} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}