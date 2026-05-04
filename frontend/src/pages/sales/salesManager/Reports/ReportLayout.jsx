import { useState } from "react";
import {
  LayoutDashboard, Users, UserCheck, User,
} from "lucide-react";
import Overview       from "./sections/Overview";
import TeamReports    from "./sections/TeamReports";
import TLReports      from "./sections/TLReports";
import ExecReports    from "./sections/ExecReports";

const TABS = [
  { key: "Overview",         label: "Overview",               icon: LayoutDashboard },
  { key: "TeamReports",      label: "Team Reports",           icon: Users           },
  { key: "TLReports",        label: "Team Leader Reports",    icon: UserCheck       },
  { key: "ExecReports",      label: "Executive Reports",      icon: User            },
];

export default function ReportLayout() {
  const [active, setActive] = useState("Overview");

  return (
    <div className="flex flex-col gap-6">
      {/* ── Tab nav — same pattern as HRMLayout ── */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              active === key
                ? "bg-[#2a465a] text-white shadow"
                : "text-slate-500 hover:text-[#2a465a] hover:bg-slate-100"
            }`}
          >
            <Icon size={15} className="flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Section content ── */}
      {active === "Overview"    && <Overview />}
      {active === "TeamReports" && <TeamReports />}
      {active === "TLReports"   && <TLReports />}
      {active === "ExecReports" && <ExecReports />}
    </div>
  );
}
