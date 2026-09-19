"use client";

import { useEffect, useState } from "react";
import { ELECTION_ABI, FACTORY_ABI, getPublicClient } from "@/lib/contracts";
import { envChainConfig, isFactorySet } from "@/lib/chain-config";

const STATES = ["Created", "Active", "Ended", "Cancelled"];

interface LiveRow {
  address: `0x${string}`;
  title: string;
  state: number;
  votes: bigint;
}

export function LiveElections() {
  const [rows, setRows] = useState<LiveRow[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cfg = envChainConfig();
        if (!isFactorySet(cfg)) {
          setRows([]);
          return;
        }
        const pc = getPublicClient(cfg.rpcUrl, cfg.chainId);
        const addrs = (await pc.readContract({
          address: cfg.factoryAddress, abi: FACTORY_ABI, functionName: "getElections",
        })) as `0x${string}`[];
        const out: LiveRow[] = await Promise.all(
          addrs.slice(-6).reverse().map(async (a) => {
            const [t, s] = await Promise.all([
              pc.readContract({ address: a, abi: ELECTION_ABI, functionName: "title" }),
              pc.readContract({ address: a, abi: ELECTION_ABI, functionName: "getStats" }),
            ]);
            const [st, tv] = s as unknown as [number, bigint, bigint, bigint, bigint];
            return { address: a, title: t as string, state: st, votes: tv as bigint };
          })
        );
        setRows(out);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  if (rows === null) {
    return <p className="mt-4 text-center text-sm text-gray-500">Checking for live elections…</p>;
  }
  const visible = rows.filter((r) => r.state === 1 || r.state === 2);
  if (visible.length === 0) return null;

  return (
    <section className="mx-auto mt-4 max-w-3xl">
      <h2 className="text-center text-xl font-bold text-white">
        <span className="mr-2 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
        Live now — open for voting
      </h2>
      <div className="mt-4 grid gap-3">
        {visible.map((r) => (
          <div key={r.address} className="card flex flex-wrap items-center gap-3 !p-4">
            <div className="flex-1">
              <div className="font-bold text-white">{r.title}</div>
              <div className="text-xs text-gray-500">
                {STATES[r.state]} · {r.votes.toString()} votes so far
              </div>
            </div>
            {r.state === 1 && (
              <a href={`/vote/${r.address}`} className="btn-primary !px-4 !py-2 text-sm">Vote →</a>
            )}
            <a href={`/results/${r.address}`} className="btn-ghost !px-4 !py-2 text-sm">Results</a>
          </div>
        ))}
      </div>
    </section>
  );
}
