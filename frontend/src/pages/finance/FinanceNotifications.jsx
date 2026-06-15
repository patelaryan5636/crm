import { useState, useEffect, useCallback, useRef } from "react";
import {
  Heading, DashGrid, EnhancedDashCard, DataTable,
  Button, Modal, ModalData, ModalGrid, ModalProfile,
  openModal, closeModal,
} from "../../components/shared/Common_Components";
import {
  Bell, CreditCard, FileText, Briefcase, CheckCircle2,
  Eye, BookCheck, Trash2, RefreshCw, AlertCircle,
  BellOff, Users, Filter, CheckCheck, XCircle,
} from "lucide-react";
import financeNotificationService from "../../services/financeNotificationService";

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS    = ["ALL", "PAYMENT", "INVOICE", "WORK_ORDER", "PROSPECT"];
const STATUS_OPTIONS  = ["ALL", "UNREAD", "READ"];
const PRIORITY_OPTIONS = ["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"];

const TYPE_LABELS = {
  PAYMENT:    "Payment",
  INVOICE:    "Invoice",
  WORK_ORDER: "Work Order",
  PROSPECT:   "Prospect",
  ALL:        "All Types",
};

const TYPE_COLORS = {
  PAYMENT:    "bg-blue-100 text-blue-700",
  INVOICE:    "bg-purple-100 text-purple-700",
  WORK_ORDER: "bg-amber-100 text-amber-700",
  PROSPECT:   "bg-emerald-100 text-emerald-700",
};

const PRIORITY_COLORS = {
  URGENT: "bg-red-100 text-red-700",
  HIGH:   "bg-orange-100 text-orange-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW:    "bg-slate-100 text-slate-600",
};

