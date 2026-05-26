import React from "react";
import { Link } from "react-router-dom";

export default function Packet3QuickPanel() {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">

      {/* Deadlines */}
      <Link to="/management-employee/deadlines">
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition cursor-pointer">
          <h3 className="font-semibold text-gray-800">Deadlines</h3>
          <p className="text-sm text-gray-500 mt-1">
            Track all project deadlines
          </p>
          <div className="mt-3 text-xs text-red-500 font-medium">
            3 Overdue Tasks
          </div>
        </div>
      </Link>

      {/* Reminders */}
      <Link to="/management-employee/reminders">
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition cursor-pointer">
          <h3 className="font-semibold text-gray-800">Reminders</h3>
          <p className="text-sm text-gray-500 mt-1">
            Daily task notifications
          </p>
          <div className="mt-3 text-xs text-yellow-600 font-medium">
            5 Pending Alerts
          </div>
        </div>
      </Link>

      {/* Performance */}
      <Link to="/management-employee/performance">
        <div className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition cursor-pointer">
          <h3 className="font-semibold text-gray-800">Performance</h3>
          <p className="text-sm text-gray-500 mt-1">
            Analytics & progress tracking
          </p>
          <div className="mt-3 text-xs text-green-600 font-medium">
            +76% Avg Score
          </div>
        </div>
      </Link>

    </div>
  );
}