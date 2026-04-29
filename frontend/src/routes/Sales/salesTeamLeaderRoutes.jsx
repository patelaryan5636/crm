import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import SalesTeamLeaderDashboard from "../../pages/sales/salesTeamLeader/SalesTeamLeaderDashboard";

function SalesTeamLeaderRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route index element={<SalesTeamLeaderDashboard />} />
            </Route>
        </Routes>
    );
}

export default SalesTeamLeaderRoutes;