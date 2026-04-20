import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  Layers3,
  Plus,
  Users,
  X,
} from "lucide-react";

const initialReports = [
  {
    id: "RPT-301",
    title: "Monthly Sales Performance",
    type: "Sales",
    department: "Sales",
    period: "Apr 2026",
    status: "Published",
    owner: "Riya Sharma",
    generatedOn: "19 Apr 2026, 09:20 AM",
    summary: "Tracks lead conversion, revenue movement, and follow-up performance across regional sales teams.",
    metrics: [
      { label: "Revenue", value: "Rs 8.4L" },
      { label: "Conversions", value: "124" },
      { label: "Follow-ups", value: "392" },
    ],
  },
  {
    id: "RPT-302",
    title: "Finance Collection Overview",
    type: "Finance",
    department: "Finance",
    period: "Q2 2026",
    status: "Draft",
    owner: "Vikram Nair",
    generatedOn: "18 Apr 2026, 05:10 PM",
    summary: "Shows pending invoices, collection trends, and payment delays across active client accounts.",
    metrics: [
      { label: "Collections", value: "Rs 5.9L" },
      { label: "Pending", value: "Rs 1.3L" },
      { label: "Overdue", value: "17" },
    ],
  },
  {
    id: "RPT-303",
    title: "Management Pipeline Snapshot",
    type: "Executive",
    department: "Mgmt",
    period: "Weekly",
    status: "Scheduled",
    owner: "Ananya Patel",
    generatedOn: "19 Apr 2026, 08:00 AM",
    summary: "High-level summary of team delivery, lead pipeline, project health, and escalation trends.",
    metrics: [
      { label: "Projects", value: "28" },
      { label: "At Risk", value: "4" },
      { label: "Escalations", value: "6" },
    ],
  },
];

const filterConfig = [
  {
    key: "type",
    title: "Report Type",
    icon: Layers3,
    options: ["All", "Sales", "Finance", "Executive"],
  },
  {
    key: "status",
    title: "Status",
    icon: BarChart3,
    options: ["All", "Published", "Draft", "Scheduled"],
  },
  {
    key: "department",
    title: "Department",
    icon: Users,
    options: ["All", "Sales", "Finance", "Mgmt"],
  },
];

const defaultReportForm = {
  title: "",
  type: "Sales",
  department: "Sales",
  period: "Monthly",
  owner: "",
  status: "Draft",
  summary: "",
};

function statusClass(status) {
  if (status === "Published") return "bg-[#e8f4ec] text-[#246247]";
  if (status === "Scheduled") return "bg-[#e6f0f8] text-[#355872]";
  return "bg-[#fff2d7] text-[#9a6a06]";
}

