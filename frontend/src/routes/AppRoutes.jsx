/**
 * AppRoutes.jsx — Central routing with production-level auth guards
 *
 * Rules:
 *   /super-admin/*    → must be logged in as SUPER_ADMIN  → else /super-admin-login
 *   /admin/*          → must be logged in as ADMIN        → else /admin-login
 *   /sales-manager/*  → USER with role SALES_MANAGER      → else /login
 *   /sales-team-leader/* → USER with role SALES_TL        → else /login
 *   /sales-executive/*   → USER with role SALES_EXECUTIVE → else /login
 *   /finance/*           → USER with role FINANCE_MANAGER or FINANCE_EXECUTIVE
 *   /management-manager/*    → USER with role MANAGEMENT_MANAGER
 *   /management-team-leader/*→ USER with role MANAGEMENT_TL
 *   /management-employee/*   → USER with role MANAGEMENT_EMPLOYEE
 *
 * If logged in but wrong role → show Unauthorized page (not redirect to login).
 * Public routes (auth pages, landing, payment, track) — always accessible.
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './guards';

// ── Auth pages (public) ──────────────────────────────────────
import AdminLogin      from '../pages/auth/AdminLogin';
import AdminRegister   from '../pages/auth/AdminRegister';
import DepartmentLogin from '../pages/auth/DepartmentLogin';
import SuperAdminLogin from '../pages/auth/SuperAdminLogin';
import ClientLogin     from '../pages/auth/ClientLogin';
import ForgotPassword  from '../pages/auth/ForgotPassword';
import Unauthorized    from '../pages/auth/Unauthorized';

// ── Public pages ─────────────────────────────────────────────
import PaymentResult      from '../pages/public/PaymentResult';
import ClientTrackingPage from '../pages/public/ClientTrackingPage';
import LandingPage        from '../pages/LandingPage/Index';

// ── Department workspace (legacy) ───────────────────────────
import DepartmentWorkspace from '../pages/department/DepartmentWorkspace';

// ── Protected route components ───────────────────────────────
import AdminRoutes            from './adminRoutes';
import SuperAdminRoutes       from './superAdminRoutes';
import SalesManagerRoutes     from './Sales/salesManagerRoutes';
import SalesTeamLeaderRoutes  from './Sales/salesTeamLeaderRoutes';
import SalesExecutiveRoutes   from './Sales/salesExecutiveRoutes';
import FinanceRoutes          from './financeRoutes';
import ManagementManagerRoutes    from './Manager/ManagementManagerRoutes';
import ManagementTeamLeaderRoutes from './Manager/ManagementTeamLeaderRoutes';
import ManagementEmployeeRoutes   from './Manager/ManagementEmployeeRoutes';
import ClientRoutes           from './clientRoutes';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ══ LANDING ══════════════════════════════════════════ */}
        <Route path="/" element={<LandingPage />} />

        {/* ══ PUBLIC — no auth required ════════════════════════ */}
        <Route path="/payment-success"  element={<PaymentResult />} />
        <Route path="/track/:token"     element={<ClientTrackingPage />} />

        {/* ══ AUTH PAGES ════════════════════════════════════════ */}
        <Route path="/super-admin-login" element={<SuperAdminLogin />} />
        <Route path="/admin-login"       element={<AdminLogin />} />
        <Route path="/admin-register"    element={<AdminRegister />} />
        <Route path="/login"             element={<DepartmentLogin />} />
        <Route path="/client-login"      element={<ClientLogin />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/unauthorized"      element={<Unauthorized />} />

        {/* ══ LEGACY department workspace ══════════════════════ */}
        <Route path="/department/*" element={<DepartmentWorkspace />} />

        {/* ══ SUPER ADMIN ══════════════════════════════════════ */}
        <Route
          path="/super-admin"
          element={
            <PrivateRoute requiredType="SUPER_ADMIN" loginPath="/super-admin-login">
              <SuperAdminRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/super-admin/*"
          element={
            <PrivateRoute requiredType="SUPER_ADMIN" loginPath="/super-admin-login">
              <SuperAdminRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ ADMIN ════════════════════════════════════════════ */}
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredType="ADMIN" loginPath="/admin-login">
              <AdminRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <PrivateRoute requiredType="ADMIN" loginPath="/admin-login">
              <AdminRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ SALES MANAGER ════════════════════════════════════ */}
        <Route
          path="/sales-manager"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['SALES_MANAGER']}
              loginPath="/login"
            >
              <SalesManagerRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/sales-manager/*"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['SALES_MANAGER']}
              loginPath="/login"
            >
              <SalesManagerRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ SALES TEAM LEADER ════════════════════════════════ */}
        <Route
          path="/sales-team-leader"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['SALES_TL']}
              loginPath="/login"
            >
              <SalesTeamLeaderRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/sales-team-leader/*"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['SALES_TL']}
              loginPath="/login"
            >
              <SalesTeamLeaderRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ SALES EXECUTIVE ══════════════════════════════════ */}
        <Route
          path="/sales-executive"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['SALES_EXECUTIVE']}
              loginPath="/login"
            >
              <SalesExecutiveRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/sales-executive/*"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['SALES_EXECUTIVE']}
              loginPath="/login"
            >
              <SalesExecutiveRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ FINANCE ══════════════════════════════════════════ */}
        <Route
          path="/finance"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['FINANCE_MANAGER', 'FINANCE_EXECUTIVE']}
              loginPath="/login"
            >
              <FinanceRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/finance/*"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['FINANCE_MANAGER', 'FINANCE_EXECUTIVE']}
              loginPath="/login"
            >
              <FinanceRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ MANAGEMENT MANAGER ═══════════════════════════════ */}
        <Route
          path="/management-manager"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['MANAGEMENT_MANAGER']}
              loginPath="/login"
            >
              <ManagementManagerRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/management-manager/*"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['MANAGEMENT_MANAGER']}
              loginPath="/login"
            >
              <ManagementManagerRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ MANAGEMENT TEAM LEADER ═══════════════════════════ */}
        <Route
          path="/management-team-leader"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['MANAGEMENT_TL']}
              loginPath="/login"
            >
              <ManagementTeamLeaderRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/management-team-leader/*"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['MANAGEMENT_TL']}
              loginPath="/login"
            >
              <ManagementTeamLeaderRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ MANAGEMENT EMPLOYEE ══════════════════════════════ */}
        <Route
          path="/management-employee"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['MANAGEMENT_EMPLOYEE']}
              loginPath="/login"
            >
              <ManagementEmployeeRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/management-employee/*"
          element={
            <PrivateRoute
              requiredType="USER"
              requiredRoles={['MANAGEMENT_EMPLOYEE']}
              loginPath="/login"
            >
              <ManagementEmployeeRoutes />
            </PrivateRoute>
          }
        />

        {/* ══ CLIENT PORTAL ════════════════════════════════════ */}
        <Route path="/client"   element={<ClientRoutes />} />
        <Route path="/client/*" element={<ClientRoutes />} />

        {/* ══ CATCH-ALL → /login ═══════════════════════════════ */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
