import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminRoutes from "./adminRoutes";
import AdminLogin from "../pages/auth/AdminLogin";
import AdminRegister from "../pages/auth/AdminRegister";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/register" element={<AdminRegister />} />

        {/* Default → Admin */}
        <Route path="/" element={<Navigate to="/admin" />} />

        {/* Admin Panel */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Super Admin (future use) */}
        {/* <Route path="/super-admin/*" element={<SuperAdminRoutes />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
