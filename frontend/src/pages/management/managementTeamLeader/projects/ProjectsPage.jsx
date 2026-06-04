/**
 * ProjectsPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Main Projects Management page for the Team Leader.
 * Renders the Heading banner + a tab bar with 3 tabs:
 *   1. My Projects   — read-only project overview with task progress
 *   2. Assign Tasks   — create and assign tasks within a project
 *   3. Task Board     — view/update all tasks across projects
 *
 * One team = one project (pre-assigned by Manager).
 * The TL's job is to break projects into tasks and assign to employees.
 *
 * ── What is imported from Common_Components ──────────────────────────────────
 *   Heading  — animated dark navy banner (primaryText + secondaryText)
 *   Grid     — 12-column layout wrapper
 *
 * Tab routing is internal (useState) — no router needed.
 * All shared project+task data lives in projectsStore.
 */

import React, { useState } from "react";
import { Heading, Grid } from "../../../../components/shared/Common_Components";
import AssignProjects from "./AssignProjects";
import ReassignProjects from "./ReassignProjects";
import UpdateProjectProgress from "./UpdateProjectProgress";

// ── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  {
    id: "projects",
    label: "My Projects",
    Component: AssignProjects,
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
  },
  {
    id: "assign",
    label: "Assign Tasks",
    Component: ReassignProjects,
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: "board",
    label: "Task Board",
    Component: UpdateProjectProgress,
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState("projects");

  const { Component: ActiveComponent } = TABS.find((t) => t.id === activeTab);

  return (
    <div>
      <Grid cols={12} gap={5}>

        {/* ── Animated heading banner ── */}
        <Heading
          primaryText="Projects"
          secondaryText="Management"
          size={12}
          showAnimations={true}
        />

        {/* ── Tab bar ── */}
        <div className="col-span-12">
          <div
            className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-[14px] p-1.5 w-fit"
            role="tablist"
            aria-label="Projects navigation"
          >
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-[10px]
                    text-[13px] font-bold whitespace-nowrap select-none
                    transition-all duration-200
                    ${isActive
                      ? "bg-[#2a465a] text-white shadow-[0_4px_14px_rgba(42,70,90,0.30)]"
                      : "bg-transparent text-slate-400 hover:text-[#475569] hover:bg-slate-100"
                    }
                  `}
                >
                  <span className="flex-shrink-0">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active tab content ── */}
        <div className="col-span-12" key={activeTab} style={{ animation: "pgFadeIn 0.22s ease both" }}>
          <ActiveComponent />
        </div>

      </Grid>

      <style>{`
        @keyframes pgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
