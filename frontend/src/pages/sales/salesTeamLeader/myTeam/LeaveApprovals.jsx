import { leaveRequests } from "./teamStore";

export default function LeaveApprovals() {
  return (
    <div>
      <h3>Leave Approvals</h3>

      <table border="1">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {leaveRequests.map((l) => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td>{l.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}