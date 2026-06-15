/**
 * guards.jsx — Route protection components
 *
 * PrivateRoute   — checks isLoggedIn. If not → redirect to correct login page.
 * RoleGuard      — checks role. If wrong → show Unauthorized page.
 *
 * Usage in AppRoutes:
 *
 *   <PrivateRoute requiredType="ADMIN" loginPath="/admin-login">
 *     <AdminRoutes />
 *   </PrivateRoute>
 *
 *   <PrivateRoute requiredType="USER" requiredRoles={['SALES_MANAGER']} loginPath="/login">
 *     <SalesManagerRoutes />
 *   </PrivateRoute>
 */

import { Navigate, useLocation } from 'react-router-dom';
import { getAuthState } from '../utils/auth';
import Unauthorized from '../pages/auth/Unauthorized';

/**
 * PrivateRoute
 *
 * @param {string}   requiredType   — 'SUPER_ADMIN' | 'ADMIN' | 'USER'
 * @param {string[]} [requiredRoles] — for USER type: array of allowed roles
 * @param {string}   loginPath      — where to redirect if not logged in
 * @param {ReactNode} children
 */
export function PrivateRoute({ requiredType, requiredRoles, loginPath, children }) {
  const auth     = getAuthState();
  const location = useLocation();

  // Not logged in at all → go to correct login page
  if (!auth.isLoggedIn) {
    return (
      <Navigate
        to={loginPath}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Logged in as wrong holder type (e.g. accessing /admin as a USER)
  if (requiredType && auth.holderType !== requiredType) {
    return <Unauthorized />;
  }

  // Logged in as correct type but wrong role (e.g. SALES_TL accessing /sales-manager)
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(auth.role)) {
    return <Unauthorized />;
  }

  return children;
}
