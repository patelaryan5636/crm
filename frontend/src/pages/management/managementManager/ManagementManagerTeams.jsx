import { useState, useEffect, useCallback } from "react";
import { TreeDeciduous, UserCheck, Users } from "lucide-react";
import { Heading } from "../../../components/shared/Common_Components.jsx";
import TeamLeadersTab  from "./teams/TeamLeadersTab.jsx";
import EmployeesTab    from "./teams/EmployeesTab.jsx";
import TeamStructureTab from "./teams/TeamStructureTab.jsx";
import apiClient from "../../../services/apiClient.js";
import toast from "react-hot-toast";

const TABS = [
  { key: "Team Leaders", icon: UserCheck },
  { key: "Employees",    icon: Users },
  { key: "Team Structure", icon: TreeDeciduous },
];

export default function ManagementManagerTeams() {
  const [active,   setActive]   = useState("Team Leaders");
  const [teams,    setTeams]    = useState([]);
  const [leaders,  setLeaders]  = useState([]);
  const [employees, setEmployees] = useState([]);
  const [overview, setOverview] = useState({
    teams: 0, leaders: 0, employees: 0, activeProjects: 0, delayedProjects: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, teamsRes, ldRes, empRes] = await Promise.all([
        apiClient.get("/management/teams/overview"),
        apiClient.get("/management/teams"),
        apiClient.get("/management/teams/leaders"),
        apiClient.get("/management/teams/employees"),
      ]);

      setOverview(ovRes?.data?.data  || {});
      setTeams(teamsRes?.data?.data?.teams  || []);
      setLeaders(ldRes?.data?.data?.leaders  || []);
      setEmployees(empRes?.data?.data?.employees || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div className="flex flex-col gap-6">
      <Heading primaryText="Team" secondaryText="Management" size={12} />

      {/* Tab navigation */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              active === key
                ? "bg-[#2a465a] text-white shadow"
                : "text-slate-500 hover:text-[#2a465a] hover:bg-slate-100"
            }`}
          >
            <Icon size={15} className="flex-shrink-0" />
            {key}
          </button>
        ))}
      </div>

      {active === "Team Leaders" && (
        <TeamLeadersTab
          teams={teams}
          leaders={leaders}
          employees={employees}
          overview={overview}
          loading={loading}
          onRefresh={loadAll}
        />
      )}
      {active === "Employees" && (
        <EmployeesTab
          employees={employees}
          overview={overview}
          loading={loading}
          onRefresh={loadAll}
        />
      )}
      {active === "Team Structure" && (
        <TeamStructureTab
          teams={teams}
          leaders={leaders}
          employees={employees}
          loading={loading}
        />
      )}
    </div>
  );
}
