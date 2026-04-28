import { Link } from "react-router-dom";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function DepartmentWorkspace() {
  const user = getStoredUser();
  const mustChangePassword = Boolean(user?.mustChangePassword);
  const isProfileComplete = Boolean(user?.isProfileComplete);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto w-full max-w-5xl rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">Department Portal</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Workspace ready</h1>
        <p className="mt-2 text-slate-600">
          {user?.name ? `${user.name} (${user.role})` : "Department member"}
          {user?.email ? ` • ${user.email}` : ""}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">Onboarding</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>{mustChangePassword ? "Password change required before full access" : "Password is verified"}</li>
              <li>{isProfileComplete ? "Profile is complete" : "Profile setup still pending"}</li>
              <li>Tenant-scoped access is active</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">Quick Access</h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <Link to="/login" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700">Back to Login</Link>
              {user?.role === "SALES_MANAGER" && (
                <Link to="/sales-manager" className="rounded-full bg-[#2a465a] px-4 py-2 text-white">Sales Manager Dashboard</Link>
              )}
            </div>
          </div>
        </div>

        {(mustChangePassword || !isProfileComplete) && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            This account still needs first-time setup. Your team can connect this page to the password change and profile completion flow next.
          </div>
        )}
      </div>
    </div>
  );
}
