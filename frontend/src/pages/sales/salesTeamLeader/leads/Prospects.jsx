import { useState, useMemo } from "react";
import {
  DataTable, Modal, Button, DataField, SelectField, Option,
  openModal, closeModal, ModalProfile, ModalData, ModalGrid, Grid,
  DashGrid, DashCard,
} from "../../../../components/shared/Common_Components.jsx";
import {
  Eye, Pencil, Phone, MessageCircle, Flame, Snowflake, Activity, Target,
} from "lucide-react";
import { INITIAL_PROSPECTS, executiveNames, teamExecutives } from "./leadsStore";

const COLS = [
  { key: "name",          label: "Name"           },
  { key: "companyName",   label: "Company"        },
  { key: "mobile",        label: "Mobile"         },
  { key: "service",       label: "Service"        },
  { key: "budget",        label: "Budget"         },
  { key: "assignedExec",  label: "Assigned To"    },
  { key: "expectedClose", label: "Expected Close" },
  { key: "status",        label: "Status"         },
];

const STATUS_OPTIONS = ["Hot", "Warm", "Cold"];

const stripPhone = (m) => (m || "").replace(/\D/g, "");

export default function Prospects() {
  const [prospects, setProspects] = useState(INITIAL_PROSPECTS);
  const [viewRow,   setViewRow]   = useState(null);
  const [editRow,   setEditRow]   = useState(null);

  const callLead     = (row) => { window.location.href = `tel:${stripPhone(row.mobile)}`; };
  const whatsappLead = (row) => { window.open(`https://wa.me/${stripPhone(row.mobile)}`, "_blank", "noopener"); };

  const saveEdit = () => {
    setProspects((prev) => prev.map((p) => p.id === editRow.id ? editRow : p));
    closeModal("tl-prosp-edit");
  };

  const total = prospects.length;
  const hot   = useMemo(() => prospects.filter((p) => p.status === "Hot").length,  [prospects]);
  const warm  = useMemo(() => prospects.filter((p) => p.status === "Warm").length, [prospects]);
  const cold  = useMemo(() => prospects.filter((p) => p.status === "Cold").length, [prospects]);

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <DashGrid cols={12} gap={4}>
        <DashCard title="Total Prospects" value={String(total)} icon={<Target    size={22} />} accentColor="#3b82f6" size={3} />
        <DashCard title="Hot"             value={String(hot)}   icon={<Flame     size={22} />} accentColor="#f43f5e" size={3} />
        <DashCard title="Warm"            value={String(warm)}  icon={<Activity  size={22} />} accentColor="#f59e0b" size={3} />
        <DashCard title="Cold"            value={String(cold)}  icon={<Snowflake size={22} />} accentColor="#38bdf8" size={3} />
      </DashGrid>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <DataTable
        title="Team Prospects"
        columns={COLS}
        rows={prospects}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="team_prospects"
        filters={[
          { title: "Status",      type: "toggle", key: "status",      options: STATUS_OPTIONS },
          { title: "Assigned To", type: "select", key: "assignedExec", options: executiveNames },
        ]}
        actions={[
          { icon: <Eye size={15} />,           tooltip: "View",     variant: "ghost",
            onClick: (row) => { setViewRow(prospects.find((p) => p.id === row.id)); openModal("tl-prosp-view"); } },
          { icon: <Phone size={15} />,         tooltip: "Call",     variant: "ghost",   onClick: callLead },
          { icon: <MessageCircle size={15} />, tooltip: "WhatsApp", variant: "ghost",   onClick: whatsappLead },
          { icon: <Pencil size={15} />,        tooltip: "Edit",     variant: "primary",
            onClick: (row) => { setEditRow({ ...prospects.find((p) => p.id === row.id) }); openModal("tl-prosp-edit"); } },
        ]}
      />

      {/* ── View modal ────────────────────────────────────────────────────── */}
      <Modal id="tl-prosp-view" title="Prospect Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={viewRow.name}
              subtitle={`${viewRow.companyName} · ${viewRow.status}`}
              meta={`ID: ${viewRow.id} · Assigned to ${viewRow.assignedExec}`}
            />
            <ModalGrid title="Contact" cols={2}>
              <ModalData label="Mobile" value={viewRow.mobile} />
              <ModalData label="Email"  value={viewRow.email}  />
            </ModalGrid>
            <ModalGrid title="Deal Info" cols={2}>
              <ModalData label="Service"        value={viewRow.service}       />
              <ModalData label="Budget"         value={viewRow.budget}        />
              <ModalData label="Expected Close" value={viewRow.expectedClose} />
              <ModalData label="Status"         value={viewRow.status}        />
            </ModalGrid>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button text="Call"     variant="ghost"   size={2} onClick={() => callLead(viewRow)} />
              <Button text="WhatsApp" variant="ghost"   size={3} onClick={() => whatsappLead(viewRow)} />
              <Button text="Close"    variant="primary" size={3} onClick={() => closeModal("tl-prosp-view")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <Modal id="tl-prosp-edit" title="Update Prospect" size="md">
        {editRow && (
          <Grid cols={12} gap={4}>
            <DataField label="Name"           value={editRow.name}          size={6} onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))} />
            <DataField label="Company"        value={editRow.companyName}   size={6} onChange={(e) => setEditRow((p) => ({ ...p, companyName: e.target.value }))} />
            <DataField label="Mobile"         value={editRow.mobile}        size={6} onChange={(e) => setEditRow((p) => ({ ...p, mobile: e.target.value }))} />
            <DataField label="Email"          value={editRow.email}         size={6} type="email" onChange={(e) => setEditRow((p) => ({ ...p, email: e.target.value }))} />
            <DataField label="Service"        value={editRow.service}       size={6} onChange={(e) => setEditRow((p) => ({ ...p, service: e.target.value }))} />
            <DataField label="Budget"         value={editRow.budget}        size={6} onChange={(e) => setEditRow((p) => ({ ...p, budget: e.target.value }))} />
            <DataField label="Expected Close" value={editRow.expectedClose} size={6} type="date" onChange={(e) => setEditRow((p) => ({ ...p, expectedClose: e.target.value }))} />
            <SelectField label="Assigned To" value={editRow.assignedExec} size={6} onChange={(e) => setEditRow((p) => ({ ...p, assignedExec: e.target.value }))}>
              {teamExecutives.map((ex) => <Option key={ex.id} value={ex.name} label={ex.name} />)}
            </SelectField>
            <SelectField label="Status" value={editRow.status} size={6} onChange={(e) => setEditRow((p) => ({ ...p, status: e.target.value }))}>
              {STATUS_OPTIONS.map((s) => <Option key={s} value={s} label={s} />)}
            </SelectField>
            <Button text="Save Changes" variant="primary"   size={6} onClick={saveEdit} />
            <Button text="Cancel"       variant="secondary" size={6} onClick={() => closeModal("tl-prosp-edit")} />
          </Grid>
        )}
      </Modal>

    </div>
  );
}