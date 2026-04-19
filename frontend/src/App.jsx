import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Pages (simple bana lena agar nahi hai)
import HRMDashboard from "./pages/admin/HRMDashboard";
import FinanceDashboard from "./pages/admin/FinanceDashboard";
import InvoiceManagement from "./pages/admin/InvoiceManagement";
import ExpenseManagement from "./pages/admin/ExpenseManagement";

function App() {
  return (
    <Router>
      <Routes>

        {/* Main Layout */}
        <Route path="/" element={<MainLayout />}>

          {/* Default redirect */}
          <Route index element={<Navigate to="/hrm" replace />} />

          {/* Pages */}
          <Route path="hrm" element={<HRMDashboard />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="invoices" element={<InvoiceManagement />} />
          <Route path="expenses" element={<ExpenseManagement />} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;