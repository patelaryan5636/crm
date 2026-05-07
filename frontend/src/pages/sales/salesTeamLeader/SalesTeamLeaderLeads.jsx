import { NavLink, Outlet } from "react-router-dom";

export default function SalesTeamLeaderLeads() {
    const tabs = [
        { to: "all", label: "All Leads" },
        { to: "prospects", label: "Prospects" },
        { to: "follow-ups", label: "Follow Ups" },
    ];

    return (
        <div className="p-4">
            <div className="border-b mb-4">
                <nav className="flex gap-2" aria-label="Sales team leader leads tabs">
                    {tabs.map((t) => (
                        <NavLink
                            key={t.to}
                            to={t.to}
                            end
                            className={({ isActive }) =>
                                `px-3 py-2 rounded-md text-sm hover:bg-slate-100 ${
                                    isActive ? "bg-slate-200 font-semibold" : "text-slate-700"
                                }`
                            }
                        >
                            {t.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div>
                <Outlet />
            </div>
        </div>
    );
}
