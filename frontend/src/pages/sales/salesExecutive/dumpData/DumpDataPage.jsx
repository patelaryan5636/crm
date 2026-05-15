/**
 * DumpDataPage — Sales Executive
 *
 * Shows dump leads that belong to the logged-in Sales Executive only.
 * Tenant-scoped: admin._id + assignedTo = current user.
 *
 * Rules:
 *  - Executive can VIEW their own dump leads (view modal only)
 *  - Restore is Manager/Admin only — not shown to Sales Executive
 */
import { Archive, CalendarX2, Database, RotateCcw } from 'lucide-react';
import {
  Button,
  DashGrid,
  EnhancedDashCard,
  Heading,
  Modal,
  ModalData,
  ModalGrid,
  ModalProfile,
  closeModal,
} from '../../../../components/shared/Common_Components';
import { DumpedLeadsTable } from './components/DumpedLeadsTable';
import { useDumpData } from './hooks/useDumpData';

export default function DumpDataPage() {
  const {
    tableRows,
    stats,
    reasonOptions,
    loading,
    error,
    viewTarget,
    openViewModal,
    reload,
  } = useDumpData();

  const statCards = [
    {
      title: 'Dump Leads',
      value: String(stats.totalDump ?? 0),
      icon: <Archive size={20} />,
      accentColor: '#f43f5e',
    },
    {
      title: 'No Response',
      value: String(stats.noResponse ?? 0),
      icon: <CalendarX2 size={20} />,
      accentColor: '#f59e0b',
    },
    {
      title: 'Today Dumped',
      value: String(stats.todayDumped ?? 0),
      icon: <Database size={20} />,
      accentColor: '#38bdf8',
    },
    {
      title: 'Restore Access',
      value: stats.restoreAccess ?? 'Manager',
      icon: <RotateCcw size={20} />,
      accentColor: '#64748b',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Heading primaryText="Dump Data" />

      {/* ── Stats ── */}
      <DashGrid cols={12} gap={4}>
        {statCards.map((item) => (
          <EnhancedDashCard
            key={item.title}
            title={item.title.toUpperCase()}
            value={item.value}
            icon={item.icon}
            accentColor={item.accentColor}
            size={3}
          />
        ))}
      </DashGrid>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => reload()}
            className="ml-4 underline text-red-300 hover:text-red-200 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table (view only — no restore action) ── */}
      <DumpedLeadsTable
        rows={tableRows}
        reasonOptions={reasonOptions}
        loading={loading}
        onView={openViewModal}
      />

      {/* ── View Modal ── */}
      <Modal id="dump-view-modal" title="Dump Lead Details" size="md">
        {viewTarget && (
          <div className="space-y-5">
            <ModalProfile
              name={viewTarget.name}
              subtitle={viewTarget.mobile}
              meta={viewTarget.email}
            />

            <ModalGrid title="Dump Info" cols={2}>
              <ModalData label="Company"        value={viewTarget.companyName} />
              <ModalData label="Dump Reason"    value={viewTarget.dumpReason} />
              <ModalData label="Dumped By"      value={viewTarget.dumpedBy} />
              <ModalData label="Dump Date"      value={viewTarget.dumpDate} />
              <ModalData label="Not Talk Count" value={String(viewTarget.notTalkCount ?? 0)} />
              <ModalData label="Last Contacted" value={viewTarget.lastContactedAt ?? '—'} />
            </ModalGrid>

            <div className="flex justify-end pt-1">
              <Button
                text="Close"
                variant="secondary"
                size={3}
                onClick={() => closeModal('dump-view-modal')}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