const SUBTYPE_LABELS = {
  PAYMENT_RECEIVED:   "Payment Received",
  PAYMENT_FAILED:     "Payment Failed",
  PAYMENT_PENDING:    "Payment Pending",
  INVOICE_SENT:       "Invoice Generated",
  INVOICE_OVERDUE:    "Invoice Overdue",
  INVOICE_PAID:       "Invoice Paid",
  WO_PENDING_APPROVAL:"Work Order Pending Approval",
  WO_SIGNED:          "Work Order Signed",
  PROSPECT_CREATED:   "New Prospect",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function TypeBadge({ type }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${TYPE_COLORS[type] ?? "bg-slate-100 text-slate-500"}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${PRIORITY_COLORS[priority] ?? "bg-slate-100 text-slate-500"}`}>
      {priority}
    </span>
  );
}

function StatusDot({ isRead }) {
  return isRead
    ? <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">Read</span>
    : <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-600"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />Unread</span>;
}

function TypeIcon({ type }) {
  const cls = "shrink-0";
  if (type === "PAYMENT")    return <CreditCard size={16} className={cls} />;
  if (type === "INVOICE")    return <FileText   size={16} className={cls} />;
  if (type === "WORK_ORDER") return <Briefcase  size={16} className={cls} />;
  if (type === "PROSPECT")   return <Users      size={16} className={cls} />;
  return <Bell size={16} className={cls} />;
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs underline font-medium flex items-center gap-1">
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

// ─── table columns ────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "statusDot",  label: "" },
  { key: "title",      label: "Title" },
  { key: "typeBadge",  label: "Type" },
  { key: "priorityBadge", label: "Priority" },
  { key: "client",     label: "Client" },
  { key: "amount",     label: "Amount" },
  { key: "fmtDate",    label: "Date & Time" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FinanceNotifications() {
  // ── State ────────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [summary,       setSummary]       = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [summLoading,   setSummLoading]   = useState(true);
  const [error,         setError]         = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [typeFilter,     setTypeFilter]     = useState("ALL");
  const [statusFilter,   setStatusFilter]   = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Pagination
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [query, setQuery] = useState({ page: 1, pageSize: 20, search: "" });

  // ── Fetch notifications ───────────────────────────────────────────────────

  const loadNotifs = useCallback(async (q, type, status, priority) => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeNotificationService.getNotifications({
        ...q,
        type:     type     !== "ALL" ? type     : undefined,
        status:   status   !== "ALL" ? status   : undefined,
        priority: priority !== "ALL" ? priority : undefined,
      });
      setNotifications(data.notifications || []);
      setPagination(data.pagination || {});
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummLoading(true);
    try {
      const data = await financeNotificationService.getSummary();
      setSummary(data);
    } catch { /* silent */ } finally {
      setSummLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifs(query, typeFilter, statusFilter, priorityFilter);
  }, [loadNotifs, query, typeFilter, statusFilter, priorityFilter]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  // Auto-refresh summary every 60s
  useEffect(() => {
    const id = setInterval(loadSummary, 60000);
    return () => clearInterval(id);
  }, [loadSummary]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const refresh = () => {
    loadNotifs(query, typeFilter, statusFilter, priorityFilter);
    loadSummary();
  };

  const openView = async (row) => {
    const full = notifications.find(n => n.eventId === row.eventId);
    setSelected(full);
    openModal("fn-notif-view");
    // Mark as read
    if (!full?.isRead) {
      try {
        await financeNotificationService.markRead(full.eventId);
        setNotifications(prev => prev.map(n => n.eventId === full.eventId ? { ...n, isRead: true } : n));
        setSummary(s => s ? { ...s, unread: Math.max(0, s.unread - 1) } : s);
      } catch { /* ignore */ }
    }
  };

  const handleMarkRead = async (row) => {
    if (row.isRead) return;
    try {
      await financeNotificationService.markRead(row.eventId);
      setNotifications(prev => prev.map(n => n.eventId === row.eventId ? { ...n, isRead: true } : n));
      setSummary(s => s ? { ...s, unread: Math.max(0, s.unread - 1) } : s);
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  const handleDismiss = async (row) => {
    try {
      await financeNotificationService.dismiss(row.eventId);
      setNotifications(prev => prev.filter(n => n.eventId !== row.eventId));
      loadSummary();
    } catch (e) { alert(e.response?.data?.message || "Failed to dismiss"); }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await financeNotificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setSummary(s => s ? { ...s, unread: 0 } : s);
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all read notifications? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await financeNotificationService.clearAll();
      refresh();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  // ── Table rows ────────────────────────────────────────────────────────────

  const rows = notifications.map(n => ({
    ...n,
    statusDot:     <StatusDot isRead={n.isRead} />,
    typeBadge:     <TypeBadge type={n.type} />,
    priorityBadge: <PriorityBadge priority={n.priority} />,
    fmtDate:       fmtDate(n.date),
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Finance" secondaryText="Notifications" size={12} />
        <EnhancedDashCard
          title="Total"         value={summLoading ? "…" : String(summary?.total         ?? 0)}
          icon={<Bell size={22} />}         accentColor="#3b82f6" size={2} />
        <EnhancedDashCard
          title="Unread"        value={summLoading ? "…" : String(summary?.unread        ?? 0)}
          icon={<BellOff size={22} />}      accentColor="#f43f5e" size={2} />
        <EnhancedDashCard
          title="Urgent"        value={summLoading ? "…" : String(summary?.urgent        ?? 0)}
          icon={<AlertCircle size={22} />}  accentColor="#ef4444" size={2} />
        <EnhancedDashCard
          title="Payment Alerts" value={summLoading ? "…" : String(summary?.paymentAlerts ?? 0)}
          icon={<CreditCard size={22} />}   accentColor="#22c55e" size={2} />
        <EnhancedDashCard
          title="Work Order Alerts" value={summLoading ? "…" : String(summary?.woAlerts  ?? 0)}
          icon={<Briefcase size={22} />}    accentColor="#f59e0b" size={2} />
        <EnhancedDashCard
          title="Invoice Alerts" value={summLoading ? "…" : String(summary?.invoiceAlerts ?? 0)}
          icon={<FileText size={22} />}     accentColor="#8b5cf6" size={2} />
      </DashGrid>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Filter size={13} className="text-slate-400" />
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setQuery(q => ({ ...q, page: 1 })); }}
          >
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <CheckCircle2 size={13} className="text-slate-400" />
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setQuery(q => ({ ...q, page: 1 })); }}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>)}
          </select>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <AlertCircle size={13} className="text-slate-400" />
          <select
            className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value); setQuery(q => ({ ...q, page: 1 })); }}
          >
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p === "ALL" ? "All Priorities" : p}</option>)}
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>

        {/* Bulk actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading || (summary?.unread === 0)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <CheckCheck size={13} />
            Mark All Read
          </button>
          <button
            onClick={handleClearAll}
            disabled={actionLoading}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 shadow-sm hover:bg-red-100 transition-colors disabled:opacity-40"
          >
            <XCircle size={13} />
            Clear Read
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <DataTable
        title="All Finance Notifications"
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        pageSize={query.pageSize}
        totalRows={pagination.total}
        currentPage={pagination.page}
        onPageChange={page => setQuery(q => ({ ...q, page }))}
        onPageSizeChange={pageSize => setQuery(q => ({ ...q, page: 1, pageSize }))}
        onSearch={search => setQuery(q => ({ ...q, page: 1, search }))}
        searchable
        exportable
        exportFileName="finance_notifications"
        size={12}
        actions={[
          {
            icon:    <Eye size={15} />,
            tooltip: "View Details",
            variant: "ghost",
            onClick: openView,
          },
          {
            icon:    <BookCheck size={15} />,
            tooltip: "Mark as Read",
            variant: "success",
            onClick: handleMarkRead,
          },
          {
            icon:    <Trash2 size={15} />,
            tooltip: "Dismiss",
            variant: "danger",
            onClick: handleDismiss,
          },
        ]}
      />

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      <Modal id="fn-notif-view" title="Notification Details" size="md">
        {selected && (
          <div className="flex flex-col gap-4">

            {/* Type + Priority header banner */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
              TYPE_COLORS[selected.type]?.replace("text-", "border-").replace("bg-", "bg-") ?? ""
            }`}>
              <span className={TYPE_COLORS[selected.type]}>
                <TypeIcon type={selected.type} />
              </span>
              <div className="flex-1">
                <span className={`text-sm font-bold ${TYPE_COLORS[selected.type]?.split(" ")[1]}`}>
                  {TYPE_LABELS[selected.type]} · {SUBTYPE_LABELS[selected.subType] ?? selected.title}
                </span>
              </div>
              <PriorityBadge priority={selected.priority} />
            </div>

            <ModalProfile
              name={selected.client}
              subtitle={selected.title}
              meta={fmtDate(selected.date)}
            />

            <ModalGrid title="Event Details" cols={2}>
              <ModalData label="Type"      value={TYPE_LABELS[selected.type]} />
              <ModalData label="Priority"  value={selected.priority} />
              <ModalData label="Status"    value={selected.isRead ? "Read" : "Unread"} />
              <ModalData label="Amount"    value={selected.amount || "—"} />
              <ModalData label="Reference" value={selected.refType} />
              <ModalData label="Date"      value={fmtDate(selected.date)} />
            </ModalGrid>

            <ModalGrid title="Message" cols={1}>
              <ModalData label="Details" value={selected.message} />
            </ModalGrid>

            <div className="flex justify-between pt-2">
              {!selected.isRead && (
                <Button
                  text="Mark as Read"
                  variant="secondary"
                  size={4}
                  onClick={async () => {
                    await handleMarkRead(selected);
                    setSelected(s => ({ ...s, isRead: true }));
                  }}
                />
              )}
              <Button
                text="Close"
                variant="ghost"
                size={4}
                onClick={() => closeModal("fn-notif-view")}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}