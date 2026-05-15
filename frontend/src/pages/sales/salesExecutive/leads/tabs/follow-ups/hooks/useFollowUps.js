/**
 * useFollowUps — Sales Executive Follow-Ups Hook
 * Fetches and manages follow-up reminders from the real backend API.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchFollowUps, markFollowUpDone } from '../api/followUpsApi';

export function useFollowUps() {
  const [reminders, setReminders] = useState([]);
  const [stats, setStats]         = useState({ today: 0, expired: 0, thisWeek: 0, completed: 0 });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // ── Fetch from backend ──
  const loadFollowUps = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFollowUps(params);
      setReminders(result.reminders || []);
      setStats(result.stats || { today: 0, expired: 0, thisWeek: 0, completed: 0 });
    } catch (err) {
      const msg = err?.message || 'Failed to load follow-ups';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  // ── Mark done ──
  const markDone = useCallback(async (id) => {
    try {
      await markFollowUpDone(id);
      // Update local state
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isDone: true, status: 'done' } : r))
      );
      toast.success('Follow-up marked as done');
    } catch (err) {
      toast.error(err?.message || 'Failed to mark follow-up as done');
    }
  }, []);

  // ── Derive unique type options for filter ──
  const typeOptions = useMemo(
    () => [...new Set(reminders.map((r) => r.type).filter(Boolean))],
    [reminders],
  );

  return {
    reminders,
    stats,
    loading,
    error,
    typeOptions,
    reload: loadFollowUps,
    markDone,
  };
}
