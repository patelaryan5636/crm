import { teamExecutives } from "./teamStore";

export default function TeamMembers() {
  return (
    <div>
      <h3>Team Members</h3>

      <table border="1">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Region</th>
          </tr>
        </thead>
        <tbody>
          {teamExecutives.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.status}</td>
              <td>{emp.region}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}