function Report() {
  const [reports, setReports] = useState(initialReports);
  const [filters, setFilters] = useState({
    type: "All",
    status: "All",
    department: "All",
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [form, setForm] = useState(defaultReportForm);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesType = filters.type === "All" || report.type === filters.type;
      const matchesStatus = filters.status === "All" || report.status === filters.status;
      const matchesDepartment =
        filters.department === "All" || report.department === filters.department;

      return matchesType && matchesStatus && matchesDepartment;
    });
  }, [filters, reports]);

  const stats = useMemo(() => {
    const total = reports.length;
    const published = reports.filter((report) => report.status === "Published").length;
    const draft = reports.filter((report) => report.status === "Draft").length;
    const scheduled = reports.filter((report) => report.status === "Scheduled").length;

    return [
      {
        label: "Total Reports",
        value: total,
        helper: "All business reports",
        tone: "from-[#355872] to-[#4d7897] text-white",
      },
      {
        label: "Published",
        value: published,
        helper: "Ready to share",
        tone: "from-[#e4f5ec] to-[#cbe8d8] text-[#1f6b4f]",
      },
      {
        label: "Draft",
        value: draft,
        helper: "Needs review",
        tone: "from-[#fff1de] to-[#ffe2b9] text-[#8a4b08]",
      },
      {
        label: "Scheduled",
        value: scheduled,
        helper: "Auto-generation active",
        tone: "from-[#e6f0f8] to-[#d5e6f3] text-[#355872]",
      },
    ];
  }, [reports]);

  function handleFilterChange(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function openCreateModal() {
    setForm(defaultReportForm);
    setIsCreateOpen(true);
  }

  function handleFormChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleCreateReport(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.owner.trim() || !form.summary.trim()) {
      return;
    }

    const nextReport = {
      id: `RPT-${304 + reports.length}`,
      title: form.title.trim(),
      type: form.type,
      department: form.department,
      period: form.period,
      status: form.status,
      owner: form.owner.trim(),
      generatedOn: new Date().toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      summary: form.summary.trim(),
      metrics: [
        { label: "Primary KPI", value: "Pending" },
        { label: "Coverage", value: "All Teams" },
        { label: "Format", value: "Dashboard" },
      ],
    };

    setReports((current) => [nextReport, ...current]);
    setFilters({
      type: "All",
      status: "All",
      department: "All",
    });
    setActiveReport(nextReport);
    setIsCreateOpen(false);
  }

  return (
    <>
      <div className="space-y-6 text-[#2d3d4a]">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className={`rounded-2xl border border-white/60 bg-gradient-to-br p-5 shadow-sm ${item.tone}`}
            >
              <p className="text-sm font-medium opacity-90">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              <p className="mt-2 text-sm opacity-80">{item.helper}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[24px] border border-[#dfe9ef] bg-white/85 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c77727]">
                Reports Center
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#355872]">
                Filter reports and open the full report preview
              </h2>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#355872] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2d4a60]"
            >
              <Plus size={16} />
              Create Report
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {filterConfig.map((filter) => (
              <div key={filter.key} className="rounded-2xl border border-[#e6edf2] bg-[#fdfefe] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#355872]">
                  <filter.icon size={15} />
                  {filter.title}
                </div>
                <div className="relative">
                  <select
                    value={filters[filter.key]}
                    onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#d5e3eb] bg-[#f5f9fb] px-4 py-3 text-sm font-medium text-[#355872] outline-none transition focus:border-[#7AAACE] focus:bg-white"
                  >
                    {filter.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {filteredReports.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#d6e2ea] bg-[#fafcfd] p-8 text-center text-sm text-slate-500">
                No reports match the selected filters.
              </div>
            ) : (
              filteredReports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-[24px] border border-[#e2ebf1] bg-[linear-gradient(180deg,_#ffffff_0%,_#f9fbfd_100%)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#355872]">{report.id}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(report.status)}`}>
                          {report.status}
                        </span>
                        <span className="rounded-full bg-[#f2f7fa] px-3 py-1 text-xs font-semibold text-[#355872]">
                          {report.type}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{report.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {report.owner} • {report.department} • {report.period}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#f2f7fa] px-3 py-1">
                          <CalendarRange size={14} />
                          {report.generatedOn}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#f2f7fa] px-3 py-1">
                          <FileSpreadsheet size={14} />
                          {report.period}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveReport(report)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#cedee8] bg-white px-4 py-2 text-sm font-semibold text-[#355872] transition hover:bg-[#f3f8fb]"
                      >
                        <Eye size={15} />
                        View Report
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-xl bg-[#355872] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2d4a60]">
                        <Download size={15} />
                        Export
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172532]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[#d9e6ef] bg-white p-6 shadow-[0_30px_80px_rgba(23,37,50,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c77727]">
                  Create Report
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#355872]">
                  Add a new admin report
                </h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full bg-[#f3f7fa] p-2 text-slate-500 transition hover:bg-[#e7eef3]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#355872]">
                  Report Title
                  <input
                    value={form.title}
                    onChange={(event) => handleFormChange("title", event.target.value)}
                    className="w-full rounded-xl border border-[#d5e3eb] bg-[#f8fbfd] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#7AAACE] focus:bg-white"
                    placeholder="Enter report title"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-[#355872]">
                  Owner
                  <input
                    value={form.owner}
                    onChange={(event) => handleFormChange("owner", event.target.value)}
                    className="w-full rounded-xl border border-[#d5e3eb] bg-[#f8fbfd] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#7AAACE] focus:bg-white"
                    placeholder="Enter owner name"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-[#355872]">
                  Report Type
                  <select
                    value={form.type}
                    onChange={(event) => handleFormChange("type", event.target.value)}
                    className="w-full rounded-xl border border-[#d5e3eb] bg-[#f8fbfd] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#7AAACE] focus:bg-white"
                  >
                    <option>Sales</option>
                    <option>Finance</option>
                    <option>Executive</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#355872]">
                  Department
                  <select
                    value={form.department}
                    onChange={(event) => handleFormChange("department", event.target.value)}
                    className="w-full rounded-xl border border-[#d5e3eb] bg-[#f8fbfd] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#7AAACE] focus:bg-white"
                  >
                    <option>Sales</option>
                    <option>Finance</option>
                    <option>Mgmt</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#355872]">
                  Period
                  <select
                    value={form.period}
                    onChange={(event) => handleFormChange("period", event.target.value)}
                    className="w-full rounded-xl border border-[#d5e3eb] bg-[#f8fbfd] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#7AAACE] focus:bg-white"
                  >
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#355872]">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => handleFormChange("status", event.target.value)}
                    className="w-full rounded-xl border border-[#d5e3eb] bg-[#f8fbfd] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#7AAACE] focus:bg-white"
                  >
                    <option>Draft</option>
                    <option>Published</option>
                    <option>Scheduled</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2 text-sm font-medium text-[#355872]">
                Summary
                <textarea
                  value={form.summary}
                  onChange={(event) => handleFormChange("summary", event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-[#d5e3eb] bg-[#f8fbfd] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#7AAACE] focus:bg-white"
                  placeholder="Describe what this report covers"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-[#d5e3eb] px-4 py-2 text-sm font-semibold text-[#355872] transition hover:bg-[#f5f9fb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#355872] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2d4a60]"
                >
                  Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172532]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-[#d9e6ef] bg-white p-6 shadow-[0_30px_80px_rgba(23,37,50,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c77727]">
                  Report Preview
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#355872]">{activeReport.title}</h2>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="rounded-full bg-[#f3f7fa] p-2 text-slate-500 transition hover:bg-[#e7eef3]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(activeReport.status)}`}>
                  {activeReport.status}
                </span>
                <span className="rounded-full bg-[#f2f7fa] px-3 py-1 text-xs font-semibold text-[#355872]">
                  {activeReport.type}
                </span>
                <span className="rounded-full bg-[#f2f7fa] px-3 py-1 text-xs font-semibold text-[#355872]">
                  {activeReport.department}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {activeReport.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl bg-[#f5f9fb] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-800">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#f5f9fb] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Owner</p>
                  <p className="mt-2 font-semibold text-slate-800">{activeReport.owner}</p>
                </div>
                <div className="rounded-2xl bg-[#f5f9fb] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Generated On</p>
                  <p className="mt-2 font-semibold text-slate-800">{activeReport.generatedOn}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e5edf3] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Summary</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{activeReport.summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Report;
