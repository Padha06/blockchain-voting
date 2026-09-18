"use client";

const TABS: [string, string][] = [
  ["Manage", ""],
  ["Candidates", "/candidates"],
  ["Voters", "/voters"],
  ["Dashboard", "/dashboard"],
];

export default function Manage({ params }: { params: { address: string } }) {
  const base = `/admin/${params.address}`;
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="font-mono text-xs text-gray-500">{params.address}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Manage election</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map(([label, suffix]) => (
          <a key={label} href={`${base}${suffix}`} className="btn-ghost !px-4 !py-2 text-sm">
            {label}
          </a>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="kpi">
          <div className="text-xs uppercase tracking-wider text-gray-400">State</div>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-300" /> Created
          </div>
        </div>
        <div className="kpi">
          <div className="text-xs uppercase tracking-wider text-gray-400">Merkle root</div>
          <div className="mt-1 font-mono text-sm text-gray-300">not published yet</div>
        </div>
        <div className="kpi">
          <div className="text-xs uppercase tracking-wider text-gray-400">Controls</div>
          <div className="mt-2 flex gap-2">
            <button className="btn-primary !px-4 !py-1.5 text-sm">Start</button>
            <button className="btn-ghost !px-4 !py-1.5 text-sm">End</button>
          </div>
        </div>
      </div>
    </main>
  );
}
