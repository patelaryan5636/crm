import { createContext, useContext, useState } from "react";
import { INITIAL_LEADS, INITIAL_DUMP, TEAM_LEADERS, MAX_LEADS } from "./leadsStore";

const LeadsContext = createContext(null);

export function LeadsProvider({ children }) {
  const [leads,           setLeads]           = useState(INITIAL_LEADS);
  const [dumpData,        setDumpData]        = useState(INITIAL_DUMP);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // ── Bulk upload state ─────────────────────────────────────────────────────
  const [csvRows,     setCsvRows]     = useState([]);
  const [csvFileName, setCsvFileName] = useState("");

  // ── Distribution state ────────────────────────────────────────────────────
  const [distLeads,     setDistLeads]     = useState([]);
  const [distTLs,       setDistTLs]       = useState([]);
  const [distTableRows, setDistTableRows] = useState([]);
  const [distWarning,   setDistWarning]   = useState("");

  // ── Auto-distribute result ────────────────────────────────────────────────
  const [autoDistResult, setAutoDistResult] = useState([]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const moveToDump = (lead) => {
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    setDumpData((prev) => [
      ...prev,
      {
        id:         lead.id,
        name:       lead.name,
        mobile:     lead.mobile,
        email:      lead.email,
        dumpReason: "Moved by Manager",
        dumpedBy:   "Sales Manager",
        dumpDate:   new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const reassignFromDump = (dumpRow, tlName) => {
    const tl  = TEAM_LEADERS.find((t) => t.name === tlName);
    const cap = tl ? MAX_LEADS - tl.currentLeads : 0;
    if (cap <= 0) return { error: `${tl?.name} has no capacity.` };
    setLeads((prev) => [
      ...prev,
      {
        id:          dumpRow.id,
        name:        dumpRow.name,
        mobile:      dumpRow.mobile,
        email:       dumpRow.email,
        status:      "New",
        assignedTo:  tlName,
        createdAt:   new Date().toISOString().split("T")[0],
        assignedAt:  new Date().toISOString().split("T")[0],
      },
    ]);
    setDumpData((prev) => prev.filter((d) => d.id !== dumpRow.id));
    return { error: null };
  };

  const deleteDumpRow = (id) => setDumpData((prev) => prev.filter((d) => d.id !== id));

  const assignLead = (leadId, tlName) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, assignedTo: tlName } : l)));
  };

  const updateLead = (updated) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const addLeads = (newLeads) => setLeads((prev) => [...prev, ...newLeads]);

  const initDistribution = (ids) => {
    const selected = leads.filter((l) => ids.includes(l.id));
    setDistLeads(selected);
    setDistTLs([]);
    setDistTableRows([]);
    setDistWarning("");
  };

  const addTLToDistribution = (tlId) => {
    const tl = TEAM_LEADERS.find((t) => t.id === tlId);
    if (!tl || distTLs.find((t) => t.id === tlId)) return;
    const cap = MAX_LEADS - tl.currentLeads;
    setDistTLs((prev) => [...prev, tl]);
    setDistTableRows((prev) => [
      ...prev,
      { tlId, tlName: tl.name, currentLeads: tl.currentLeads, capacity: cap, assignLeads: 0, target: 0 },
    ]);
  };

  const updateDistRow = (tlId, field, val) => {
    setDistTableRows((prev) =>
      prev.map((r) => (r.tlId === tlId ? { ...r, [field]: Number(val) } : r))
    );
  };

  const distributeLeads = () => {
    const totalAssigning = distTableRows.reduce((s, r) => s + r.assignLeads, 0);
    if (totalAssigning > distLeads.length)
      return { error: `Cannot assign ${totalAssigning} leads — only ${distLeads.length} selected.` };
    for (const r of distTableRows) {
      if (r.target > r.assignLeads)
        return { error: `Target for ${r.tlName} (${r.target}) cannot exceed assigned leads (${r.assignLeads}).` };
      if (r.assignLeads > r.capacity)
        return { error: `${r.tlName} only has capacity for ${r.capacity} more leads.` };
    }
    const shuffled = [...distLeads].sort(() => Math.random() - 0.5);
    let pointer = 0;
    const updates = {};
    for (const r of distTableRows) {
      shuffled.slice(pointer, pointer + r.assignLeads).forEach((l) => { updates[l.id] = r.tlName; });
      pointer += r.assignLeads;
    }
    setLeads((prev) => prev.map((l) => (updates[l.id] ? { ...l, assignedTo: updates[l.id] } : l)));
    setSelectedLeadIds([]);
    setDistLeads([]);
    setDistTLs([]);
    setDistTableRows([]);
    return { error: null };
  };

  return (
    <LeadsContext.Provider value={{
      leads, setLeads, addLeads, updateLead, moveToDump, assignLead,
      dumpData, reassignFromDump, deleteDumpRow,
      selectedLeadIds, setSelectedLeadIds,
      csvRows, setCsvRows, csvFileName, setCsvFileName,
      distLeads, distTLs, distTableRows, distWarning, setDistWarning,
      initDistribution, addTLToDistribution, updateDistRow, distributeLeads,
      autoDistResult, setAutoDistResult,
    }}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used inside <LeadsProvider>");
  return ctx;
}
