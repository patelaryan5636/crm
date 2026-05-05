import React, { useState, useMemo } from "react";
import {
  Users,
  PhoneCall,
  TrendingUp,
  DollarSign,
  Clock,
  Trash2,
  Plus,
  Upload,
  Ticket,
  UserPlus,
  Bell,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  DashCard,
  EnhancedDashCard,
  DataTable,
  Heading,
  Grid,
  DashGrid,
  GLineChart,
  GBarChart,
  GDoughnutChart,
  Button,
} from "../../../components/shared/Common_Components";

const SalesExecutiveDashboard = () => {
  const [greeting] = useState("Good Morning, Alex!");

  // Dummy Data for Charts
  const weeklySalesData = [
    { name: "Mon", leads: 45, closed: 12 },
    { name: "Tue", leads: 52, closed: 15 },
    { name: "Wed", leads: 48, closed: 18 },
    { name: "Thu", leads: 61, closed: 22 },
    { name: "Fri", leads: 55, closed: 20 },
    { name: "Sat", leads: 32, closed: 8 },
    { name: "Sun", leads: 25, closed: 5 },
  ];

  const callConversionData = [
    { name: "Week 1", calls: 120, conversions: 25 },
    { name: "Week 2", calls: 150, conversions: 32 },
    { name: "Week 3", calls: 110, conversions: 28 },
    { name: "Week 4", calls: 180, conversions: 45 },
  ];

  const leadStatusData = [
    { name: "New", value: 40 },
    { name: "Contacted", value: 30 },
    { name: "Qualified", value: 20 },
    { name: "Closed", value: 10 },
  ];

  // Dummy Data for Table
  const recentActivities = [
    {
      id: 1,
      leadName: "John Doe",
      status: "Hot",
      executive: "Alex Johnson",
      lastFollowUp: "2024-05-01",
      nextReminder: "2024-05-04",
      priority: "High",
    },
    {
      id: 2,
      leadName: "Jane Smith",
      status: "Warm",
      executive: "Alex Johnson",
      lastFollowUp: "2024-05-02",
      nextReminder: "2024-05-05",
      priority: "Medium",
    },
    {
      id: 3,
      leadName: "Robert Brown",
      status: "Cold",
      executive: "Alex Johnson",
      lastFollowUp: "2024-04-30",
      nextReminder: "2024-05-06",
      priority: "Low",
    },
    {
      id: 4,
      leadName: "Emily Davis",
      status: "Interested",
      executive: "Alex Johnson",
      lastFollowUp: "2024-05-03",
      nextReminder: "2024-05-03",
      priority: "High",
    },
  ];

  const columns = [
    { key: "leadName", label: "Lead Name" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.status === "Hot"
            ? "bg-rose-100 text-rose-600"
            : row.status === "Warm"
              ? "bg-orange-100 text-orange-600"
              : "bg-blue-100 text-blue-600"
            }`}
        >
          {row.status}
        </span>
      ),
    },
    { key: "executive", label: "Executive" },
    { key: "lastFollowUp", label: "Last Follow-up" },
    { key: "nextReminder", label: "Next Reminder" },
    {
      key: "priority",
      label: "Priority",
      render: (row) => (
        <span
          className={`font-bold ${row.priority === "High"
            ? "text-rose-500"
            : row.priority === "Medium"
              ? "text-orange-500"
              : "text-blue-500"
            }`}
        >
          {row.priority}
        </span>
      ),
    },
  ];

  return (
    <div className="p-1 space-y-8 animate-in fade-in duration-700">
      {/* GREETING & NOTIFICATION AREA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a465a] tracking-tight">
            {greeting}
          </h1>
          <p className="text-slate-500 font-medium">
            Here's what's happening with your sales pipeline today.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative p-2 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <Bell size={20} className="text-[#2a465a]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="h-8 w-px bg-slate-100"></div>
          <div className="flex items-center gap-2 pr-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#2a465a] to-[#4b7a9a] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              AJ
            </div>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <DashGrid cols={12} gap={4}>
        <DashCard
          title="Total Leads"
          value="1,284"
          icon={<Users />}
          accentColor="#3b82f6"
          size={4}
        />
        <DashCard
          title="Today Calls"
          value="42"
          icon={<PhoneCall />}
          accentColor="#8b5cf6"
          size={4}
        />
        <DashCard
          title="Conversion Rate"
          value="18.5%"
          icon={<TrendingUp />}
          accentColor="#10b981"
          size={4}
        />
        <DashCard
          title="Revenue Generated"
          value="$124,500"
          icon={<DollarSign />}
          accentColor="#f59e0b"
          size={4}
        />
        <DashCard
          title="Pending Follow-ups"
          value="12"
          icon={<Clock />}
          accentColor="#ef4444"
          size={4}
        />
        <DashCard
          title="Dump Leads"
          value="342"
          icon={<Trash2 />}
          accentColor="#64748b"
          size={4}
        />
      </DashGrid>

      {/* CHARTS & WIDGETS SECTION */}
      <Grid cols={12} gap={6}>
        {/* Weekly Sales Trend */}
        <div className="col-span-12 lg:col-span-8">
          <GLineChart
            title="Weekly Sales Trend"
            subtitle="Comparison of Leads vs Closed Deals"
            data={weeklySalesData}
            lines={[
              { key: "leads", label: "New Leads", color: "#3b82f6" },
              { key: "closed", label: "Closed Deals", color: "#10b981" },
            ]}
            size={12}
            height={320}
          />
        </div>

        {/* Today's Target Progress */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#2a465a]/5 rounded-full blur-3xl group-hover:bg-[#2a465a]/10 transition-colors duration-500"></div>
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#2a465a]">Daily Target</h3>
                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                  85% Done
                </span>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                    <span>Calls Made</span>
                    <span>36/40</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "90%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                    <span>Leads Closed</span>
                    <span>4/5</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                    <span>Follow-ups</span>
                    <span>12/15</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-8 w-full py-3 bg-[#2a465a] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1e3a52] transition-colors shadow-lg shadow-[#2a465a]/20">
              View Full Report <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="col-span-12 lg:col-span-4">
          <GDoughnutChart
            title="Lead Status Distribution"
            subtitle="By Current Pipeline Stage"
            data={leadStatusData}
            colors={["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"]}
            size={12}
            height={300}
          />
        </div>

        {/* Calls vs Conversion */}
        <div className="col-span-12 lg:col-span-8">
          <GBarChart
            title="Calls vs Conversion"
            subtitle="Weekly performance breakdown"
            data={callConversionData}
            bars={[
              { key: "calls", label: "Total Calls", color: "#64748b" },
              { key: "conversions", label: "Conversions", color: "#3b82f6" },
            ]}
            size={12}
            height={300}
          />
        </div>
      </Grid>

      {/* Recent Activity Table (Full Row) */}
      <div className="col-span-12">
        <DataTable
          title="Recent Pipeline Activity"
          columns={columns}
          rows={recentActivities}
          pageSize={5}
          searchable={true}
        />
      </div>

      {/* Quick Actions & Upcoming Reminders (Shared Row) */}
      <Grid cols={12} gap={6}>
        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full">
            <h3 className="text-lg font-bold text-[#2a465a] mb-5 flex items-center gap-2">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 text-[#2a465a] font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 group">
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Plus size={18} />
                </div>
                Add Lead
              </button>
              <button className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 text-[#2a465a] font-bold text-sm hover:bg-purple-50 hover:text-purple-600 transition-all border border-transparent hover:border-purple-100 group">
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Upload size={18} />
                </div>
                Upload CSV
              </button>
              <button className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 text-[#2a465a] font-bold text-sm hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 group">
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Ticket size={18} />
                </div>
                Create Ticket
              </button>
              <button className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 text-[#2a465a] font-bold text-sm hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100 group">
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <UserPlus size={18} />
                </div>
                Assign Leads
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Reminders Widget */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-[#2a465a] rounded-3xl p-6 shadow-xl shadow-[#2a465a]/20 text-white relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calendar size={80} />
            </div>
            <h3 className="text-lg font-bold mb-4 relative z-10">Upcoming Reminders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              <div className="flex gap-3 items-start border-l-2 border-emerald-400 pl-3">
                <div>
                  <p className="text-sm font-bold">Follow up with John</p>
                  <p className="text-xs text-slate-300">Today, 2:30 PM</p>
                </div>
              </div>
              <div className="flex gap-3 items-start border-l-2 border-amber-400 pl-3">
                <div>
                  <p className="text-sm font-bold">Proposal Review - Globex</p>
                  <p className="text-xs text-slate-300">Tomorrow, 10:00 AM</p>
                </div>
              </div>
              <div className="flex gap-3 items-start border-l-2 border-blue-400 pl-3">
                <div>
                  <p className="text-sm font-bold">Team Sync Meeting</p>
                  <p className="text-xs text-slate-300">May 5, 11:30 AM</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors">
                  View All Reminders
                </button>
              </div>
            </div>
          </div>
        </div>
      </Grid>

    </div>
  );
};

export default SalesExecutiveDashboard;