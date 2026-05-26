import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ---------------- MOCK DATA ---------------- */

const allData = {
  week: [
    { label: "Mon", score: 65 },
    { label: "Tue", score: 72 },
    { label: "Wed", score: 68 },
    { label: "Thu", score: 80 },
    { label: "Fri", score: 75 },
    { label: "Sat", score: 85 },
    { label: "Sun", score: 78 },
  ],

  month: [
    { label: "Week 1", score: 70 },
    { label: "Week 2", score: 75 },
    { label: "Week 3", score: 80 },
    { label: "Week 4", score: 82 },
  ],

  year: [
    { label: "Jan", score: 60 },
    { label: "Feb", score: 65 },
    { label: "Mar", score: 70 },
    { label: "Apr", score: 75 },
    { label: "May", score: 78 },
    { label: "Jun", score: 80 },
  ],
};

const pieData = [
  { name: "Completed", value: 40 },
  { name: "In Progress", value: 35 },
  { name: "Pending", value: 25 },
];

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

/* ---------------- COMPONENT ---------------- */

export default function ManagementEmployeePerformance() {
  const [filter, setFilter] = useState("week");

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Performance Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Track performance with time filters
          </p>
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex gap-2">
          {["week", "month", "year"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-lg text-sm border transition ${
                filter === type
                  ? "bg-black text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {type === "week"
                ? "This Week"
                : type === "month"
                ? "This Month"
                : "This Year"}
            </button>
          ))}
        </div>
      </div>

      {/* TOP STATS */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Avg Score</p>
          <h2 className="text-xl font-semibold">76%</h2>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Projects Completed</p>
          <h2 className="text-xl font-semibold">12</h2>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Efficiency</p>
          <h2 className="text-xl font-semibold">Good</h2>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* LINE CHART */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-medium text-gray-700 mb-4">
            Performance ({filter})
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={allData[filter]}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#000"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-medium text-gray-700 mb-4">
            Project Status Mix
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={90}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}