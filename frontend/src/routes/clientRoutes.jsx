import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ClientProfile from "../pages/client/ClientProfile";
import SampleDash from "../pages/client/SampleDash";

function ClientRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<SampleDash />} />
        <Route path="profile" element={<ClientProfile />} />
      </Route>
    </Routes>
  );
}

export default ClientRoutes;
