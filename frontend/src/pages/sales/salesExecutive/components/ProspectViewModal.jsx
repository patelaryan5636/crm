import { Building } from "lucide-react";
import { Modal, ModalData, ModalGrid, closeModal, Button } from "../../../../components/shared/Common_Components";

export function ProspectViewModal({ prospect }) {
  return (
    <Modal id="prospect-view" title="Lead Details" size="lg">
      {!prospect ? (
        <p className="text-sm text-slate-500">No prospect selected.</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Contact</p>
            <p className="mt-2 text-lg font-black text-[#1a2e3f]">{prospect.name}</p>
            <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
              <Building size={14} />
              {prospect.company || "—"}
            </p>
          </div>

          <ModalGrid title="Lead & Prospect" cols={2}>
            <ModalData label="Phone" value={prospect.phone || "—"} />
            <ModalData label="Email" value={prospect.email || "—"} />
            <ModalData label="Lead Status" value={prospect.status || "—"} />
            <ModalData label="Priority" value={prospect.priority || "—"} />
            <ModalData label="Prospect Stage" value={prospect.stage || "Interested"} />
            <ModalData label="Pipeline Status" value={prospect.prospectStatus || "OPEN"} />
          </ModalGrid>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Requirement</p>
            <p className="text-sm text-slate-700 rounded-xl border border-slate-200 bg-white p-4 min-h-[72px]">
              {prospect.requirement?.trim() || "—"}
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button text="Close" variant="ghost" onClick={() => closeModal("prospect-view")} />
          </div>
        </div>
      )}
    </Modal>
  );
}
