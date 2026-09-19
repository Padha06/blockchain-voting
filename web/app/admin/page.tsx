"use client";

import { useEffect, useState } from "react";
import { FACTORY_ABI, ELECTION_ABI, getPublicClient } from "@/lib/contracts";
import { envChainConfig, isFactorySet, loadChainConfig } from "@/lib/chain-config";

const STATES = ["Created", "Active", "Ended", "Cancelled"];

interface Row {
  address: `0x${string}`;
  title: string;
  state: number;
  votes: string;
}

export default function AdminList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);

  useEffect(() => {
    (async () => {
      const cfg = await loadChainConfig();
      if (!isFactorySet(cfg)) {
        setUnconfigured(true);
        return;
      }
      const pc = getPublicClient(cfg.rpcUrl, cfg.chainId);
      const addrs = (await pc.readContract({
        address: cfg.factoryAddress, abi: FACTORY_ABI, functionName: "getElections",
      })) as `0x${string}`[];
      const out: Row[] = await Promise.all(
        addrs.map(async (a) => {
          const [t, s] = await Promise.all([
            pc.readContract({ address: a, abi: ELECTION_ABI, functionName: "title" }),
            pc.readContract({ address: a, abi: ELECTION_ABI, functionName: "getStats" }),
          ]);
          const [st, tv] = s as unknown as [number, bigint, bigint, bigint, bigint];
          return { address: a, title: t as string, state: st, votes: (tv as bigint).toString() };
        })
      );
      setRows(out.reverse());
    })().catch(() => setRows([]));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Elections</h1>
          <p className="mt-1 text-sm text-gray-400">Create, start, stop and audit every vote — all from here.</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/settings" className="btn-ghost">⚙️ Chain settings</a>
          <a href="/admin/new" className="btn-primary">+ New election</a>
        </div>
      </div>

      {unconfigured ? (
        <div className="card mt-8 text-center">
          <div className="text-4xl">🔌</div>
          <h2 className="mt-3 font-bold text-white">Connect a chain first</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-400">
            Paste your RPC URL + factory address — one minute, no redeploy.
          </p>
          <a href="/admin/settings" className="btn-primary mt-5">Open chain settings →</a>
        </div>
      ) : rows === null ? (
        <p className="mt-8 text-center text-sm text-gray-500">Loading elections…</p>
      ) : rows.length === 0 ? (
        <div className="card mt-8 text-center">
          <div className="text-4xl">🗳️</div>
          <h2 className="mt-3 font-bold text-white">No elections yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-400">
            Run the creation wizard: details → candidates → spreadsheet upload → preview → deploy.
          </p>
          <a href="/admin/new" className="btn-ghost mt-5">Start the wizard</a>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {rows.map((r) => (
            <a key={r.address} href={`/admin/${r.address}`} className="card flex flex-wrap items-center gap-3 transition hover:border-indigo-400/40">
              <div className="flex-1">
                <div className="font-bold text-white">{r.title}</div>
                <div className="font-mono text-xs text-gray-500">{r.address}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.state === 1 ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-gray-300"}`}>
                {STATES[r.state] ?? "?"} · {r.votes} votes
              </span>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
