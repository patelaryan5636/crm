import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import SalesExecutiveDashboard from "../../pages/sales/salesExecutive/SalesExecutiveDashboard";

function SalesExecutiveRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route index element={<SalesExecutiveDashboard />} />
            </Route>
        </Routes>
    );
}

export default SalesExecutiveRoutes;