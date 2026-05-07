import { useLeads } from "./leadsStore";

export default function FollowUps() {
  const { leads } = useLeads();

  const followups = (leads || []).filter((l) => l.needsFollowUp);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Follow Ups</h2>
      <div className="space-y-2">
        {followups.length ? (
          followups.map((f) => (
            <div key={f.id} className="p-3 border rounded">
              <div className="font-medium">{f.name}</div>
              <div className="text-sm text-slate-600">Next: {f.nextFollowUp || "—"}</div>
            </div>
          ))
        ) : (
          <div className="text-slate-500">No pending follow ups.</div>
        )}
      </div>
    </div>
  );
}
