import { attendanceRecords } from "./teamStore";

export default function Attendance() {
  return (
    <div>
      <h3>Attendance</h3>

      <table border="1">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceRecords.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}