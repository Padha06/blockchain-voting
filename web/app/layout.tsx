import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlockVote — Zero-Gas College Voting",
  description: "Votes on-chain, eligibility via Merkle root, identities off-chain.",
};

function Navbar() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <a href="/" className="flex items-center gap-2 font-bold tracking-tight">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 text-lg">🗳️</span>
        BlockVote
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
          zero gas
        </span>
      </a>
      <nav className="flex items-center gap-1">
        <a className="nav-link" href="/admin">Admin</a>
        <a className="nav-link" href="/verify">Verify</a>
        <a className="btn-primary ml-2 !px-4 !py-2 text-sm" href="/admin/new">New election</a>
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <Navbar />
        {children}
        <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-gray-500">
          Votes on-chain · eligibility via Merkle root · identities off-chain · college app-chain (gasPrice 0)
        </footer>
      </body>
    </html>
  );
}
