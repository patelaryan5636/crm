import { Heading } from "../../../../components/shared/Common_Components";

export default function LoginLogs() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <Heading primaryText="Login Logs" showAnimations />
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-center justify-center text-slate-400 text-sm">
        Login activity logs will appear here.
      </div>
    </div>
  );
}
