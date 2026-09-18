"use client";

export default function Vote({ params }: { params: { address: string } }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-center font-mono text-xs text-gray-500">{params.address}</p>
      <h1 className="mt-1 text-center text-3xl font-extrabold tracking-tight text-white">Cast your vote</h1>
      <p className="mt-2 text-center text-sm text-gray-400">
        Free on the college app-chain — no wallet funds needed. Your vote is irreversible.
      </p>
      <div className="card mt-8">
        <label className="text-sm font-semibold text-gray-300">Step 1 · Find yourself on the roll</label>
        <div className="mt-2 flex gap-2">
          <input
            placeholder="e.g. CS20260042"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 uppercase text-white placeholder:normal-case placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
          />
          <button className="btn-primary shrink-0">Check</button>
        </div>
      </div>
      <div className="card mt-4 opacity-60">
        <div className="text-sm font-semibold text-gray-300">Step 2 · Pick a candidate</div>
        <div className="mt-3 grid gap-2">
          {["Candidate A", "Candidate B"].map((c) => (
            <div key={c} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <span className="font-semibold text-white">{c}</span>
              <button className="btn-ghost !px-4 !py-1.5 text-sm">Vote</button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">Live candidate list + Merkle proof voting wires up once the app-chain is live.</p>
      </div>
    </main>
  );
}
