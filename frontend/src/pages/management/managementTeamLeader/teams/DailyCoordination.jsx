import React, { useState } from "react";
import {
  Grid,
  Heading,
  DataField,
  Button,
  UserChat,
  EnhancedDashCard,
} from "../../../../components/shared/Common_Components";
import { MessageSquare, Users, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { useProjectsStore, getAvatarColor, getInitials } from "../projects/projectsStore";

const CURRENT_USER = "Management Team Leader";

export default function DailyCoordination() {
  const { members, activityLog, coordinationComments, addCoordinationComment } = useProjectsStore();
  const [messages, setMessages] = useState(coordinationComments);
  const [announcement, setAnnouncement] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Stats derived from activity log
  const today = new Date().toISOString().slice(0, 10);
  const todayActivity = activityLog.filter((a) =>
    a.timestamp.startsWith(today)
  );
  const activeCount = members.filter((m) => m.status === "Active").length;
  const delayCount = activityLog.filter((a) => a.type === "delay").length;
  const completedToday = activityLog.filter(
    (a) => a.type === "completed" && a.timestamp.startsWith(today.slice(0, 7))
  ).length;

  const handleSend = (msg) => {
    addCoordinationComment(msg);
    setMessages([...coordinationComments, { id: Date.now(), ...msg }]);
  };

  const toggleMember = (name) => {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const selectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((m) => m.name));
    }
  };

  const handleBroadcast = () => {
    if (!announcement.trim()) return;
    const targets = selectedMembers.length > 0 ? selectedMembers : [];
    let text;
    if (targets.length === 0 || targets.length === members.length) {
      text = `📢 Team Announcement: ${announcement}`;
    } else if (targets.length === 1) {
      text = `📢 @${targets[0]}: ${announcement}`;
    } else {
      text = `📢 @${targets.join(", @")}: ${announcement}`;
    }
    const msg = {
      sender: CURRENT_USER,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      text,
    };
    handleSend(msg);
    setAnnouncement("");
    setSelectedMembers([]);
  };

  const allSelected = selectedMembers.length === members.length;

  return (
    <Grid cols={12} gap={4}>
      {/* Stats Row — EnhancedDashCard */}
      <EnhancedDashCard title="Active Members" value={String(activeCount)} icon={<Users size={20} />} accentColor="#3b82f6" size={3} />
      <EnhancedDashCard title="Today's Updates" value={String(todayActivity.length)} icon={<MessageSquare size={20} />} accentColor="#6366f1" size={3} />
      <EnhancedDashCard title="Completed (Month)" value={String(completedToday)} icon={<CheckCircle2 size={20} />} accentColor="#22c55e" size={3} />
      <EnhancedDashCard title="Active Delays" value={String(delayCount)} icon={<AlertTriangle size={20} />} accentColor="#ef4444" size={3} />

      {/* Send Announcement — Multi-select members + fixed alignment */}
      <div className="col-span-12 bg-[#efefefb1] rounded-2xl p-5">
        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
          Send Announcement / Instruction
        </p>

        {/* Member selection — checkboxes */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Select Recipients
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Select All */}
            <button
              onClick={selectAll}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                allSelected
                  ? "bg-[#2a465a] text-white border-[#2a465a] shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:border-[#2a465a] hover:text-[#2a465a]"
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                allSelected ? "bg-white border-white" : "border-slate-300"
              }`}>
                {allSelected && <CheckCircle2 size={12} className="text-[#2a465a]" />}
              </div>
              Entire Team
            </button>

            {/* Individual members */}
            {members.map((m) => {
              const isSelected = selectedMembers.includes(m.name);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-[#2a465a] text-white border-[#2a465a] shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#2a465a] hover:text-[#2a465a]"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px] font-black flex-shrink-0"
                    style={{ background: isSelected ? "rgba(255,255,255,0.3)" : getAvatarColor(m.name) }}
                  >
                    {getInitials(m.name)}
                  </div>
                  {m.name}
                  {isSelected && <CheckCircle2 size={12} className="ml-0.5" />}
                </button>
              );
            })}
          </div>
          {selectedMembers.length > 0 && selectedMembers.length < members.length && (
            <p className="text-[10px] text-slate-400 mt-1.5">
              {selectedMembers.length} member{selectedMembers.length > 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        {/* Message + Send button — fixed alignment */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <DataField
              label="Announcement / Instruction"
              id="coord-msg"
              placeholder="e.g. Please submit EOD reports by 6 PM..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
            />
          </div>
          <button
            onClick={handleBroadcast}
            disabled={!announcement.trim()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              announcement.trim()
                ? "bg-[#2a465a] text-white shadow-md hover:shadow-lg hover:bg-[#1e3448]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            style={{ marginBottom: "1px" }}
          >
            <Send size={15} />
            Send
          </button>
        </div>
      </div>

      {/* Team Chat / Coordination Board */}
      <div className="col-span-12 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm font-black text-[#2a465a] mb-1">
          Team Coordination Board
        </p>
        <p className="text-xs text-slate-400 mb-4">
          Daily standup, updates, and instructions
        </p>
        <UserChat
          messages={messages}
          onSend={handleSend}
          currentUser={CURRENT_USER}
          placeholder="Type a message or instruction… (Enter to send)"
          maxHeight="max-h-96"
          showAttach={true}
        />
      </div>

      {/* Today's Activity Summary */}
      <div className="col-span-12 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm font-black text-[#2a465a] mb-4">
          Today's Activity Summary
        </p>
        {activityLog.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No activity recorded today.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {activityLog.map((log) => {
              const typeConfig = {
                progress:  { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-100",   dot: "bg-blue-500"   },
                delay:     { bg: "bg-rose-50",    text: "text-rose-700",   border: "border-rose-100",   dot: "bg-rose-500"   },
                completed: { bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-100",dot: "bg-emerald-500"},
                update:    { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-100",  dot: "bg-amber-500"  },
              };
              const cfg = typeConfig[log.type] || typeConfig.update;
              const initials = log.member.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              const avatarColor = getAvatarColor(log.member);

              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: avatarColor }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#2a465a]">{log.member}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{log.detail}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">📁 {log.project}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Grid>
  );
}
