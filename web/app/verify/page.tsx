"use client";

export default function Verify() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 text-center">
      <div className="text-4xl">🧾</div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Verify a receipt</h1>
      <p className="mt-2 text-sm text-gray-400">Paste the transaction hash from your vote receipt. We show it on the block explorer.</p>
      <div className="card mt-8 flex gap-2 text-left">
        <input
          placeholder="0x…"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
        />
        <button className="btn-primary shrink-0">Verify</button>
      </div>
    </main>
  );
}
