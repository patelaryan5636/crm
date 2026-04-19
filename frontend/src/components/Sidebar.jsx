import { NavLink } from "react-router-dom";
import { 
  Users, PieChart, FileText, Receipt, LayoutDashboard, 
  DollarSign, FolderOpen, Briefcase, LifeBuoy, BarChart2, Settings 
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "User Management", path: "/users", icon: Users },
  { name: "Leads & Sales", path: "/leads", icon: DollarSign },
  { name: "Projects", path: "/projects", icon: FolderOpen },
  { name: "Finance", path: "/finance", icon: Briefcase },
  { name: "HRM", path: "/hrm", icon: Users },
  { name: "Support", path: "/support", icon: LifeBuoy },
  { name: "Reports", path: "/reports", icon: BarChart2 },
  { name: "System", path: "/system", icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="h-full flex flex-col bg-[#1e3445] text-gray-300 font-sans pb-4 w-64 border-r border-[#152532]">

      {/* Header Logo */}
      <div className="p-6 text-xl font-bold flex items-center gap-2 text-white">
        CRM Admin
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto">

        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                ${
                  isActive || (item.name === "Finance" && window.location.pathname.includes("finance")) || (item.name === "HRM" && window.location.pathname.includes("hrm"))
                    ? "bg-[#3e8ca7] text-white"
                    : "hover:bg-[#2a455a] hover:text-white"
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-[14px]">{item.name}</span>
            </NavLink>
          );
        })}

      </nav>

      {/* Footer Text */}
      <div className="px-4 mt-auto text-center text-xs text-gray-500 py-4">
         © 2026 CRM System
      </div>

    </div>
  );
}