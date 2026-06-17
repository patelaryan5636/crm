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

import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './guards';

// ── Auth pages (public) ──────────────────────────────────────
import AdminLogin      from '../pages/auth/AdminLogin';
import AdminRegister   from '../pages/auth/AdminRegister';
import DepartmentLogin from '../pages/auth/DepartmentLogin';
import SuperAdminLogin from '../pages/auth/SuperAdminLogin';
import ForgotPassword  from '../pages/auth/ForgotPassword';
import Unauthorized    from '../pages/auth/Unauthorized';

// ── Public pages ─────────────────────────────────────────────
import PaymentResult      from '../pages/public/PaymentResult';
import ClientTrackingPage from '../pages/public/ClientTrackingPage';
import LandingPage        from '../pages/LandingPage/Index';

// ── Policy pages — lazy loaded so ad-blockers blocking these
//    filenames don't crash the entire app on startup ──────────
const TermsAndConditions = lazy(() => import('../pages/Policies/Terms&Conditions'));
const PrivacyPolicy      = lazy(() => import('../pages/Policies/PrivacyPolicy'));
const CookiePolicy       = lazy(() => import('../pages/Policies/CookiePolicy'));
const HowToUse           = lazy(() => import('../pages/Policies/HowToUse'));

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

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ══ LANDING ══════════════════════════════════════════ */}
        <Route path="/" element={<LandingPage />} />

        {/* Policy Pages — wrapped in Suspense so a blocked/failed load
            shows a simple fallback instead of crashing the whole app */}
        <Route
          path="/terms-and-conditions"
          element={
            <Suspense fallback={<PolicyFallback />}>
              <TermsAndConditions />
            </Suspense>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <Suspense fallback={<PolicyFallback />}>
              <PrivacyPolicy />
            </Suspense>
          }
        />
        <Route
          path="/cookie-policy"
          element={
            <Suspense fallback={<PolicyFallback />}>
              <CookiePolicy />
            </Suspense>
          }
        />
        <Route
          path="/how-to-use"
          element={
            <Suspense fallback={<PolicyFallback />}>
              <HowToUse />
            </Suspense>
          }
        />
        {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}

        {/* ── Public pages (no auth) ── */}
        {/* Razorpay redirects the client here after payment */}
        <Route path="/payment-success" element={<PaymentResult />} />
        {/* Magic link client tracking — no login required */}
        <Route path="/track/:token" element={<ClientTrackingPage />} />

        {/* ══ AUTH PAGES ════════════════════════════════════════ */}
        <Route path="/super-admin-login" element={<SuperAdminLogin />} />
        <Route path="/admin-login"       element={<AdminLogin />} />
        <Route path="/admin-register"    element={<AdminRegister />} />
        <Route path="/login"             element={<DepartmentLogin />} />
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

        {/* ══ CATCH-ALL → /login ═══════════════════════════════ */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

/** Shown while a policy page lazy-chunk is loading or if the
 *  browser/ad-blocker prevents it from loading. */
function PolicyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3 p-8">
        <div className="w-8 h-8 border-2 border-[#2a465a] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading page…</p>
        <p className="text-slate-400 text-xs">
          If this takes too long, try disabling your ad-blocker for this site.
        </p>
      </div>
    </div>
  );
}

export default AppRoutes;
