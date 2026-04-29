import { Routes, Route,Navigate  } from "react-router-dom";
import MainLayout           from "../../layouts/MainLayout";
import SalesManagerLeads from "../../pages/sales/salesManager/Leads";
import SalesManagerDashboard from "../../pages/sales/salesManager/dashboard";
import SalesTeamLeaders     from "../../pages/sales/salesManager/TeamLeader";
import Communication        from "../../pages/sales/salesManager/Communication";

// Leads section — layout + sub-pages
import LeadsLayout      from "../../pages/sales/salesManager/leads/LeadsLayout";
import AllLeads         from "../../pages/sales/salesManager/leads/AllLeads";
import Prospects        from "../../pages/sales/salesManager/leads/Prospects";
import FollowUps        from "../../pages/sales/salesManager/leads/FollowUps";
import BulkUpload       from "../../pages/sales/salesManager/leads/BulkUpload";
import DumpData         from "../../pages/sales/salesManager/leads/DumpData";

function SalesManagerRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index                element={<SalesManagerDashboard />} />
        <Route path="team-leader"   element={<SalesTeamLeaders />} />
        <Route path="communication" element={<Communication />} />

        {/* Leads section — nested under /sales-manager/leads */}
        <Route path="leads" element={<LeadsLayout />}>
          <Route index              element={<AllLeads />} />
          <Route path="prospects"   element={<Prospects />} />
          <Route path="follow-ups"  element={<FollowUps />} />
          <Route path="bulk-upload" element={<BulkUpload />} />
          <Route path="dump"        element={<DumpData />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default SalesManagerRoutes;
