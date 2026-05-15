import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import HRMPage from "../../pages/management/managementTeamLeader/hrm/HRMPage";
<<<<<<< HEAD
import NotificationsPage from "../../pages/management/managementTeamLeader/notifications/NotificationsPage";
=======
>>>>>>> 184f463 (save current changes)

function ManagementTeamLeaderRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route index element={<Navigate to="hrm" replace />} />
                <Route path="hrm" element={<HRMPage />} />
<<<<<<< HEAD
                <Route path="notifications" element={<NotificationsPage />} />
=======
>>>>>>> 184f463 (save current changes)
            </Route>
        </Routes>
    );
}

export default ManagementTeamLeaderRoutes;
