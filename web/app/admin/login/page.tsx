"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, usingDefaultCredentials } from "@/lib/admin-auth";

export default function AdminLogin() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const ok = await loginAdmin(id, password);
      if (ok) {
        router.replace("/admin");
      } else {
        setError("Wrong admin ID or password.");
      }
    } catch {
      setError("Login failed — this browser may block secure crypto APIs. Try another browser.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="text-center">
        <div className="text-4xl">🔐</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Admin login</h1>
        <p className="mt-2 text-sm text-gray-400">Only the organiser signs in here. Voters never need this page.</p>
      </div>
      {usingDefaultCredentials() && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200">
          Demo credentials are active (<code>admin / admin123</code>). Set{" "}
          <code>NEXT_PUBLIC_ADMIN_ID</code> and <code>NEXT_PUBLIC_ADMIN_PASS</code> in Vercel
          environment variables to change them.
        </p>
      )}
      <form onSubmit={submit} className="card mt-6">
        <label className="text-sm font-semibold text-gray-300">Admin ID</label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="username"
          placeholder="admin"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
        />
        <label className="mt-4 block text-sm font-semibold text-gray-300">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
        />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={busy || !id || !password} className="btn-primary mt-5 w-full disabled:opacity-40">
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-[11px] text-gray-600">
        Demo-grade gate: keeps visitors out of the UI. Real access control is enforced by the
        smart contract owner check.
      </p>
    </main>
  );
}
