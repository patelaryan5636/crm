import { useEffect } from "react";
import { useLeads } from "./leadsStore";

export default function AllLeads() {
  const { leads, loading, fetchLeads } = useLeads();

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">All Leads</h2>
      {loading ? (
        <div>Loading leads...</div>
      ) : (
        <div className="space-y-2">
          {leads && leads.length ? (
            leads.map((l) => (
              <div key={l.id} className="p-3 border rounded">
                <div className="font-medium">{l.name}</div>
                <div className="text-sm text-slate-600">{l.email}</div>
              </div>
            ))
          ) : (
            <div className="text-slate-500">No leads yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
