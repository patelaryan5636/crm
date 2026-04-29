import { useRef } from "react";
import {
  Grid, Button, Modal, openModal, closeModal,
  ModalData, ModalGrid,
} from "../../../../components/shared/Common_Components";
import {
  Upload, AlertTriangle, CheckCircle, Shuffle, Save, X, UserCheck,
} from "lucide-react";
import { useLeads } from "./LeadsContext";
import { validateCSVRows, TEAM_LEADERS, MAX_LEADS } from "./leadsStore";

export default function BulkUpload() {
  const {
    leads, addLeads,
    csvRows, setCsvRows, csvFileName, setCsvFileName,
    autoDistResult, setAutoDistResult,
  } = useLeads();

  const fileRef = useRef();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text   = ev.target.result;
      const lines  = text.split("\n").filter((l) => l.trim());
      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const nameIdx   = header.indexOf("name");
      const mobileIdx = header.indexOf("mobile");
      const emailIdx  = header.indexOf("email");
      const parsed = lines.slice(1).map((line) => {
        const cols = line.split(",");
        return { name: cols[nameIdx] ?? "", mobile: cols[mobileIdx] ?? "", email: cols[emailIdx] ?? "" };
      });
      setCsvRows(validateCSVRows(parsed, leads));
    };
    reader.readAsText(file);
  };

  const toggleCsvRow = (idx) =>
    setCsvRows((prev) => prev.map((r) => (r._idx === idx ? { ...r, selected: !r.selected } : r)));

  const toggleAllValid = () => {
    const allSelected = validRows.every((r) => r.selected);
    setCsvRows((prev) => prev.map((r) => r.validationStatus === "Valid" ? { ...r, selected: !allSelected } : r));
  };

  const clearUpload = () => {
    setCsvRows([]);
    setCsvFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const saveValidLeads = () => {
    const toAdd = csvRows
      .filter((r) => r.selected && r.validationStatus === "Valid")
      .map((r, i) => ({
        id:          `L${String(leads.length + i + 1).padStart(3, "0")}`,
        name:        r.name,
        mobile:      r.mobile,
        email:       r.email,
        status:      "New",
        assignedTo:  "Unassigned",
        createdAt:   new Date().toISOString().split("T")[0],
        assignedAt:  "",
      }));
    addLeads(toAdd);
    clearUpload();
  };

  const autoDistributeLeads = () => {
    const toDistribute = csvRows.filter((r) => r.selected && r.validationStatus === "Valid");
    if (toDistribute.length === 0) return;

    const eligible = TEAM_LEADERS
      .filter((tl) => (MAX_LEADS - tl.currentLeads) > 0)
      .map((tl) => ({ ...tl, capacity: MAX_LEADS - tl.currentLeads, assigned: 0 }));

    if (eligible.length === 0) { alert("No team leaders have available capacity."); return; }

    const assignments = {};
    let pointer = 0;
    for (const row of toDistribute) {
      let placed = false;
      for (let attempt = 0; attempt < eligible.length; attempt++) {
        const tl = eligible[pointer % eligible.length];
        pointer++;
        if (tl.assigned < tl.capacity) {
          assignments[row._idx] = tl.name;
          tl.assigned++;
          placed = true;
          break;
        }
      }
      if (!placed) assignments[row._idx] = "Unassigned";
    }

    const today    = new Date().toISOString().split("T")[0];
    const newLeads = toDistribute.map((r, i) => ({
      id:          `L${String(leads.length + i + 1).padStart(3, "0")}`,
      name:        r.name,
      mobile:      r.mobile,
      email:       r.email,
      status:      "New",
      assignedTo:  assignments[r._idx] ?? "Unassigned",
      createdAt:   today,
      assignedAt:  assignments[r._idx] ? today : "",
    }));

    addLeads(newLeads);

    const summary = {};
    for (const lead of newLeads) summary[lead.assignedTo] = (summary[lead.assignedTo] ?? 0) + 1;
    setAutoDistResult(Object.entries(summary).map(([tlName, count]) => ({ tlName, count })));

    clearUpload();
    openModal("bu-dist-result-modal");
  };

  const downloadCSVFormat = () => {
    const content = "Name,Mobile,Email\nJohn Doe,9876543210,john@example.com";
    const blob = new Blob([content], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "lead_upload_format.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const validRows     = csvRows.filter((r) => r.validationStatus === "Valid");
  const invalidRows   = csvRows.filter((r) => r.validationStatus === "Invalid");
  const duplicateRows = csvRows.filter((r) => r.errorReason?.includes("Duplicate"));
  const selectedCount = csvRows.filter((r) => r.selected).length;

  return (
    <>
      <Grid cols={12} gap={4}>
        {/* Upload controls */}
        <div className="col-span-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-base font-bold text-[#2a465a]">CSV Bulk Upload</p>
            <p className="text-sm text-slate-500 mt-1">
              Upload a CSV with columns:{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Name, Mobile, Email</code>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button text="Download CSV Format" variant="secondary" size={3} onClick={downloadCSVFormat} />
            <label className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-dashed border-[#2a465a]/40 bg-slate-50 text-sm font-bold text-[#2a465a] cursor-pointer hover:bg-slate-100 transition">
              <Upload size={15} /> {csvFileName || "Choose CSV File"}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* Duplicate warning */}
        {duplicateRows.length > 0 && (
          <div className="col-span-12 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{duplicateRows.length} duplicate entr{duplicateRows.length > 1 ? "ies" : "y"} detected</p>
              <ul className="mt-2 space-y-0.5">
                {duplicateRows.map((r) => (
                  <li key={r._idx} className="text-xs font-medium">• <span className="font-bold">{r.name || "(no name)"}</span> — {r.errorReason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Validation table */}
        {csvRows.length > 0 && (
          <div className="col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="font-bold text-[#2a465a]">Validation Results</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="text-emerald-600 font-semibold">{validRows.length} valid</span>
                  {" · "}
                  <span className="text-rose-500 font-semibold">{invalidRows.length} invalid</span>
                  {" · "}
                  <span className="text-slate-500">{selectedCount} selected</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearUpload} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                  <X size={14} /> Cancel
                </button>
                <button onClick={autoDistributeLeads} disabled={selectedCount === 0}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[#2a465a]/30 bg-[#2a465a]/8 text-sm font-bold text-[#2a465a] hover:bg-[#2a465a]/15 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <Shuffle size={14} /> Auto Distribute Leads
                </button>
                <button onClick={saveValidLeads} disabled={selectedCount === 0}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2a465a] text-white text-sm font-bold hover:bg-[#1e3a52] transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <Save size={14} /> Save Leads {selectedCount > 0 ? `(${selectedCount})` : ""}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#2a465a] to-[#3a5a7a]">
                    <th className="py-3.5 pl-5 pr-2 w-10">
                      <button type="button" onClick={toggleAllValid}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${validRows.length > 0 && validRows.every((r) => r.selected) ? "bg-white border-white" : "bg-transparent border-white/40 hover:border-white/80"}`}>
                        {validRows.length > 0 && validRows.every((r) => r.selected) && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#2a465a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                    </th>
                    {["Name", "Mobile", "Email", "Status", "Error"].map((h) => (
                      <th key={h} className="py-3.5 px-4 text-left text-xs font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.map((row, i) => {
                    const isValid = row.validationStatus === "Valid";
                    return (
                      <tr key={row._idx} className={`border-b border-slate-100 transition ${row.selected ? "bg-blue-50/60" : i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} ${!isValid ? "opacity-70" : ""}`}>
                        <td className="py-3 pl-5 pr-2 w-10">
                          <button type="button" disabled={!isValid} onClick={() => toggleCsvRow(row._idx)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${row.selected ? "bg-[#2a465a] border-[#2a465a]" : isValid ? "bg-white border-slate-300 hover:border-[#2a465a]/60" : "bg-slate-100 border-slate-200 cursor-not-allowed"}`}>
                            {row.selected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#2a465a]">{row.name || <span className="text-rose-400 italic text-xs">missing</span>}</td>
                        <td className="py-3 px-4 text-slate-600">{row.mobile || <span className="text-rose-400 italic text-xs">missing</span>}</td>
                        <td className="py-3 px-4 text-slate-600">{row.email || <span className="text-rose-400 italic text-xs">missing</span>}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isValid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {isValid ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                            {isValid ? "Valid" : "Invalid"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-rose-500 max-w-[200px]">{row.errorReason || <span className="text-slate-400">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Grid>

      {/* Auto-distribute result modal */}
      <Modal id="bu-dist-result-modal" title="Leads Distributed Successfully" size="md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl">
            <CheckCircle size={18} className="flex-shrink-0" />
            <p className="text-sm font-semibold">
              {autoDistResult.reduce((s, r) => s + r.count, 0)} leads distributed across{" "}
              {autoDistResult.filter((r) => r.tlName !== "Unassigned").length} team leader(s) using round-robin scheduling.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#2a465a] to-[#3a5a7a]">
                  <th className="py-3 px-4 text-left text-xs font-black text-white uppercase tracking-[0.2em]">Team Leader</th>
                  <th className="py-3 px-4 text-left text-xs font-black text-white uppercase tracking-[0.2em]">Leads Assigned</th>
                </tr>
              </thead>
              <tbody>
                {autoDistResult.map((row, i) => (
                  <tr key={row.tlName} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="py-3 px-4 font-semibold text-[#2a465a]">
                      {row.tlName === "Unassigned"
                        ? <span className="flex items-center gap-1.5 text-slate-400"><AlertTriangle size={13} /> Unassigned (capacity full)</span>
                        : <span className="flex items-center gap-1.5"><UserCheck size={13} className="text-emerald-600" /> {row.tlName}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${row.tlName === "Unassigned" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>
                        {row.count} lead{row.count !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("bu-dist-result-modal")} />
          </div>
        </div>
      </Modal>
    </>
  );
}
