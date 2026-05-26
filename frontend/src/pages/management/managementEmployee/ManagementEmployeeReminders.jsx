import React from "react";

const reminders = [
  {
    id: 1,
    title: "Submit daily status update",
    priority: "High",
    time: "8:00 PM",
    status: "Pending",
  },
  {
    id: 2,
    title: "Client follow-up call",
    priority: "Medium",
    time: "3:00 PM",
    status: "Pending",
  },
  {
    id: 3,
    title: "Update project documentation",
    priority: "Low",
    time: "Tomorrow",
    status: "Completed",
  },
];

export default function ManagementEmployeeReminders() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Reminders
        </h1>
        <p className="text-sm text-gray-500">
          Stay updated with your daily tasks & alerts
        </p>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-xl border shadow-sm">

        {/* TOP BAR */}
        <div className="flex justify-between items-center p-4 border-b">
          <input
            type="text"
            placeholder="Search reminders..."
            className="border px-3 py-1 rounded-lg text-sm w-64"
          />

          <button className="px-3 py-1 text-sm bg-black text-white rounded-lg">
            Add Reminder
          </button>
        </div>

        {/* LIST */}
        <div className="divide-y">

          {reminders.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-4 hover:bg-gray-50"
            >

              {/* LEFT */}
              <div>
                <h3 className="font-medium text-gray-800">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Time: {item.time}
                </p>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-3">

                {/* PRIORITY */}
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    item.priority === "High"
                      ? "bg-red-100 text-red-600"
                      : item.priority === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {item.priority}
                </span>

                {/* STATUS */}
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    item.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.status}
                </span>

              </div>

            </div>
          ))}

        </div>
      </div>
    </div>
  );
}