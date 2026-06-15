import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ClientPanel from "../pages/client/ClientPanel";
import ClientTrackingPage from "../pages/public/ClientTrackingPage";

function ClientRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<ClientPanel />} />
        <Route path="*" element={<Navigate to="/client" replace />} />
      </Route>
    </Routes>
  );
}

export default ClientRoutes;
