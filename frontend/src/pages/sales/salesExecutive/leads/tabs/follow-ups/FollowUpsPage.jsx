import FollowUps from "../../../../salesManager/leads/FollowUps";
import dummyFollowUps from "./data/DummyFollowUps";

const statusMap = {
  Upcoming: "pending",
  Missed: "overdue",
  Completed: "done",
};

const executiveFollowUps = dummyFollowUps.map((item) => ({
  id: `SE-${item.id}`,
  leadName: item.leadName,
  date: item.date,
  time: item.time,
  type: item.type || "Call",
  status: statusMap[item.status] || "pending",
  notes: item.title ? `${item.title} - ${item.notes}` : item.notes,
  assignedExec: "You",
  priority: item.priority,
}));

export default function FollowUpsPage() {
  return <FollowUps initialFollowups={executiveFollowUps} modalPrefix="se" />;
}
