import { useState } from "react";
import {
  DashGrid, EnhancedDashCard, DataTable, Button,
  Modal, ModalProfile, ModalGrid, ModalData,
  DataField, SelectField, Option,
  openModal, closeModal,
} from "../../../../components/shared/Common_Components.jsx";
import {
  UserCheck, Users, Activity, Zap,
  Eye, Pencil, Trash2, Plus, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../../../../services/apiClient.js";

const statusBadge = (v) => {
  const cls = v === "Active" ? "bg-emerald-100 text-emerald-700"
    : v === "On Leave" ? "bg-amber-100 text-amber-700"
    : "bg-slate-100 text-slate-500";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{v}</span>;
};

const blankForm = () => ({ name: "", leaderId: "", memberIds: new Set() });

export default function TeamLeadersTab({ teams, leaders, employees, overview, loading, onRefresh }) {
  const [selected,     setSelected]     = useState(null); // selected team for view/edit
  const [form,         setForm]         = useState(blankForm());
  const [formMode,     setFormMode]     = useState("create"); // "create" | "edit"
  const [formLoading,  setFormLoading]  = useState(false);
  const [formError,    setFormError]    = useState("");
  const [viewLeader,   setViewLeader]   = useState(null);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getLeaderTeams = (leaderId) =>
    teams.filter((t) => t.leader?.id === leaderId || t.leader?._id === leaderId);

  const toggleMember = (id) =>
    setForm((p) => {
      const next = new Set(p.memberIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...p, memberIds: next };
    });

  // ── Open create modal ───────────────────────────────────────────────────
  const openCreate = () => {
    setFormMode("create");
    setSelected(null);
    setForm(blankForm());
    setFormError("");
    openModal("mm-team-form");
  };

  // ── Open edit modal ─────────────────────────────────────────────────────
  const openEdit = async (team) => {
    setFormMode("edit");
    setSelected(team);
    setForm({
      name:      team.name,
      leaderId:  team.leader?.id || "",
      memberIds: new Set((team.members || []).map((m) => m.id)),
    });
    setFormError("");
    openModal("mm-team-form");
  };

  // ── Save (create or update) ─────────────────────────────────────────────
  const save = async () => {
    if (!form.name.trim())  { setFormError("Team name is required");   return; }
    if (!form.leaderId)     { setFormError("Select a Team Leader");     return; }
    setFormLoading(true);
    setFormError("");
    try {
      if (formMode === "create") {
        await apiClient.post("/management/teams", {
          name:      form.name.trim(),
          leaderId:  form.leaderId,
          memberIds: [...form.memberIds],
        });
        toast.success("Team created");
      } else {
        await apiClient.put(`/management/teams/${selected.id}`, {
          name:     form.name.trim(),
          leaderId: form.leaderId,
        });
        // Sync members: add new ones, remove removed ones
        const prev = new Set((selected.members || []).map((m) => m.id));
        const curr = form.memberIds;
        const toAdd    = [...curr].filter((id) => !prev.has(id));
        const toRemove = [...prev].filter((id) => !curr.has(id));
        for (const uid of toAdd)    await apiClient.post(`/management/teams/${selected.id}/members`, { userId: uid }).catch(() => {});
        for (const uid of toRemove) await apiClient.delete(`/management/teams/${selected.id}/members/${uid}`).catch(() => {});
        toast.success("Team updated");
      }
      closeModal("mm-team-form");
      onRefresh();
    } catch (err) {
      setFormError(err?.message || "Failed to save team");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete team ─────────────────────────────────────────────────────────
  const deleteTeam = async (team) => {
    if (!window.confirm(`Delete team "${team.name}"?`)) return;
    try {
      await apiClient.delete(`/management/teams/${team.id}`);
      toast.success("Team deleted");
      onRefresh();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  // ── Table rows: one row per LEADER (not per team) ───────────────────────
  const leaderRows = leaders.map((l) => {
    const myTeams = teams.filter((t) => t.leader?.id === l.id);
    const allMembers = new Set(myTeams.flatMap((t) => (t.members || []).map((m) => m.id)));
    return {
      id:          l.id,
      name:        l.name,
      phone:       l.mobile,
      status:      l.isActive ? "Active" : "Inactive",
      employees:   allMembers.size,
      teamCount:   myTeams.length,
    };
  });

  // ── Selected leader info for view modal ────────────────────────────────
  const selectedLeaderTeams = viewLeader ? getLeaderTeams(viewLeader.id) : [];
  const selectedLeaderMembers = [...new Set(selectedLeaderTeams.flatMap((t) => (t.members || []).map((m) => m.id)))];
  const selectedLeaderEmployees = employees.filter((e) => selectedLeaderMembers.includes(e.id));

  // ── Table columns ───────────────────────────────────────────────────────
  const tlCols = [
    { key: "name",       label: "Team Leader" },
    { key: "phone",      label: "Phone" },
    { key: "status",     label: "Status", render: statusBadge },
    { key: "employees",  label: "Employees" },
    { key: "teamCount",  label: "Teams" },
  ];

  const teamCols = [
    { key: "name",        label: "Team Name" },
    { key: "leaderName",  label: "Team Leader" },
    { key: "memberCount", label: "Members" },
    { key: "isActive",    label: "Status",
      render: (v) => statusBadge(v ? "Active" : "Inactive") },
  ];

  const teamRows = teams.map((t) => ({
    ...t,
    leaderName: t.leader?.name || "—",
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard title="Team Leaders"    value={overview.leaders  || 0} icon={<UserCheck size={22}/>} accentColor="#3b82f6" size={3}/>
        <EnhancedDashCard title="Employees"       value={overview.employees || 0} icon={<Users size={22}/>}     accentColor="#8b5cf6" size={3}/>
        <EnhancedDashCard title="Active Projects" value={overview.activeProjects  || 0} icon={<Activity size={22}/>} accentColor="#14b8a6" size={3}/>
        <EnhancedDashCard title="Delayed Projects" value={overview.delayedProjects || 0} icon={<Zap size={22}/>}  accentColor="#f97316" size={3}/>
      </DashGrid>

      {/* Header + Create button */}
      <div className="flex items-center justify-between">
        <p className="text-lg font-black text-[#2a465a]">Team Leaders <span className="text-slate-400 font-semibold text-base">Data table</span></p>
        <Button text="Create Team" variant="primary" size={3} onClick={openCreate} />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      )}

      {!loading && (
        <>
          {/* Team Leaders table */}
          <DataTable
            title="Team Leaders"
            columns={tlCols}
            rows={leaderRows}
            pageSize={10}
            searchable
            exportable
            exportFileName="management_leaders"
            userProfile="name"
            actions={[
              { icon: <Eye size={15}/>, tooltip: "View", variant: "ghost",
                onClick: (row) => { setViewLeader(leaders.find((l) => l.id === row.id)); openModal("mm-tl-view"); }},
            ]}
          />

          {/* Teams table */}
          <DataTable
            title="All Teams"
            columns={teamCols}
            rows={teamRows}
            pageSize={10}
            searchable
            exportable
            exportFileName="management_teams"
            actions={[
              { icon: <Eye size={15}/>,    tooltip: "View Team",   variant: "ghost",  onClick: (row) => { setViewLeader(leaders.find((l) => l.id === row.leader?.id)); setSelected(teams.find(t => t.id === row.id)); openModal("mm-team-view"); }},
              { icon: <Pencil size={15}/>, tooltip: "Edit Team",   variant: "ghost",  onClick: (row) => openEdit(teams.find(t => t.id === row.id))},
              { icon: <Trash2 size={15}/>, tooltip: "Delete Team", variant: "danger", onClick: (row) => deleteTeam(teams.find(t => t.id === row.id))},
            ]}
          />
        </>
      )}

      {/* ── Create / Edit Team Modal ───────────────────────────────────────── */}
      <Modal id="mm-team-form" title={formMode === "create" ? "Create Team" : "Edit Team"} size="xl">
        <div className="flex flex-col gap-5">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">{formError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DataField label="Team Name *" id="mm-tf-name" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} size={12}/>
            <SelectField label="Team Leader (Management TL) *" id="mm-tf-leader" value={form.leaderId}
              onChange={(e) => setForm((p) => ({ ...p, leaderId: e.target.value }))}>
              <Option value="" label="— Select Team Leader —" />
              {leaders.filter((l) => l.isActive).map((l) => (
                <Option key={l.id} value={l.id} label={`${l.name} — ${l.mobile || l.email}`} />
              ))}
            </SelectField>
          </div>

          {/* Selected leader info */}
          {form.leaderId && (() => {
            const l = leaders.find((x) => x.id === form.leaderId);
            if (!l) return null;
            return (
              <ModalGrid title="Selected Leader" cols={3}>
                <ModalData label="Name"   value={l.name}  />
                <ModalData label="Email"  value={l.email} />
                <ModalData label="Mobile" value={l.mobile || "—"} />
              </ModalGrid>
            );
          })()}

          {/* Employee picker — employees can be in multiple teams */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-[#2a465a] uppercase tracking-widest">
              Assign Employees
              <span className="ml-2 text-slate-400 font-semibold normal-case tracking-normal text-[11px]">
                — management employees can belong to multiple teams
              </span>
            </p>
            {employees.length === 0 ? (
              <p className="text-sm text-slate-400">No management employees found.</p>
            ) : (
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {employees.map((e) => (
                  <label key={e.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" className="w-4 h-4 rounded accent-[#2a465a]"
                      checked={form.memberIds.has(e.id)} onChange={() => toggleMember(e.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{e.name}</p>
                      <p className="text-xs text-slate-400 truncate">{e.email}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{e.mobile || "—"}</span>
                    {e.teamCount > 0 && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold shrink-0">
                        {e.teamCount} team{e.teamCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">{form.memberIds.size} employee{form.memberIds.size !== 1 ? "s" : ""} selected</p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button text="Cancel" variant="ghost" size={3} onClick={() => closeModal("mm-team-form")} />
            <Button text={formLoading ? "Saving…" : formMode === "create" ? "Create Team" : "Save Changes"}
              variant="primary" size={3} onClick={save} />
          </div>
        </div>
      </Modal>

      {/* ── View Team Leader Modal ─────────────────────────────────────────── */}
      <Modal id="mm-tl-view" title="Team Leader Details" size="xl">
        {viewLeader && (
          <div className="flex flex-col gap-4">
            <ModalProfile name={viewLeader.name} subtitle={viewLeader.email || "—"}
              meta={`Mobile: ${viewLeader.mobile || "—"} · ${viewLeader.isActive ? "Active" : "Inactive"}`} />
            <ModalGrid title="Summary" cols={2}>
              <ModalData label="Teams"     value={getLeaderTeams(viewLeader.id).length} />
              <ModalData label="Employees" value={selectedLeaderEmployees.length} />
            </ModalGrid>
            {selectedLeaderTeams.length > 0 && (
              <div>
                <p className="text-xs font-black text-[#2a465a] uppercase tracking-widest mb-2">Teams</p>
                {selectedLeaderTeams.map((t) => (
                  <div key={t.id} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg mb-1 border border-slate-100">
                    <span className="text-sm font-semibold text-slate-800">{t.name}</span>
                    <span className="text-xs text-slate-400">{(t.members || []).length} members</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("mm-tl-view")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── View Team Modal ────────────────────────────────────────────────── */}
      <Modal id="mm-team-view" title="Team Details" size="xl">
        {selected && (
          <div className="flex flex-col gap-4">
            <ModalProfile name={selected.name} subtitle={`Led by ${selected.leader?.name || "—"}`}
              meta={`${(selected.members || []).length} members · ${selected.isActive ? "Active" : "Inactive"}`} />
            <ModalGrid title="Leader" cols={3}>
              <ModalData label="Name"   value={selected.leader?.name   || "—"} />
              <ModalData label="Email"  value={selected.leader?.email  || "—"} />
              <ModalData label="Mobile" value={selected.leader?.mobile || "—"} />
            </ModalGrid>
            {(selected.members || []).length > 0 && (
              <DataTable
                title="Members"
                columns={[
                  { key: "name",     label: "Name" },
                  { key: "email",    label: "Email" },
                  { key: "mobile",   label: "Mobile" },
                  { key: "isActive", label: "Status",
                    render: (v) => statusBadge(v ? "Active" : "Inactive") },
                ]}
                rows={selected.members}
                pageSize={10}
                searchable={false}
              />
            )}
            <div className="flex gap-3 justify-end pt-2">
              <Button text="Close"      variant="ghost"   size={3} onClick={() => closeModal("mm-team-view")} />
              <Button text="Edit Team"  variant="primary" size={3} onClick={() => { closeModal("mm-team-view"); openEdit(selected); }} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
