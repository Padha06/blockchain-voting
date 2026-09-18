"use client";

const KPIS = [
  ["Total votes", "0"],
  ["Turnout", "0%"],
  ["Registered", "0"],
  ["Time left", "—"],
];

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map(([label, value]) => (
          <div key={label} className="kpi">
            <div className="text-xs uppercase tracking-wider text-gray-400">{label}</div>
            <div className="mt-1 text-2xl font-extrabold text-white">{value}</div>
          </div>
        ))}
      </div>
      <div className="card mt-4 text-center text-sm text-gray-400">
        Live charts (distribution · share · votes-over-time · department splits) wire to VoteCast events in the next update.
      </div>
    </main>
  );
}
