import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart2,
  Briefcase,
  DollarSign,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  UserCog,
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "User Management", path: "/admin/users", icon: Users },
  { name: "Leads & Sales", path: "/admin/leads", icon: DollarSign },
  { name: "Projects", path: "/admin/projects", icon: FolderOpen },
  { name: "Finance", path: "/admin/finance", icon: Briefcase },
  { 
    name: "HRM", 
    path: "/admin/hrm", 
    icon: UserCog,
  },
  { name: "Support", path: "/admin/support", icon: LifeBuoy },
  { name: "Reports", path: "/admin/reports", icon: BarChart2 },
  { name: "System", path: "/admin/system", icon: Settings },
];

const MenuItem = ({ item, depth = 0 }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(
    item.subItems ? item.subItems.some(sub => location.pathname.startsWith(sub.path || "###")) : false
  );

  const hasSubItems = item.subItems && item.subItems.length > 0;
  const Icon = item.icon;
  const isExactActive = location.pathname === item.path;

  // For items with subItems that don't have a path, prevent navigating
  const handleClick = (e) => {
    if (hasSubItems) {
      if (!item.path) e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="flex flex-col">
      <NavLink
        to={item.path || "#"}
        onClick={handleClick}
        className={`group flex items-center justify-between rounded-lg py-3 font-medium transition-all duration-200 ${depth === 0 ? "px-4" : depth === 1 ? "pl-10 pr-4" : "pl-14 pr-4"
          } ${isExactActive
            ? "bg-[#3e8ca7] text-white"
            : "text-gray-300 hover:bg-[#2a455a] hover:text-white"
          }`}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="flex-shrink-0" />}
          <span className="text-[14px]">{item.name}</span>
        </div>
        {hasSubItems && (
          <div className="flex-shrink-0">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </NavLink>

      {hasSubItems && isOpen && (
        <div className="mt-1 flex flex-col space-y-1">
          {item.subItems.map((subItem) => (
            <MenuItem key={subItem.name} item={subItem} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r border-[#152532] bg-[#1e3445] pb-4 font-sans text-gray-300">
      <div className="flex items-center gap-2 p-6 text-xl font-bold text-white">
        CRM Admin
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-2">
        {menu.map((item) => (
          <MenuItem key={item.name} item={item} depth={0} />
        ))}
      </nav>

      <div className="mt-auto px-4 py-4 text-center text-xs text-gray-500">
        © 2026 CRM System
      </div>
    </div>
  );
}
