import React, { useState } from 'react';
import { Filter, ChevronDown, Play, CheckCircle2, XCircle, CheckSquare, CalendarDays, Gift, Bell } from 'lucide-react';

export default function HRMDashboard() {
  const [clockStatus, setClockStatus] = useState('---');
  const [clockTime, setClockTime] = useState(null);

  const handleClockIn = () => {
    setClockStatus('Clocked In');
    setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  return (
    <div className="w-full h-full flex flex-col font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HRM Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage employee attendance, leaves, and time tracking.</p>
        </div>
        <div className="flex items-center gap-5">
          <button className="flex items-center gap-2 text-gray-600 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button className="flex items-center gap-2 text-gray-600 text-sm font-medium">
            Department <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Status Card */}
        <div className="bg-white rounded-xl border border-gray-300 p-5 flex flex-col items-center relative">
          <div className="absolute left-0 top-5 bottom-5 w-1 bg-[#355872] rounded-r-md"></div>

          <h3 className="text-gray-500 text-sm mb-3">Current Status</h3>

          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{clockStatus}</h2>
            {clockTime && <p className="text-sm text-[#355872] mt-1">at {clockTime}</p>}
          </div>

          <p className="text-xs text-gray-400 mb-4">Daily Working Hours</p>

          <button
            onClick={handleClockIn}
            className="w-full max-w-xs bg-[#355872] text-white flex items-center justify-center gap-2 py-3 rounded-lg"
          >
            <Play className="w-4 h-4 fill-white" /> Clock In
          </button>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-xl border border-gray-300 p-5">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-5">
            <ClockIcon className="w-4 h-4 text-[#355872]" /> Recent Logs
          </h3>

          <div className="space-y-5">

            <div className="flex justify-between">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Clock In</p>
                  <p className="text-xs text-gray-400">Today</p>
                </div>
              </div>
              <span className="text-sm">09:02 AM</span>
            </div>

            <div className="flex justify-between">
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium">Clock Out</p>
                  <p className="text-xs text-gray-400">Yesterday</p>
                </div>
              </div>
              <span className="text-sm">05:35 PM</span>
            </div>

            <div className="flex justify-between">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Clock In</p>
                  <p className="text-xs text-gray-400">Yesterday</p>
                </div>
              </div>
              <span className="text-sm">08:55 AM</span>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Attendance */}
        <div className="bg-white rounded-xl border border-gray-300 p-5">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-5">
            <CheckSquare className="w-4 h-4 text-[#355872]" /> Daily Attendance
          </h3>

          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-3">Alice Smith</td>
                <td className="text-green-500 text-xs">Present</td>
                <td className="text-right text-xs">09:00 AM - 05:30 PM</td>
              </tr>
              <tr>
                <td className="py-3">Bob Johnson</td>
                <td className="text-green-500 text-xs">Present</td>
                <td className="text-right text-xs">08:45 AM - 05:00 PM</td>
              </tr>
              <tr>
                <td className="py-3">Charlie Brown</td>
                <td className="text-red-400 text-xs">Absent</td>
                <td className="text-right text-xs">-</td>
              </tr>
              <tr>
                <td className="py-3">David Clark</td>
                <td className="text-green-500 text-xs">Present</td>
                <td className="text-right text-xs">09:15 AM - 06:00 PM</td>
              </tr>
              <tr>
                <td className="py-3">Emma Wilson</td>
                <td className="text-amber-500 text-xs">Half Day</td>
                <td className="text-right text-xs">09:00 AM - 01:00 PM</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Leave Requests */}
        <div className="bg-white rounded-xl border border-gray-300 p-5">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-5">
            <CalendarDays className="w-4 h-4 text-[#355872]" /> Leave Requests
          </h3>

          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-3">Eve Davis</td>
                <td className="text-xs text-gray-400">26 Oct - 27 Oct</td>
                <td className="text-right text-green-500 text-xs">Approved</td>
              </tr>
              <tr>
                <td className="py-3">Frank Miller</td>
                <td className="text-xs text-gray-400">1 Nov - 5 Nov</td>
                <td className="text-right text-amber-500 text-xs">Pending</td>
              </tr>
              <tr>
                <td className="py-3">Grace Lee</td>
                <td className="text-xs text-gray-400">Dec - Mar</td>
                <td className="text-right text-green-500 text-xs">Approved</td>
              </tr>
              <tr>
                <td className="py-3">Henry Moore</td>
                <td className="text-xs text-gray-400">15 Nov - 16 Nov</td>
                <td className="text-right text-amber-500 text-xs">Pending</td>
              </tr>
              <tr>
                <td className="py-3">Isabella Taylor</td>
                <td className="text-xs text-gray-400">10 Dec - 20 Dec</td>
                <td className="text-right text-red-500 text-xs">Rejected</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

function ClockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );
}