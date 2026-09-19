const STEPS = [
  {
    t: "1 · Sign in as admin",
    d: "Open Admin and sign in (demo login: admin / admin123). Voters never need this — only the organiser.",
  },
  {
    t: "2 · Point at the chain (one paste)",
    d: "Open Chain settings and press “Autofill from this laptop”. It detects the demo chain and fills everything except the factory address, which you paste from the person who gave you this project. Press Test connection & save.",
  },
  {
    t: "3 · Create the election",
    d: "New election → give it a title → add at least 2 candidates → upload the voter list. No voter list handy? Download the ready-made sample file below — 20 voters, zero errors.",
  },
  {
    t: "4 · Deploy (three wallet taps)",
    d: "On Review, press Connect wallet & deploy and approve 3 small confirmations in MetaMask. Everything is free — the demo chain charges no gas. You get a census file download; keep it safe.",
  },
  {
    t: "5 · Vote like a student",
    d: "Open the election's vote page on your phone, type any roll number from the sample (e.g. CS20260007), confirm the name, tap a candidate. You get a transaction receipt — paste it in Verify to prove the vote is on-chain.",
  },
];

export default function Guide() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Received this project? Start here.</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white">Your first election in 5 minutes</h1>
      <p className="mt-3 text-gray-400">
        No blockchain knowledge needed. Follow the steps in order — each one tells you exactly
        what to click.
      </p>
      <div className="mt-8 grid gap-4">
        {STEPS.map((s) => (
          <div key={s.t} className="card">
            <h2 className="font-bold text-white">{s.t}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="card mt-4 flex flex-wrap items-center gap-3">
        <div className="text-2xl">📋</div>
        <div className="flex-1">
          <p className="font-semibold text-white">Sample voter list (20 students)</p>
          <p className="text-xs text-gray-500">Upload it as-is in step 3 — it passes validation perfectly.</p>
        </div>
        <a href="/sample-voters-20.xlsx" download className="btn-primary !px-4 !py-2 text-sm">
          Download sample
        </a>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/admin/login" className="btn-primary">Go to admin login →</a>
        <a href="/" className="btn-ghost">← Back home</a>
      </div>
    </main>
  );
}
