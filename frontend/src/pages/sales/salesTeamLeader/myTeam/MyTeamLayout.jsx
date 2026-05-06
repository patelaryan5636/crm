import { Outlet, Link } from "react-router-dom";

export default function MyTeamLayout() {
  return (
    <div>
      <h2>My Team (Team Leader)</h2>

      <nav style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <Link to="">Team</Link>
        <Link to="attendance">Attendance</Link>
        <Link to="leave-approvals">Leaves</Link>
      </nav>

      <Outlet />
    </div>
  );
}