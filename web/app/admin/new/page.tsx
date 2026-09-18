"use client";

const STEPS = ["Details", "Candidates", "Upload roll", "Preview", "Review & deploy"];

export default function NewElection() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">New election</h1>
      <ol className="mt-6 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              i === 0 ? "border-indigo-400/50 bg-indigo-500/20 text-white" : "border-white/10 text-gray-400"
            }`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <div className="card mt-6">
        <label className="text-sm font-semibold text-gray-300">Election title</label>
        <input
          placeholder="e.g. College Election 2026 — Class Representative"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
        />
        <label className="mt-4 block text-sm font-semibold text-gray-300">Description</label>
        <textarea
          rows={3}
          placeholder="What is this election for? Who can vote?"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
        />
        <div className="mt-6 flex justify-end gap-3">
          <a href="/admin" className="btn-ghost">Cancel</a>
          <button className="btn-primary">Continue →</button>
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Full wizard (candidates → upload → Merkle preview → factory deploy) lands in the next update.
      </p>
    </main>
  );
}
