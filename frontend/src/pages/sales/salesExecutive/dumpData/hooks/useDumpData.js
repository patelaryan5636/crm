/**
 * useDumpData — Sales Executive Dump Data Hook
 *
 * Fetches dump leads from the real backend API.
 * Scoped to: current executive (assignedTo) + admin tenant.
 *
 * Rules from planning.md:
 *  - Sales Executive can VIEW their own dump leads only
 *  - Restore is Manager/Admin only — not exposed here
 *  - Never hard-delete leads
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { openModal } from '../../../../../components/shared/Common_Components';
import { fetchDumpLeads } from '../api/dumpDataApi';

export function useDumpData() {
  const [leads, setLeads]           = useState([]);
  const [stats, setStats]           = useState({ totalDump: 0, noResponse: 0, todayDumped: 0, restoreAccess: 'Manager' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, totalRecords: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const [viewTarget, setViewTarget] = useState(null);

  // ── Fetch from backend ──
  const loadDumpLeads = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDumpLeads(params);
      setLeads(result.leads       || []);
      setStats(result.stats       || { totalDump: 0, noResponse: 0, todayDumped: 0, restoreAccess: 'Manager' });
      setPagination(result.pagination || { page: 1, pageSize: 50, totalRecords: 0, totalPages: 1 });
    } catch (err) {
      const msg = err?.message || 'Failed to load dump leads';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDumpLeads();
  }, [loadDumpLeads]);

  // ── Derive unique reason options for filter dropdown ──
  const reasonOptions = useMemo(
    () => [...new Set(leads.map((l) => l.dumpReason).filter(Boolean))],
    [leads],
  );

  const tableRows = useMemo(() => leads, [leads]);

  const openViewModal = useCallback((lead) => {
    setViewTarget(lead);
    openModal('dump-view-modal');
  }, []);

  return {
    leads,
    tableRows,
    stats,
    pagination,
    loading,
    error,
    reasonOptions,
    viewTarget,
    openViewModal,
    reload: loadDumpLeads,
  };
}
