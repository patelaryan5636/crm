/**
 * DumpLeadModal — Reusable modal for dump lead actions.
 *
 * When `managerOnly` is true, shows an info notice that restore
 * is restricted to Sales Manager / Admin only.
 */
import {
  Button,
  Modal,
  ModalData,
  ModalGrid,
  ModalProfile,
  closeModal,
} from '../../../../../components/shared/Common_Components';

export function DumpLeadModal({
  id,
  title,
  lead,
  infoTitle,
  confirmText,
  confirmVariant,
  onConfirm,
  managerOnly = false,
}) {
  return (
    <Modal id={id} title={title} size="md">
      {lead && (
        <div className="space-y-5">
          <ModalProfile
            name={lead.name}
            subtitle={lead.mobile}
            meta={lead.companyName}
          />

          <ModalGrid title={infoTitle} cols={2}>
            <ModalData label="Reason"    value={lead.dumpReason} />
            <ModalData label="Dump Date" value={lead.dumpDate} />
            <ModalData label="Email"     value={lead.email} />
            <ModalData label="Dumped By" value={lead.dumpedBy} />
          </ModalGrid>

          {/* Manager-only notice */}
          {managerOnly && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              ℹ️ Restoring dump leads is restricted to <strong>Sales Manager</strong> or{' '}
              <strong>Admin</strong>. Please contact your manager to restore this lead.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              text="Cancel"
              variant="secondary"
              size={3}
              onClick={() => closeModal(id)}
            />
            <Button
              text={confirmText}
              variant={confirmVariant}
              size={3}
              onClick={onConfirm}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
