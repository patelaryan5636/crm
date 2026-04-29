import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import SalesTeamLeaderDashboard from "../../pages/sales/salesTeamLeader/SalesTeamLeaderDashboard";
import SalesTeamLeaderLeads from "../../pages/sales/salesTeamLeader/SalesTeamLeaderLeads";
import SalesTeamLeaderMyTeam from "../../pages/sales/salesTeamLeader/SalesTeamLeaderMyTeam";
import SalesTeamLeaderTargets from "../../pages/sales/salesTeamLeader/SalesTeamLeaderTargets";
import SalesTeamLeaderReports from "../../pages/sales/salesTeamLeader/SalesTeamLeaderReports";
import SalesTeamLeaderTickets from "../../pages/sales/salesTeamLeader/SalesTeamLeaderTickets";
import SalesTeamLeaderAnnouncements from "../../pages/sales/salesTeamLeader/SalesTeamLeaderAnnouncements";


function SalesTeamLeaderRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route index element={<SalesTeamLeaderDashboard />} />
                <Route path="leads" element={<SalesTeamLeaderLeads />} />
                <Route path="my-team" element={<SalesTeamLeaderMyTeam />} />
                <Route path="targets" element={<SalesTeamLeaderTargets />} />
                <Route path="reports" element={<SalesTeamLeaderReports />} />
                <Route path="tickets" element={<SalesTeamLeaderTickets />} />
                <Route path="communication" element={<SalesTeamLeaderAnnouncements />} />
            </Route>
        </Routes>
    );
}

export default SalesTeamLeaderRoutes;