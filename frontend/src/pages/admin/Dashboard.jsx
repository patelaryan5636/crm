const stats = [
  { title: "Total Users", value: "1,245", color: "text-blue-600" },
  { title: "Leads", value: "320", color: "text-purple-600" },
  { title: "Projects", value: "85", color: "text-orange-600" },
  { title: "Revenue", value: "Rs 2.5L", color: "text-green-600" },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#d9e6ef] bg-[linear-gradient(135deg,_#355872_0%,_#436b88_58%,_#fff8ef_100%)] px-6 py-7 text-white shadow-[0_22px_50px_rgba(53,88,114,0.14)] lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd2a8]">
          Admin Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight lg:text-4xl">
          Business performance across users, leads, projects, and revenue.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90">
          Use this dashboard as the starting point for the CRM admin workspace and jump into each
          module from the sidebar for detailed actions.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm text-gray-500">{item.title}</p>
            <h2 className={`mt-2 text-2xl font-bold ${item.color}`}>{item.value}</h2>
          </div>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-[#dfe9ef] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c77727]">
            Snapshot
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#355872]">Operational highlights</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#f5f9fb] p-4">
              <p className="text-sm font-medium text-slate-800">Sales follow-ups</p>
              <p className="mt-2 text-sm text-slate-500">
                Team follow-ups are running 12% ahead of last week.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f5f9fb] p-4">
              <p className="text-sm font-medium text-slate-800">Project delivery</p>
              <p className="mt-2 text-sm text-slate-500">
                Most active projects remain on track with limited risk signals.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#dfe9ef] bg-[#355872] p-6 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffd2a8]">
            Today
          </p>
          <h2 className="mt-1 text-xl font-semibold">Admin summary</h2>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            The CRM is set up so each major admin module has a visible page output instead of a
            blank-looking placeholder.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
