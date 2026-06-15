/**
 * auth.js — Central auth state utilities
 *
 * All auth reads go through here. Single source of truth.
 * Reads from sessionStorage (set by authService on login).
 *
 * holderType:
 *   'SUPER_ADMIN'  → sessionStorage.superAdmin
 *   'ADMIN'        → sessionStorage.admin
 *   'USER'         → sessionStorage.user  (role = SALES_MANAGER | SALES_TL | ...)
 *   null           → not logged in
 */

const ROLE_TO_BASE_PATH = {
  SALES_MANAGER:       '/sales-manager',
  SALES_TL:            '/sales-team-leader',
  SALES_EXECUTIVE:     '/sales-executive',
  FINANCE_MANAGER:     '/finance',
  FINANCE_EXECUTIVE:   '/finance',
  MANAGEMENT_MANAGER:  '/management-manager',
  MANAGEMENT_TL:       '/management-team-leader',
  MANAGEMENT_EMPLOYEE: '/management-employee',
};

/**
 * Read and parse a sessionStorage key safely.
 */
const readSession = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Returns the current auth state object.
 *
 * {
 *   token:      string | null,
 *   holderType: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | null,
 *   role:       string | null,   // only for USER type
 *   profile:    object | null,   // the parsed session object
 *   isLoggedIn: boolean,
 *   homePath:   string,          // where to redirect after login
 * }
 */
export const getAuthState = () => {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

  const superAdmin = readSession('superAdmin');
  const admin      = readSession('admin');
  const user       = readSession('user');

  if (token && superAdmin) {
    return {
      token,
      holderType: 'SUPER_ADMIN',
      role:       'SUPER_ADMIN',
      profile:    superAdmin,
      isLoggedIn: true,
      homePath:   '/super-admin',
    };
  }

  if (token && admin) {
    return {
      token,
      holderType: 'ADMIN',
      role:       'ADMIN',
      profile:    admin,
      isLoggedIn: true,
      homePath:   '/admin',
    };
  }

  if (token && user) {
    const role     = user.role || null;
    const basePath = ROLE_TO_BASE_PATH[role] || '/login';
    return {
      token,
      holderType: 'USER',
      role,
      profile:    user,
      isLoggedIn: true,
      homePath:   basePath,
    };
  }

  return {
    token:      null,
    holderType: null,
    role:       null,
    profile:    null,
    isLoggedIn: false,
    homePath:   '/login',
  };
};

/**
 * Maps a URL prefix to the login page that should handle it.
 */
export const getLoginForPath = (pathname) => {
  if (pathname.startsWith('/super-admin')) return '/super-admin-login';
  if (pathname.startsWith('/admin'))        return '/admin-login';
  return '/login';   // all department users
};
