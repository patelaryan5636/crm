import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SuperAdminRoutes from "./superAdminRoutes";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;