import { Routes, Route, Navigate } from "react-router-dom";
import SalesManagerDashboard from "../../pages/sales/salesManager/Dashboard";
import MainLayout from "../../layouts/MainLayout";

function SalesManagerRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<SalesManagerDashboard />} />
      </Route>
    </Routes>
  );
}

export default SalesManagerRoutes;