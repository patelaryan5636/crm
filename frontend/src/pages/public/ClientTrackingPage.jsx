/**
 * ClientTrackingPage.jsx
 * Public magic-link project tracker — /track/:token
 * No login required. Token is validated server-side.
 *
 * Shows: all projects for this client + payment status + milestones + updates.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2, Clock, Calendar, Banknote, CreditCard,
  ReceiptText, ShieldCheck, FolderOpen, Search, Package,
  TrendingUp, FileText, ChevronRight, ChevronLeft,
  ExternalLink, Loader2, AlertTriangle, XCircle,
} from "lucide-react";
import {
  EnhancedDashCard, DashGrid, DataTable,
} from "../../components/shared/Common_Components";
import axios from "axios";
import GraphuraLogo from "../../assets/Logo/Graphura_Logo.webp";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  "Not Started":  { color: "#94a3b8", bg: "#f1f5f9" },
  "Work Started": { color: "#3b82f6", bg: "#eff6ff" },
  "In Progress":  { color: "#f59e0b", bg: "#fffbeb" },
  "Review Stage": { color: "#8b5cf6", bg: "#f5f3ff" },
  "Finalization": { color: "#14b8a6", bg: "#f0fdfa" },
  "Completed":    { color: "#22c55e", bg: "#f0fdf4" },
  "Delivered":    { color: "#10b981", bg: "#d1fae5" },
  "Delayed":      { color: "#f43f5e", bg: "#fff1f2" },
};

const MILESTONES = ["Not Started","Work Started","In Progress","Review Stage","Finalization","Completed"];
const ACTIVE_STATUSES = new Set(["Not Started","Work Started","In Progress","Review Stage","Finalization","Delayed"]);

const fmtINR   = (n) => typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—";
const milestoneIdx = (s) => Math.max(0, MILESTONES.findIndex((m) => m === s));

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const s = STATUS_CFG[status] ?? { color: "#94a3b8", bg: "#f1f5f9" };
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {status}
    </span>
  );
}

function MilestoneTrack({ status }) {
  const cur = milestoneIdx(status);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-start min-w-[400px]">
        {MILESTONES.map((m, i) => {
          const done   = i < cur;
          const active = i === cur;
          const cfg    = STATUS_CFG[m];
          return (
            <div key={m} className="flex-1 flex flex-col items-center">
              <div className="relative w-full flex items-center">
                {i > 0 && <div className="flex-1 h-0.5" style={{ backgroundColor: done || active ? "#2a465a" : "#e2e8f0" }} />}
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                  style={{
                    backgroundColor: done ? "#2a465a" : active ? cfg.bg : "#f8fafc",
                    borderColor:     done ? "#2a465a" : active ? cfg.color : "#e2e8f0",
                    boxShadow:       active ? `0 0 0 4px ${cfg.color}25` : "none",
                  }}>
                  {done   ? <CheckCircle2 size={14} className="text-white" />
                  : active ? <Loader2     size={14} style={{ color: cfg.color }} className="animate-spin" />
                  :          <span className="w-2 h-2 rounded-full bg-slate-300" />}
                </div>
                {i < MILESTONES.length - 1 && <div className="flex-1 h-0.5" style={{ backgroundColor: done ? "#2a465a" : "#e2e8f0" }} />}
              </div>
              <p className="mt-2 text-center text-[10px] font-bold px-1"
                style={{ color: done ? "#2a465a" : active ? cfg.color : "#94a3b8" }}>{m}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, open: def = true }) {
  const [open, setOpen] = useState(def);
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2a465a]/10 flex items-center justify-center">
            <Icon size={16} className="text-[#2a465a]" />
          </div>
          <span className="text-sm font-bold text-[#1e293b]">{title}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="text-slate-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-6 pb-6 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ── Project list ──────────────────────────────────────────────────────────────
function ProjectList({ projects, stats, onSelect, company, manager }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p) => {
    const ok = filter === "active"    ? ACTIVE_STATUSES.has(p.status)
             : filter === "delivered" ? (p.status === "Completed" || p.status === "Delivered")
             : true;
    const q = search.toLowerCase();
    return ok && (!q || p.name.toLowerCase().includes(q) || p.projectNumber.toLowerCase().includes(q));
  });

  const counts = {
    all:       projects.length,
    active:    projects.filter((p) => ACTIVE_STATUSES.has(p.status)).length,
    delivered: projects.filter((p) => p.status === "Completed" || p.status === "Delivered").length,
  };

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#1e293b]">Track Your <span className="text-[#2a465a]">Projects</span></h1>
        <p className="text-slate-500 text-sm mt-1">Real-time progress, milestones & payment status</p>
      </div>

      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Total Projects" value={String(stats.total)}     icon={<Package size={22}/>}      accentColor="#2a465a" size={4} />
        <EnhancedDashCard title="Active"         value={String(stats.active)}    icon={<TrendingUp size={22}/>}   accentColor="#f59e0b" size={4} />
        <EnhancedDashCard title="Delivered"      value={String(stats.delivered)} icon={<CheckCircle2 size={22}/>} accentColor="#22c55e" size={4} />
      </DashGrid>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
          {[
            { key:"all",       label:`All (${counts.all})` },
            { key:"active",    label:`Active (${counts.active})` },
            { key:"delivered", label:`Delivered (${counts.delivered})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === t.key ? "bg-[#2a465a] text-white shadow" : "text-slate-500 hover:text-[#2a465a] hover:bg-slate-100"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2a465a]/20" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FolderOpen size={40} className="mb-3 opacity-40" />
          <p className="text-sm font-bold">No projects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const cfg       = STATUS_CFG[p.status] ?? STATUS_CFG["Not Started"];
            const remaining = p.remainingAmount || 0;
            const payLabel  = p.paidAmount >= p.totalAmount && p.totalAmount > 0 ? "Paid"
                            : p.paidAmount > 0 ? "Partially Paid" : "Pending";
            const payColor  = payLabel === "Paid" ? "#22c55e" : payLabel === "Partially Paid" ? "#f59e0b" : "#f43f5e";
            const delivered = p.status === "Completed" || p.status === "Delivered";

            return (
              <button key={p.id} type="button" onClick={() => onSelect(p.id)}
                className="w-full text-left rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-[#2a465a]/30 transition-all overflow-hidden group">
                {delivered && <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.projectNumber}</span>
                        <StatusPill status={p.status} />
                        {delivered && p.deliveredAt && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Delivered {p.deliveredAt}
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-black text-[#1e293b] truncate group-hover:text-[#2a465a] transition-colors">{p.name}</h2>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {p.startDate      && <span className="flex items-center gap-1 text-[11px] text-slate-400"><Calendar size={11}/> {p.startDate}</span>}
                        {p.expectedDelivery && <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock size={11}/> Due {p.expectedDelivery}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">Progress</p>
                        <p className="text-2xl font-black" style={{ color: delivered ? "#22c55e" : cfg.color }}>{p.progressPercent}%</p>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-[#2a465a] transition-colors" />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width:`${p.progressPercent}%`, background: delivered ? "linear-gradient(90deg,#34d399,#059669)" : `linear-gradient(90deg,${cfg.color}99,${cfg.color})` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold" style={{ color: payColor }}>{payLabel}</span>
                    <span className="text-[11px] text-slate-400">{fmtINR(p.paidAmount)} paid of {fmtINR(p.totalAmount)}</span>
                    {remaining > 0 && <span className="text-[11px] font-bold text-rose-500">· {fmtINR(remaining)} remaining</span>}
                    <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(p.updates||[]).length} updates</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Company & Contact Section ── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2a465a]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a465a]">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-[#1e293b]">Company & Contact</span>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Company details */}
          {company && (
            <div className="space-y-3">
              {company.name && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2a465a] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-black">{company.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-base font-black text-[#1e293b]">{company.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Your service provider</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {company.email && (
                  <a href={`mailto:${company.email}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#2a465a]/30 hover:bg-[#2a465a]/5 transition-all group">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a465a] flex-shrink-0">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <span className="text-xs text-slate-600 group-hover:text-[#2a465a] font-medium truncate">{company.email}</span>
                  </a>
                )}
                {company.phone && (
                  <a href={`tel:${company.phone}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#2a465a]/30 hover:bg-[#2a465a]/5 transition-all group">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a465a] flex-shrink-0">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.44 2 2 0 0 1 3.54 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.14-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span className="text-xs text-slate-600 group-hover:text-[#2a465a] font-medium">{company.phone}</span>
                  </a>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#2a465a]/30 hover:bg-[#2a465a]/5 transition-all group sm:col-span-2">
                    <ExternalLink size={14} className="text-[#2a465a] flex-shrink-0" />
                    <span className="text-xs text-slate-600 group-hover:text-[#2a465a] font-medium truncate">{company.website}</span>
                  </a>
                )}
                {company.address && (company.address.line1 || company.address.city) && (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a465a] flex-shrink-0 mt-0.5">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-xs text-slate-600 font-medium leading-relaxed">
                      {[company.address.line1, company.address.line2, company.address.city, company.address.state, company.address.pincode]
                        .filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider + Manager */}
          {manager && (
            <>
              <div className="border-t border-slate-100" />
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Your Account Manager</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#f59e0b] text-sm font-black">{manager.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1e293b]">{manager.name}</p>
                    <p className="text-[11px] text-slate-400">Management Manager</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {manager.email && (
                    <a href={`mailto:${manager.email}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#f59e0b]/40 hover:bg-[#f59e0b]/5 transition-all group">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f59e0b] flex-shrink-0">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                      <span className="text-xs text-slate-600 group-hover:text-[#f59e0b] font-medium truncate">{manager.email}</span>
                    </a>
                  )}
                  {manager.phone && (
                    <a href={`tel:${manager.phone}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#f59e0b]/40 hover:bg-[#f59e0b]/5 transition-all group">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f59e0b] flex-shrink-0">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.44 2 2 0 0 1 3.54 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.14-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span className="text-xs text-slate-600 group-hover:text-[#f59e0b] font-medium">{manager.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Contact us message */}
          <div className="border-t border-slate-100 pt-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#2a465a]/8 to-[#2a465a]/4 border border-[#2a465a]/15 px-4 py-3.5 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#2a465a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#2a465a]">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2a465a] mb-0.5">Have a question or concern?</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Reach out to us at any time — we're here to help. Contact your account manager directly or email us at{" "}
                  {company?.email
                    ? <a href={`mailto:${company.email}`} className="font-bold text-[#2a465a] hover:underline">{company.email}</a>
                    : <span className="font-bold text-[#2a465a]">the address above</span>
                  } and we'll get back to you promptly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Project detail ────────────────────────────────────────────────────────────
function ProjectDetail({ p, onBack, company, manager }) {
  const remaining = p.remainingAmount || 0;
  const payLabel  = p.paidAmount >= p.totalAmount && p.totalAmount > 0 ? "Paid"
                  : p.paidAmount > 0 ? "Partially Paid" : "Pending";
  const payColor  = payLabel === "Paid" ? "#22c55e" : payLabel === "Partially Paid" ? "#f59e0b" : "#f43f5e";
  const cfg       = STATUS_CFG[p.status] ?? STATUS_CFG["Not Started"];
  const [showAll, setShowAll] = useState(false);
  const updates   = showAll ? [...(p.updates||[])].reverse() : [...(p.updates||[])].reverse().slice(0, 3);

  const payRows = (p.payments||[]).map((pay, i) => ({
    id: i, date: pay.date, method: pay.method, amount: fmtINR(pay.amount), ref: pay.ref, status: pay.status,
  }));

  return (
    <main className="space-y-6">
      <button type="button" onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-[#2a465a] hover:text-[#1a2e3f] group">
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> All Projects
      </button>

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1a2e3f] to-[#2a465a] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{p.projectNumber}</span>
              <StatusPill status={p.status} />
            </div>
            <h1 className="text-xl font-black text-white">{p.name}</h1>
            {p.teamLeader && <p className="text-sm text-white/60 mt-1">{p.teamLeader.name} · Team Leader</p>}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Progress</p>
            <p className="text-4xl font-black text-white">{p.progressPercent}%</p>
          </div>
        </div>
        <div className="mt-6 h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width:`${p.progressPercent}%`, background: p.status === "Completed" ? "linear-gradient(90deg,#34d399,#059669)" : "linear-gradient(90deg,#38bdf8,#818cf8)" }} />
        </div>
        <div className="mt-5 flex flex-wrap gap-4">
          {p.startDate       && <div className="flex items-center gap-2 text-white/70 text-xs"><Calendar size={13}/> Started: <span className="text-white font-bold">{p.startDate}</span></div>}
          {p.expectedDelivery && <div className="flex items-center gap-2 text-white/70 text-xs"><Clock size={13}/> Due: <span className="text-white font-bold">{p.expectedDelivery}</span></div>}
        </div>
      </div>

      {/* Payment KPIs */}
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Project Cost"    value={fmtINR(p.totalAmount)}    icon={<Banknote size={22}/>}   accentColor="#2a465a" size={3} />
        <EnhancedDashCard title="Amount Paid"     value={fmtINR(p.paidAmount)}     icon={<CreditCard size={22}/>} accentColor="#22c55e" size={3} />
        <EnhancedDashCard title="Remaining"       value={fmtINR(remaining)}        icon={<ReceiptText size={22}/>} accentColor={remaining > 0 ? "#f43f5e" : "#22c55e"} size={3} />
        <EnhancedDashCard title="Payment Status"  value={payLabel}                 icon={<ShieldCheck size={22}/>} accentColor={payColor} size={3} />
      </DashGrid>

      {/* Milestones */}
      <Section title="Project Milestones" icon={TrendingUp}>
        <div className="mt-4"><MilestoneTrack status={p.status} /></div>
      </Section>

      {/* Updates */}
      <Section title="Project Updates" icon={FileText}>
        <div className="mt-4 space-y-3">
          {updates.length === 0 ? (
            <p className="text-sm text-slate-400">No updates yet.</p>
          ) : updates.map((u, i) => {
            const uc = STATUS_CFG[u.status] ?? STATUS_CFG["Not Started"];
            return (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor:`${uc.color}15` }}>
                    <CheckCircle2 size={13} style={{ color: uc.color }} />
                  </div>
                  {i < updates.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-2" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <StatusPill status={u.status} />
                    <span className="text-[11px] text-slate-400">{u.date}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{u.note}</p>
                </div>
              </div>
            );
          })}
          {(p.updates||[]).length > 3 && (
            <button type="button" onClick={() => setShowAll((v) => !v)}
              className="w-full text-center text-xs font-bold text-[#2a465a] py-2 hover:text-[#1a2e3f] transition-colors">
              {showAll ? "Show Less ▲" : `Show All ${p.updates.length} Updates ▼`}
            </button>
          )}
        </div>
      </Section>

      {/* Payment Details */}
      <Section title="Payment Details" icon={CreditCard}>
        <div className="mt-4 space-y-4">

          {/* ── Price Breakdown Card ── */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">

            {/* Line items */}
            <div className="bg-white divide-y divide-slate-100">

              {/* Invoice line items */}
              {p.pricing?.source === 'invoice' && (p.pricing.lineItems || []).map((li, i) => (
                <div key={i} className="flex items-start justify-between px-5 py-3.5 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1e293b]">{li.name}</p>
                    {li.qty > 1 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {li.qty} × {fmtINR(li.price)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#1e293b] tabular-nums">{fmtINR(li.amount)}</p>
                </div>
              ))}

              {/* WorkOrder requirements */}
              {p.pricing?.source === 'workorder' && (p.pricing.requirements || []).map((r, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <p className="text-sm font-semibold text-[#1e293b] flex-1 min-w-0">{r.title}</p>
                  <p className="text-sm font-bold text-[#1e293b] tabular-nums">{fmtINR(r.cost)}</p>
                </div>
              ))}

              {/* Fallback — no itemized data */}
              {(!p.pricing || p.pricing.source === 'invoice_simple') && (
                <div className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <p className="text-sm font-semibold text-[#1e293b]">Project Cost</p>
                  <p className="text-sm font-bold text-[#1e293b] tabular-nums">
                    {fmtINR(p.pricing?.subtotal ?? p.totalAmount)}
                  </p>
                </div>
              )}
            </div>

            {/* Subtotal separator — only when 2+ items */}
            {p.pricing && (p.pricing.source !== 'invoice_simple') &&
              ((p.pricing.lineItems || p.pricing.requirements || []).length > 1) && (
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subtotal</p>
                <p className="text-xs font-bold text-slate-600 tabular-nums">{fmtINR(p.pricing.subtotal)}</p>
              </div>
            )}

            {/* Discount */}
            {(p.pricing?.discountAmt > 0) && (
              <div className="flex items-center justify-between px-5 py-3 bg-emerald-50 border-t border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-600">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <p className="text-xs font-bold text-emerald-700">
                    Discount
                    {p.pricing.discountMode === 'Percentage' && p.pricing.discountValue
                      ? ` (${p.pricing.discountValue}%)`
                      : (p.pricing.discountMode === 'Rupees' || p.pricing.discountMode === 'Flat')
                      ? ' (Flat)'
                      : ''}
                  </p>
                </div>
                <p className="text-xs font-bold text-emerald-700 tabular-nums">− {fmtINR(p.pricing.discountAmt)}</p>
              </div>
            )}

            {/* GST */}
            {p.pricing?.gstPercent != null && p.pricing.gstAmount > 0 && (
              <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-t border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600">
                      <path d="M12 2v20M2 12h20"/>
                    </svg>
                  </span>
                  <p className="text-xs font-bold text-blue-700">GST ({p.pricing.gstPercent}%)</p>
                </div>
                <p className="text-xs font-bold text-blue-700 tabular-nums">+ {fmtINR(p.pricing.gstAmount)}</p>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#1a2e3f] border-t border-[#1a2e3f]">
              <p className="text-sm font-black text-white uppercase tracking-wide">Total</p>
              <p className="text-xl font-black text-white tabular-nums">
                {fmtINR(p.pricing?.total ?? p.totalAmount)}
              </p>
            </div>

            {/* Paid */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500">Amount Paid</p>
              <p className="text-sm font-bold text-emerald-600 tabular-nums">{fmtINR(p.paidAmount)}</p>
            </div>

            {/* Remaining */}
            {remaining > 0 && (
              <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500">Remaining</p>
                <p className="text-sm font-bold text-rose-500 tabular-nums">{fmtINR(remaining)}</p>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-100 rounded-b-2xl">
              <p className="text-xs font-semibold text-slate-500">Payment Status</p>
              <span className="text-[11px] font-black px-3 py-1 rounded-full"
                style={{ color: payColor, backgroundColor: `${payColor}18`, border: `1px solid ${payColor}30` }}>
                {payLabel}
              </span>
            </div>
          </div>

          {/* ── Payment History ── */}
          {payRows.length > 0 && (
            <DataTable
              title="Payment History"
              columns={[
                { key:"date",   label:"Date" },
                { key:"method", label:"Method" },
                { key:"amount", label:"Amount" },
                { key:"ref",    label:"Reference" },
                { key:"status", label:"Status" },
              ]}
              rows={payRows} pageSize={5} searchable={false}
            />
          )}
        </div>
      </Section>

      {/* Resources */}
      {(p.driveLink || p.handoverLink) && (
        <Section title="Project Resources" icon={Package} open={false}>
          <div className="mt-4 space-y-3">
            {[
              { label:"Project Drive Folder", link: p.driveLink },
              { label:"Final Handover Link",  link: p.handoverLink },
            ].filter((r) => r.link).map(({ label, link }) => (
              <div key={label} className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-[#1e293b] truncate">{label}</p>
                <a href={link} target="_blank" rel="noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a465a] text-white text-[11px] font-bold hover:bg-[#1a2e3f] transition-colors">
                  Open <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Company & Contact */}
      {(company || manager) && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2a465a]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a465a]">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#1e293b]">Company & Contact</span>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Company details */}
            {company && (
              <div className="space-y-3">
                {company.name && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2a465a] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-black">{company.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-base font-black text-[#1e293b]">{company.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Your service provider</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {company.email && (
                    <a href={`mailto:${company.email}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#2a465a]/30 hover:bg-[#2a465a]/5 transition-all group">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a465a] flex-shrink-0">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                      <span className="text-xs text-slate-600 group-hover:text-[#2a465a] font-medium truncate">{company.email}</span>
                    </a>
                  )}
                  {company.phone && (
                    <a href={`tel:${company.phone}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#2a465a]/30 hover:bg-[#2a465a]/5 transition-all group">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a465a] flex-shrink-0">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.44 2 2 0 0 1 3.54 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.14-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span className="text-xs text-slate-600 group-hover:text-[#2a465a] font-medium">{company.phone}</span>
                    </a>
                  )}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#2a465a]/30 hover:bg-[#2a465a]/5 transition-all group sm:col-span-2">
                      <ExternalLink size={14} className="text-[#2a465a] flex-shrink-0" />
                      <span className="text-xs text-slate-600 group-hover:text-[#2a465a] font-medium truncate">{company.website}</span>
                    </a>
                  )}
                  {company.address && (company.address.line1 || company.address.city) && (
                    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a465a] flex-shrink-0 mt-0.5">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="text-xs text-slate-600 font-medium leading-relaxed">
                        {[company.address.line1, company.address.line2, company.address.city, company.address.state, company.address.pincode]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manager */}
            {manager && (
              <>
                <div className="border-t border-slate-100" />
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Your Account Manager</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#f59e0b] text-sm font-black">{manager.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1e293b]">{manager.name}</p>
                      <p className="text-[11px] text-slate-400">Management Manager</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {manager.email && (
                      <a href={`mailto:${manager.email}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#f59e0b]/40 hover:bg-[#f59e0b]/5 transition-all group">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f59e0b] flex-shrink-0">
                          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                        <span className="text-xs text-slate-600 group-hover:text-[#f59e0b] font-medium truncate">{manager.email}</span>
                      </a>
                    )}
                    {manager.phone && (
                      <a href={`tel:${manager.phone}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#f59e0b]/40 hover:bg-[#f59e0b]/5 transition-all group">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f59e0b] flex-shrink-0">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.44 2 2 0 0 1 3.54 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.14-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <span className="text-xs text-slate-600 group-hover:text-[#f59e0b] font-medium">{manager.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Contact us message */}
            <div className="border-t border-slate-100 pt-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#2a465a]/8 to-[#2a465a]/4 border border-[#2a465a]/15 px-4 py-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#2a465a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#2a465a]">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2a465a] mb-0.5">Have a question or concern?</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Reach out to us at any time — we're here to help. Contact your account manager directly or email us at{" "}
                    {company?.email
                      ? <a href={`mailto:${company.email}`} className="font-bold text-[#2a465a] hover:underline">{company.email}</a>
                      : <span className="font-bold text-[#2a465a]">the address above</span>
                    } and we'll get back to you promptly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function ClientTrackingPage() {
  const { token }   = useParams();
  const [state,     setState]    = useState("loading"); // loading | error | ready
  const [error,     setError]    = useState("");
  const [pageData,  setPageData] = useState(null);
  const [selectedId,setSelectedId]= useState(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await axios.get(`${API}/public/track/${token}`);
      setPageData(res.data?.data || null);
      setState("ready");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired tracking link.";
      setError(msg);
      setState("error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f7f8f0_40%,_#eef4f7_100%)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#2a465a]" />
          <p className="text-sm font-semibold text-slate-500">Loading your projects…</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f7f8f0_40%,_#eef4f7_100%)] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-lg">
          <XCircle size={48} className="text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-[#1e293b] mb-2">Link Invalid or Expired</h1>
          <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
          <p className="text-slate-400 text-xs mt-4">Please contact your account manager to get a new tracking link.</p>
        </div>
      </div>
    );
  }

  const { client, company, stats, projects, manager } = pageData;
  const selectedProject = selectedId ? projects.find((p) => p.id === selectedId) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f7f8f0_40%,_#eef4f7_100%)]">
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header — matches ClientHeader in MainLayout */}
        <div className="border-b border-white/60 bg-white/45 shadow-sm backdrop-blur">
          <div className="flex h-16 w-full items-center justify-between px-4 md:px-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="h-16 w-auto" />
              ) : (
                <img src={GraphuraLogo} alt="Graphura" className="h-16 w-auto" />
              )}
            </div>

            {/* Client info — replaces Logout button */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-[#1e293b] leading-tight">{client.name}</p>
                {(client.companyName || company.name) && (
                  <p className="text-xs text-slate-500 leading-tight">{client.companyName || company.name}</p>
                )}
              </div>
              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-xl bg-[#2a465a] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#2a465a]/20">
                <span className="text-white text-sm font-black">
                  {client.name?.charAt(0)?.toUpperCase() ?? "C"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 w-full overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <div className="min-h-full rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.88)_0%,_rgba(250,252,253,0.96)_100%)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
            {selectedProject ? (
              <ProjectDetail p={selectedProject} onBack={() => setSelectedId(null)} company={company} manager={manager} />
            ) : (
              <ProjectList projects={projects} stats={stats} onSelect={setSelectedId} company={company} manager={manager} />
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
