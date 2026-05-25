import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";

// ── Packet 1 (DONE) ─────────────────────────────────────────────────────
import ManagementEmployeeDashboard   from "../../pages/management/managementEmployee/ManagementEmployeeDashboard";
import ManagementEmployeeMyProjects  from "../../pages/management/managementEmployee/ManagementEmployeeMyProjects";
import AllAssignedRoute              from "../../pages/management/managementEmployee/projects/AllAssignedRoute";
import ActiveProjects                from "../../pages/management/managementEmployee/projects/ActiveProjects";
import CompletedProjects             from "../../pages/management/managementEmployee/projects/CompletedProjects";

function ManagementEmployeeRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>

        {/* Packet 1 */}
        <Route index element={<ManagementEmployeeDashboard />} />
        <Route path="my-projects" element={<ManagementEmployeeMyProjects />}>
          <Route index             element={<AllAssignedRoute />} />
          <Route path="active"     element={<ActiveProjects />} />
          <Route path="completed"  element={<CompletedProjects />} />
        </Route>

        <Route path="*" element={<Navigate to="/management-employee" replace />} />
      </Route>
    </Routes>
  );
}

export default ManagementEmployeeRoutes;
