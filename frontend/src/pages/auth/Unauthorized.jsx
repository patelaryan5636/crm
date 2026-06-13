/**
 * Unauthorized.jsx
 *
 * Shown when a logged-in user tries to access a route they don't have permission for.
 * e.g. Sales Manager navigates to /sales-team-leader
 *
 * Shows:
 *  - Who they are + their role
 *  - What they tried to access
 *  - A button to go back to their dashboard
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { getAuthState } from '../../utils/auth';

const ROLE_LABELS = {
  SUPER_ADMIN:         'Super Admin',
  ADMIN:               'Admin',
  SALES_MANAGER:       'Sales Manager',
  SALES_TL:            'Sales Team Leader',
  SALES_EXECUTIVE:     'Sales Executive',
  FINANCE_MANAGER:     'Finance Manager',
  FINANCE_EXECUTIVE:   'Finance Executive',
  MANAGEMENT_MANAGER:  'Management Manager',
  MANAGEMENT_TL:       'Management Team Leader',
  MANAGEMENT_EMPLOYEE: 'Management Employee',
};

export default function Unauthorized() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const authState = getAuthState();

  const attempted = location.pathname;
  const roleLabel = ROLE_LABELS[authState.role] || authState.role || 'Unknown';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#2a465a] to-[#1e3a52] px-8 py-10 text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <ShieldX size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Access Denied</h1>
          <p className="text-slate-300 text-sm mt-2">
            You don't have permission to view this page.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-5">

          {/* Who is logged in */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Account</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2a465a]/10 flex items-center justify-center">
                <span className="text-sm font-black text-[#2a465a]">
                  {(authState.profile?.name || roleLabel).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#2a465a]">
                  {authState.profile?.name || 'Logged in user'}
                </p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* What they tried to access */}
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">
              Attempted URL
            </p>
            <p className="text-sm font-mono font-semibold text-rose-700 break-all">
              {attempted}
            </p>
            <p className="text-xs text-rose-500 mt-2">
              This section is restricted to users with a different role.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <button
              onClick={() => navigate(authState.homePath)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#2a465a] text-white text-sm font-bold hover:bg-[#1e3a52] transition shadow-lg shadow-[#2a465a]/20"
            >
              <Home size={16} /> My Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
