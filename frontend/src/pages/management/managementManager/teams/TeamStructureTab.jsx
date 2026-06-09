import { Loader2, Users } from "lucide-react";

const ACCENT = [
  "#2a465a", "#3b82f6", "#8b5cf6", "#14b8a6",
  "#f97316", "#ef4444", "#22c55e", "#f59e0b",
];

export default function TeamStructureTab({ teams, leaders, employees, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
        <Loader2 size={18} className="animate-spin" /> Loading team structure…
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <Users size={40} />
        <p className="text-sm font-semibold">No teams created yet</p>
      </div>
    );
  }

  // Group teams by leader
  const byLeader = {};
  teams.forEach((t) => {
    const lid = t.leader?.id || "unassigned";
    if (!byLeader[lid]) byLeader[lid] = { leader: t.leader, teams: [] };
    byLeader[lid].teams.push(t);
  });

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(byLeader).map(([lid, group], gi) => {
        const accent = ACCENT[gi % ACCENT.length];
        return (
          <div key={lid} className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Leader header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: accent }}>
              <div className="w-9 h-9 rounded-xl bg-white/20 text-white text-sm font-black flex items-center justify-center">
                {group.leader?.name?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-white font-black text-base">{group.leader?.name || "Unassigned"}</p>
                <p className="text-white/70 text-xs">{group.leader?.email || "—"}</p>
              </div>
              <span className="ml-auto text-white/80 text-xs font-semibold">
                {group.teams.length} team{group.teams.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Teams under this leader */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50">
              {group.teams.map((team) => {
                const memberList = team.members || [];
                return (
                  <div key={team.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                      <p className="font-black text-sm text-[#2a465a]">{team.name}</p>
                      <span className="text-xs text-slate-400 font-semibold">{memberList.length} member{memberList.length !== 1 ? "s" : ""}</span>
                    </div>
                    {memberList.length === 0 ? (
                      <p className="text-xs text-slate-400 px-4 py-3">No members assigned</p>
                    ) : (
                      <ul className="divide-y divide-slate-50">
                        {memberList.map((m) => (
                          <li key={m.id} className="flex items-center gap-2 px-4 py-2.5">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                              {m.name?.charAt(0) || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{m.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{m.mobile || m.email || "—"}</p>
                            </div>
                            <span className={`ml-auto shrink-0 w-1.5 h-1.5 rounded-full ${m.isActive ? "bg-emerald-400" : "bg-slate-300"}`} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* All employees summary — shows multi-team memberships */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-slate-800 text-white font-black text-sm">
          Employee Multi-Team Overview
          <span className="ml-2 text-slate-400 font-normal text-xs">— employees can belong to multiple teams</span>
        </div>
        <div className="divide-y divide-slate-100">
          {employees.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-[#2a465a] text-white text-xs font-black flex items-center justify-center shrink-0">
                {e.name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{e.name}</p>
                <p className="text-xs text-slate-400">{e.email || "—"}</p>
              </div>
              <div className="text-right shrink-0">
                {e.teamCount > 0 ? (
                  <>
                    <p className="text-xs font-bold text-[#2a465a]">{e.teamCount} team{e.teamCount !== 1 ? "s" : ""}</p>
                    <p className="text-[10px] text-slate-400 max-w-[160px] text-right truncate">{e.teamNames}</p>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">Not assigned</span>
                )}
              </div>
              <span className={`w-2 h-2 rounded-full shrink-0 ${e.status === "Active" ? "bg-emerald-400" : e.status === "On Leave" ? "bg-amber-400" : "bg-slate-300"}`} />
            </div>
          ))}
          {employees.length === 0 && (
            <p className="px-5 py-4 text-sm text-slate-400">No employees found</p>
          )}
        </div>
      </div>
    </div>
  );
}
