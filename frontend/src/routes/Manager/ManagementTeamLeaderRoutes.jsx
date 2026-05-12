import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";

function ManagementTeamLeaderRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                {/* <Route index element={<ManagementTeamLeaderDashboard />} /> */}
            </Route>
        </Routes>
    );
}

export default ManagementTeamLeaderRoutes;
