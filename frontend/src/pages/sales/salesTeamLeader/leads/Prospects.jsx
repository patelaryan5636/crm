import { useLeads } from "./leadsStore";

export default function Prospects() {
  const { leads } = useLeads();

  const prospects = (leads || []).filter((l) => l.stage === "prospect");

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Prospects</h2>
      <div className="space-y-2">
        {prospects.length ? (
          prospects.map((p) => (
            <div key={p.id} className="p-3 border rounded">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-slate-600">{p.email}</div>
            </div>
          ))
        ) : (
          <div className="text-slate-500">No prospects found.</div>
        )}
      </div>
    </div>
  );
}
