import { useCallback, useEffect, useState } from "react";
import {
  Heading, DashGrid, EnhancedDashCard, DataTable, Button,
  Modal, ModalProfile, ModalGrid, ModalData,
  openModal, closeModal,
} from "../../../components/shared/Common_Components";
import {
  FileText, CheckCircle, Clock, IndianRupee, Eye, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../../../services/apiClient";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const payBadge = (v) => {
  const map = { Paid: "bg-emerald-100 text-emerald-700", Unpaid: "bg-rose-100 text-rose-700", Advance: "bg-sky-100 text-sky-700" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[v] || "bg-slate-100 text-slate-600"}`}>{v || "—"}</span>;
};
const signBadge = (v) => {
  const cls = v === "Signed" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{v || "Unsigned"}</span>;
};

export default function ManagementManagerWorkOrders() {
  const [wos, setWos] = useState([]);
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/management/work-orders");
      const d = res?.data?.data || {};
      setWos(d.workOrders || []);
      setStats(d.stats || {});
    } catch (err) {
      toast.error(err?.message || "Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openView = (row) => { setSelected(row); openModal("mgmt-wo-view"); };

  const columns = [
    { key: "woNumber", label: "WO #" },
    { key: "client", label: "Client" },
    { key: "service", label: "Service", render: (v) => v || "—" },
    { key: "netPayable", label: "Net Payable", render: (v) => fmt(v) },
    { key: "paymentStatus", label: "Payment", render: (v) => payBadge(v) },
    { key: "signedStatus", label: "Signed", render: (v) => signBadge(v) },
    { key: "deliveryDate", label: "Delivery", render: (v) => fmtDate(v) },
    { key: "sentToManagementAt", label: "Received On", render: (v) => fmtDate(v) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Work Orders" secondaryText="Assigned to Management" size={12} />
        <EnhancedDashCard title="Total Assigned" value={stats.total || 0} icon={<FileText size={22} />} accentColor="#3b82f6" size={3} />
        <EnhancedDashCard title="Signed" value={stats.signed || 0} icon={<CheckCircle size={22} />} accentColor="#22c55e" size={3} />
        <EnhancedDashCard title="Unsigned" value={stats.unsigned || 0} icon={<Clock size={22} />} accentColor="#f59e0b" size={3} />
        <EnhancedDashCard title="Paid" value={stats.paid || 0} icon={<IndianRupee size={22} />} accentColor="#14b8a6" size={3} />
      </DashGrid>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading work orders…
        </div>
      )}

      {!loading && (
        <DataTable
          title="Approved Work Orders"
          columns={columns}
          rows={wos}
          pageSize={10}
          actions={[
            { icon: <Eye size={15} />, tooltip: "View Details", variant: "ghost", onClick: openView },
          ]}
        />
      )}

      {/* ── View Modal ─────────────────────────────────────────────────────── */}
      <Modal id="mgmt-wo-view" title="Work Order Details" size="xl">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1e293b] rounded-2xl p-5 text-white flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black">{selected.woNumber}</h2>
                <p className="text-xs text-white/60 mt-1">{selected.service || "—"}</p>
                <p className="text-xs text-white/60">Received: {fmtDate(selected.sentToManagementAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {signBadge(selected.signedStatus)}
                {payBadge(selected.paymentStatus)}
              </div>
            </div>

            <ModalProfile
              name={selected.client}
              subtitle={selected.clientEmail || "—"}
              meta={`Mobile: ${selected.clientMobile || "—"} · Sales: ${selected.salesExec || "—"}`}
            />

            {(selected.requirements || []).length > 0 && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1fr_120px] px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
                  <span>Requirement</span><span className="text-right">Cost</span>
                </div>
                {selected.requirements.map((r, i) => (
                  <div key={i} className={`grid grid-cols-[1fr_120px] px-4 py-3 border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{r.title}</p>
                      {r.description && <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>}
                    </div>
                    <p className="text-sm font-black text-slate-800 text-right self-center">{fmt(r.cost)}</p>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_120px] px-4 py-3 bg-[#1e293b]">
                  <span className="text-xs font-black text-white/70 uppercase tracking-widest">Net Payable</span>
                  <span className="text-sm font-black text-white text-right">{fmt(selected.netPayable)}</span>
                </div>
              </div>
            )}

            <ModalGrid title="Project Details" cols={2}>
              <ModalData label="Payment Status" value={selected.paymentStatus} />
              <ModalData label="Advance Amount" value={fmt(selected.advanceAmount)} />
              <ModalData label="Signed Status" value={selected.signedStatus} />
              <ModalData label="Signed By" value={selected.signedByName || "—"} />
              <ModalData label="Delivery Date" value={fmtDate(selected.deliveryDate)} />
              <ModalData label="Approved At" value={fmtDate(selected.approvedAt)} />
            </ModalGrid>

            {selected.terms && (
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg px-4 py-3 text-sm text-blue-800">
                <strong>Terms:</strong> {selected.terms}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("mgmt-wo-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
