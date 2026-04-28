import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminRoutes from "./adminRoutes";
import SuperAdminRoutes from "./superAdminRoutes";
import AdminLogin from "../pages/auth/AdminLogin";
import AdminRegister from "../pages/auth/AdminRegister";
import SalesManagerRoutes from "./Sales/salesManagerRoutes";
import DepartmentLogin from "../pages/auth/DepartmentLogin";
import SuperAdminLogin from "../pages/auth/SuperAdminLogin";
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Authentication Pages */}
        <Route path="/super-admin-login" element={<SuperAdminLogin />} />
        <Route path="/Admin-login" element={<AdminLogin />} />
        <Route path="/Admin-register" element={<AdminRegister />} />
        <Route path="/login" element={<DepartmentLogin />} />
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
        {/* Super_Admin Routes */}
        <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
        {/* Sales manager Routes */}
        <Route path="/sales-manager/*" element={<SalesManagerRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
