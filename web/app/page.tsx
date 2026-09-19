const FEATURES = [
  { icon: "🔒", title: "Tamper-evident votes", text: "Every vote is an on-chain transaction with a hash you can verify on the explorer." },
  { icon: "📋", title: "Excel voter roll", text: "Upload the class spreadsheet, preview errors, publish one Merkle root." },
  { icon: "⛽", title: "Zero gas for students", text: "College app-chain runs at gasPrice 0. No wallets to fund, no faucets." },
  { icon: "📊", title: "Live dashboard", text: "Turnout gauge, vote charts, department splits — updating vote by vote." },
  { icon: "🧾", title: "Voter receipts", text: "Each voter keeps a tx hash receipt and can re-verify it any time." },
  { icon: "🏫", title: "Reusable anywhere", text: "One factory spawns isolated elections for clubs, colleges, societies." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      <section className="py-16 text-center sm:py-24">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          College Election 2026 · running on zero-gas app-chain
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Voting you can{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-300 bg-clip-text text-transparent">
            actually verify
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-400">
          The organiser publishes one Merkle root. Students vote free from their phones.
          Anyone can audit the count — no trust required.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/admin/new" className="btn-primary">Create an election</a>
          <a href="/verify" className="btn-ghost">Verify a receipt</a>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          New here? <a href="/guide" className="font-semibold text-indigo-300 hover:text-indigo-200">Take the 5-minute guided demo →</a>
        </p>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3">
          {[
            ["4–5k", "voters per election"],
            ["~2s", "block time"],
            ["₹0", "gas per vote"],
          ].map(([n, l]) => (
            <div key={l} className="kpi">
              <div className="text-2xl font-extrabold text-white">{n}</div>
              <div className="text-xs text-gray-400">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card transition hover:border-indigo-400/40">
            <div className="text-2xl">{f.icon}</div>
            <h3 className="mt-3 font-bold text-white">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="card mb-16 flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-white">How a vote flows</h2>
        <ol className="flex max-w-3xl flex-col gap-2 text-sm text-gray-300 sm:flex-row sm:gap-4">
          {["Admin uploads roll → Merkle root on-chain", "Student enters roll no → proof found locally", "One tap → free tx → receipt with hash"].map((s, i) => (
            <li key={s} className="flex-1 rounded-xl border border-white/10 bg-black/30 p-3">
              <span className="font-bold text-indigo-300">{i + 1}.</span> {s}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
