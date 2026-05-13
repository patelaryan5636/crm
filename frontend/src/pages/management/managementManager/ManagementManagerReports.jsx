import { useState } from "react";
import { Heading, Grid } from "../../../components/shared/Common_Components";
import ProjectReports from "./reports/ProjectReports";
import TeamReports from "./reports/TeamReports";
import DeliveryReports from "./reports/DeliveryReports";
import TLReports from "./reports/TLReports";

export default function ManagementManagerReports() {
  const [activeTab, setActiveTab] = useState("project");

  const tabs = [
    { id: "project", label: "Project Reports", component: ProjectReports },
    { id: "team", label: "Team Reports", component: TeamReports },
    { id: "delivery", label: "Delivery Reports", component: DeliveryReports },
    { id: "tl", label: "TL Reports", component: TLReports },
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component;

  return (
    <div>
      <Grid cols={12} gap={4}>
        <Heading
          primaryText="Reports"
          secondaryText="Project, team, and delivery analytics"
          size={12}
        />
      </Grid>

      {/* Tab Navigation */}
      <Grid cols={12} gap={4}>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex gap-4 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Grid>

      {/* Tab Content */}
      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}