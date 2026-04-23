import { memo } from "react";
import { Bell, PanelLeft, Search } from "lucide-react";
import { useLocation } from "react-router-dom";

const ROLE_LABELS = {
  "super-admin": { short: "SA", label: "Super Admin" },
  admin:         { short: "A",  label: "Admin"       },
  sales:         { short: "S",  label: "Sales"       },
  finance:       { short: "F",  label: "Finance"     },
  management:    { short: "M",  label: "Management"  },
  client:        { short: "C",  label: "Client"      },
};

function useRole() {
  const { pathname } = useLocation();
  const roles = ["super-admin", "admin", "sales", "finance", "management", "client"];
  return roles.find((r) => pathname.startsWith(`/${r}`)) ?? "admin";
}

// Wrapped in memo so the Navbar only re-renders when its own props change.
// Since onToggleSidebar is created with `() => setExpanded(v => !v)` in
// MainLayout, it would be a new function ref on every render — the parent
// must either use useCallback or pass a stable ref. However, memo here still
// prevents the tree below Navbar from re-rendering unnecessarily.
function Navbar({ onToggleSidebar }) {
  const role = useRole();
  const { short, label } = ROLE_LABELS[role] ?? ROLE_LABELS.admin;

  return (
    <div className="flex h-16 w-full items-center justify-between">

      {/* Left — toggle + search */}
      <div className="flex flex-1 items-center gap-3">
        {/* The toggle button uses `transform` internally in the icon,
            so there's no layout cost from clicking it. */}
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
          title="Toggle sidebar"
        >
          <PanelLeft size={20} />
        </button>

        <div className="hidden items-center gap-2 rounded-full bg-gray-100/80 px-4 py-1.5 text-gray-500 transition-colors duration-150 focus-within:bg-gray-100 md:flex">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search anywhere..."
            className="w-64 border-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Right — notifications + avatar */}
      <div className="flex items-center gap-6">
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors duration-150">
          <Bell size={20} />
          <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="flex cursor-pointer items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
            {short}
          </div>
          <span className="hidden text-sm font-medium text-gray-700 sm:block">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(Navbar);