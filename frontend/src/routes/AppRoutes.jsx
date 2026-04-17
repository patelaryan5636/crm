import { BrowserRouter, Routes, Route } from "react-router-dom";
import SuperAdminRoutes from "./superAdminRoutes";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;