import { createContext, useContext, useState } from "react";

const LeadsContext = createContext(null);

export function LeadsProvider({ children, initial = [] }) {
  const [leads, setLeads] = useState(initial);
  const [loading, setLoading] = useState(false);

  // Placeholder fetch: consumers should replace with real API call
  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Example: replace with axios.get('/api/leads')
      // For now, seed with demo data if empty
      if (!leads || leads.length === 0) {
        setLeads([
          { id: "1", name: "Acme Corp", email: "contact@acme.com", stage: "prospect", needsFollowUp: true, nextFollowUp: "2026-05-10" },
          { id: "2", name: "Beta LLC", email: "hello@beta.com", stage: "lead", needsFollowUp: false },
        ]);
      }
    } catch (e) {
      // swallow for now
      // console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const assignLead = (id, assignee) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, assignee } : l)));
  };

  const setAllLeads = (list) => setLeads(list || []);

  return (
    <LeadsContext.Provider value={{ leads, loading, fetchLeads, assignLead, setAllLeads }}>
      {children}
    </LeadsContext.Provider>
  );
}

export const useLeads = () => {
  const ctx = useContext(LeadsContext);
  if (!ctx) {
    throw new Error("useLeads must be used within a LeadsProvider");
  }
  return ctx;
};

export default LeadsProvider;
