// ─────────────────────────────────────────────────────────────────────────────
// ProfileLayout.jsx
// A lightweight section card wrapper used across all profile sections.
// Keeps every section visually consistent without any external libraries.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";

/**
 * ProfileSection — wraps a logical block of the profile page inside a
 * clean card with a titled header bar, matching the CRM design system.
 *
 * Props:
 *   title        — section heading string  (required)
 *   subtitle     — muted helper line below the title  (optional)
 *   headerRight  — JSX rendered flush-right in the header  (optional)
 *   children     — section body content
 *   noPadding    — when true, removes body padding (useful for full-bleed content)
 */
export const ProfileSection = ({
  title,
  subtitle,
  headerRight,
  children,
  noPadding = false,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    {/* ── Header bar ── */}
    <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
      <div>
        <p className="text-sm font-black text-[#2a465a] uppercase tracking-[0.18em]">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      {headerRight && <div className="flex-shrink-0">{headerRight}</div>}
    </div>

    {/* ── Body ── */}
    <div className={noPadding ? "" : "p-6"}>{children}</div>
  </div>
);

/**
 * ProfileRow — a single label + value display row used inside ProfileSection
 * for read-only summary views (not edit forms).
 *
 * Props:
 *   label  — field label string
 *   value  — field value string or JSX
 */
export const ProfileRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 py-3 border-b border-slate-100 last:border-0">
    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
      {label}
    </span>
    <span className="text-sm font-semibold text-[#2a465a]">{value ?? "—"}</span>
  </div>
);

/**
 * SecurityRow — a toggle row used in the Security section.
 * Renders a label + description on the left and a ToggleButton on the right.
 *
 * Props:
 *   label       — toggle label
 *   description — muted helper text
 *   checked     — boolean
 *   onChange    — (newValue: boolean) => void
 *   ToggleButton — the ToggleButton component passed as prop to avoid
 *                  circular dependency issues in large CRM codebases
 */
export const SecurityRow = ({ label, description, checked, onChange, ToggleButton }) => (
  <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-bold text-[#2a465a]">{label}</p>
      {description && (
        <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
    <div className="flex-shrink-0">
      <ToggleButton
        checked={checked}
        onChange={onChange}
        label="On"
        labelOff="Off"
        size="md"
      />
    </div>
  </div>
);