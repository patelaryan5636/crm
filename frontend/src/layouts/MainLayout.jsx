import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { useState } from "react";

function MainLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f7f8f0_40%,_#eef4f7_100%)]">
      {/* Overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed z-40 h-full w-64 transform shadow-lg md:static
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 md:translate-x-0`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Navbar */}
        <div className="border-b border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur md:px-6">
          <Navbar toggleSidebar={() => setIsOpen(!isOpen)} />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="min-h-full rounded-[28px] border border-white/70 bg-gradient-to-br from-white/92 via-[#fffaf4]/88 to-[#f3f7f8]/92 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
            {/* Page content */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
