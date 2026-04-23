import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { useState, memo } from "react";
import GlobalCallModal from "../components/shared/GlobalCallModal";

// Memoize Navbar so it doesn't re-render when sidebar expand state changes —
// the Navbar has no dependency on `expanded`, so every toggle was causing a
// full Navbar re-render + DOM reconciliation for no reason.
const MemoNavbar = memo(Navbar);

function MainLayout() {
  const [expanded, setExpanded] = useState(true);

  return (
    // Use CSS custom property to drive the sidebar width so a single variable
    // change propagates everywhere without touching layout on every frame.
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f7f8f0_40%,_#eef4f7_100%)]">
      {/* ── Sidebar wrapper ─────────────────────────────────────────────────
          Only `width` transitions — scoped to a single CSS property so the
          browser can skip layout/paint and composite on the GPU only.
          `will-change: width` promotes the layer ahead of time.
          ──────────────────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 h-full overflow-hidden"
        style={{
          width: expanded ? "256px" : "56px",
          transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "width",
        }}
      >
        <Sidebar expanded={expanded} onExpand={() => setExpanded(true)} />
      </div>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Navbar — memoized to skip re-renders on sidebar toggle */}
        <div className="border-b border-white/60 bg-white/45 px-4 py-2 shadow-sm backdrop-blur md:px-6">
          <MemoNavbar onToggleSidebar={() => setExpanded((v) => !v)} />
        </div>

        {/* Page content */}
        <div className="flex-1 w-full overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <div className="min-h-full rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.88)_0%,_rgba(250,252,253,0.96)_100%)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
            <Outlet />
          </div>
        </div>
      </div>

      <GlobalCallModal />
    </div>
  );
}

export default MainLayout;