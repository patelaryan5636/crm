import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  FolderKanban,
  UserCog,
  LifeBuoy,
  BarChart3,
  Settings,
  Shield,
  Cog,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const menu = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "User Management", path: "/admin/users", icon: Users },
  { name: "Leads & Sales", path: "/admin/leads", icon: DollarSign },
  { name: "Projects", path: "/admin/projects", icon: FolderKanban },
  { name: "Finance", path: "/admin/finance", icon: Briefcase },
  { name: "HRM", path: "/admin/hrm", icon: UserCog },
  { name: "Support", path: "/admin/support", icon: LifeBuoy },
  { name: "Reports", path: "/admin/reports", icon: BarChart3 },
  {
    name: "System",
    path: "/admin/system",
    icon: Settings,
    children: [
      { name: "Login Logs", path: "/admin/system/logs", icon: Shield },
      { name: "Company Settings", path: "/admin/system/settings", icon: Cog },
    ],
  },
];

function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    menu.forEach((item) => {
      if (item.children?.some((c) => location.pathname === c.path)) {
        init[item.name] = true;
      }
    });
    return init;
  });

  const toggle = (name) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="h-full flex flex-col bg-[#355872] text-white">
      <div className="p-5 text-xl font-bold border-b border-white/10 tracking-wide">
        CRM Admin
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const isExpanded = expanded[item.name];
          const isChildActive = item.children?.some(
            (c) => location.pathname === c.path,
          );

          return (
<<<<<<< Updated upstream
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                ${isActive
                  ? "bg-[#7AAACE] text-white shadow-md"
                  : "text-gray-200 hover:bg-[#426b8c] hover:text-white hover:translate-x-1"
                }`
              }
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
=======
            <div key={item.name}>
              {hasChildren ? (
                // ✅ Parent with children = button, not a link
                <button
                  onClick={() => toggle(item.name)}
                  className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition-all duration-200
                    ${
                      isChildActive
                        ? "bg-[#7AAACE] text-white shadow-md"
                        : "text-gray-200 hover:bg-[#426b8c] hover:text-white"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              ) : (
                // ✅ Regular item = NavLink
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? "bg-[#7AAACE] text-white shadow-md"
                        : "text-gray-200 hover:bg-[#426b8c] hover:text-white hover:translate-x-1"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.name}</span>
                </NavLink>
              )}

              {/* ✅ Children dropdown */}
              {hasChildren && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <NavLink
                        key={child.name}
                        to={child.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                          ${
                            isActive
                              ? "bg-[#7AAACE] text-white shadow-md"
                              : "text-gray-300 hover:bg-[#426b8c] hover:text-white hover:translate-x-1"
                          }`
                        }
                      >
                        <ChildIcon size={16} />
                        <span className="text-sm font-medium">
                          {child.name}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
>>>>>>> Stashed changes
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 text-xs text-gray-300 text-center">
        © 2026 CRM System
      </div>
    </div>
  );
}

export default Sidebar;
