"use client";

import { useCallback, useEffect, useState } from "react";
import { ELECTION_ABI, getPublicClient } from "@/lib/contracts";
import { envChainConfig } from "@/lib/chain-config";

interface CandidateView {
  name: string;
  tagline: string;
  voteCount: bigint;
  active: boolean;
}

export default function Results({ params }: { params: { address: string } }) {
  const addr = params.address as `0x${string}`;
  const [title, setTitle] = useState("");
  const [state, setState] = useState(0);
  const [total, setTotal] = useState<bigint>(0n);
  const [cands, setCands] = useState<CandidateView[]>([]);
  const [err, setErr] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const load = useCallback(async () => {
    try {
      const cfg = envChainConfig();
      const pc = getPublicClient(cfg.rpcUrl, cfg.chainId);
      const [t, stats, c] = await Promise.all([
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "title" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "getStats" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "getCandidates" }),
      ]);
      setTitle(t as string);
      const [st, tv] = stats as unknown as [number, bigint, bigint, bigint, bigint];
      setState(st);
      setTotal(tv as bigint);
      setCands(c as unknown as CandidateView[]);
      setUpdatedAt(new Date().toLocaleTimeString());
      setErr("");
    } catch {
      setErr("Could not reach the chain. Public results need the site's default RPC configured.");
    }
  }, [addr]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  const totalNum = Number(total);
  const sorted = [...cands.map((c, i) => ({ ...c, id: i + 1 }))].sort((a, b) => Number(b.voteCount - a.voteCount));
  const leader = sorted[0];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-center font-mono text-xs text-gray-500">{addr}</p>
      <h1 className="mt-1 text-center text-3xl font-extrabold text-white">{title || "Results"}</h1>
      <p className="mt-1 text-center text-xs text-gray-500">
        {state === 1 ? "🔴 Live — updates every 15s" : state === 2 ? "🏁 Final results" : ""}
        {updatedAt && ` · updated ${updatedAt}`}
      </p>
      {err ? (
        <div className="card mt-6 text-center text-sm text-red-300">{err}</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Total votes</div><div className="text-2xl font-extrabold text-white">{totalNum}</div></div>
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Leading</div><div className="truncate text-2xl font-extrabold text-white">{leader && totalNum > 0 ? leader.name : "—"}</div></div>
          </div>
          <div className="card mt-4">
            {sorted.filter((c) => c.active).map((c) => {
              const pct = totalNum === 0 ? 0 : (Number(c.voteCount) / totalNum) * 100;
              return (
                <div key={c.id} className="mb-4 last:mb-0">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-white">{c.name} {c.id === leader?.id && totalNum > 0 && <span title="Leader">👑</span>}</span>
                    <span className="font-mono text-emerald-300">{c.voteCount.toString()} · {pct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {totalNum === 0 && <p className="text-center text-sm text-gray-500">No votes yet — be the first.</p>}
          </div>
          {state === 1 && (
            <div className="mt-4 text-center">
              <a href={`/vote/${addr}`} className="btn-primary">Vote in this election →</a>
            </div>
          )}
        </>
      )}
    </main>
  );
}
