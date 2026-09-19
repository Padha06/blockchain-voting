"use client";

import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, type EIP1193Provider } from "viem";
import {
  chainForConfig,
  ELECTION_ABI,
  getPublicClient,
} from "@/lib/contracts";
import { envChainConfig, loadChainConfig, type ChainConfig } from "@/lib/chain-config";

const STATES = ["Created", "Active", "Ended", "Cancelled"];

interface CandidateView {
  name: string;
  tagline: string;
  imageUrl: string;
  voteCount: bigint;
  active: boolean;
}

function getEthereum(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EIP1193Provider }).ethereum ?? null;
}

export default function Manage({ params }: { params: { address: string } }) {
  const addr = params.address as `0x${string}`;
  const [cfg, setCfg] = useState<ChainConfig>(() => envChainConfig());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");
  const [state, setState] = useState(0);
  const [totalVotes, setTotalVotes] = useState<bigint>(0n);
  const [candidateCount, setCandidateCount] = useState<bigint>(0n);
  const [root, setRoot] = useState("");
  const [censusURI, setCensusURI] = useState("");
  const [candidates, setCandidates] = useState<CandidateView[]>([]);
  const [busy, setBusy] = useState("");
  const [txMsg, setTxMsg] = useState("");

  const refresh = useCallback(async () => {
    try {
      const c = await loadChainConfig();
      setCfg(c);
      const pc = getPublicClient(c.rpcUrl, c.chainId);
      const [t, stats, r, uri, cands] = await Promise.all([
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "title" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "getStats" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "merkleRoot" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "censusURI" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "getCandidates" }),
      ]);
      setTitle(t as string);
      const [s, tv, cc] = stats as unknown as [number, bigint, bigint, bigint, bigint];
      setState(s);
      setTotalVotes(tv);
      setCandidateCount(cc);
      setRoot(r as string);
      setCensusURI(uri as string);
      setCandidates(cands as unknown as CandidateView[]);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load election.");
    } finally {
      setLoading(false);
    }
  }, [addr]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 15000);
    return () => clearInterval(t);
  }, [refresh]);

  async function adminTx(fn: "startElection" | "endElection", label: string) {
    setTxMsg("");
    const ethereum = getEthereum();
    if (!ethereum) {
      setTxMsg("No wallet found — install MetaMask.");
      return;
    }
    setBusy(label);
    try {
      const wallet = createWalletClient({ chain: chainForConfig(cfg), transport: custom(ethereum) });
      const [account] = await wallet.requestAddresses();
      if (!account) throw new Error("Wallet connection rejected.");
      const pc = getPublicClient(cfg.rpcUrl, cfg.chainId);
      const hash = await wallet.writeContract({ address: addr, abi: ELECTION_ABI, functionName: fn, account });
      setTxMsg(`${label} submitted… waiting for confirmation.`);
      await pc.waitForTransactionReceipt({ hash });
      setTxMsg(`${label} confirmed.`);
      await refresh();
    } catch (e) {
      setTxMsg(e instanceof Error ? e.message : `${label} failed.`);
    } finally {
      setBusy("");
    }
  }

  const voteUrl = `/vote/${addr}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="font-mono text-xs text-gray-500">{addr}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{loading ? "Loading…" : title}</h1>
        {!loading && (
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
            state === 1 ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"
          }`}>
            {STATES[state] ?? "?"}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={voteUrl} className="btn-ghost !px-4 !py-2 text-sm">🗳️ Voter page</a>
        <a href={`/admin/${addr}/dashboard`} className="btn-ghost !px-4 !py-2 text-sm">📊 Dashboard</a>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(`${window.location.origin}${voteUrl}`);
            setTxMsg("Vote link copied — share it with voters.");
          }}
          className="btn-ghost !px-4 !py-2 text-sm"
        >
          🔗 Copy vote link
        </button>
      </div>

      {err && <p className="card mt-6 text-sm text-red-300">{err} Check Chain settings.</p>}

      {!loading && !err && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Votes</div><div className="text-2xl font-extrabold text-white">{totalVotes.toString()}</div></div>
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Candidates</div><div className="text-2xl font-extrabold text-white">{candidateCount.toString()}</div></div>
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Merkle root</div><div className="mt-1 truncate font-mono text-xs text-emerald-300">{root}</div></div>
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Census file</div><div className="mt-1 truncate font-mono text-xs text-gray-300">{censusURI}</div></div>
          </div>

          <div className="card mt-4">
            <h2 className="font-bold text-white">Controls</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => void adminTx("startElection", "Starting")}
                disabled={state !== 0 || busy !== ""}
                className="btn-primary !px-4 !py-2 text-sm disabled:opacity-40"
              >
                {busy === "Starting" ? "⏳ Confirm in wallet…" : "▶ Start voting"}
              </button>
              <button
                onClick={() => void adminTx("endElection", "Ending")}
                disabled={state !== 1 || busy !== ""}
                className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-40"
              >
                {busy === "Ending" ? "⏳ Confirm in wallet…" : "⏹ End voting"}
              </button>
            </div>
            {txMsg && <p className="mt-2 text-xs text-indigo-300">{txMsg}</p>}
            {state === 0 && <p className="mt-2 text-xs text-gray-500">Start needs 2+ candidates and a committed census — both set at deploy.</p>}
          </div>

          <div className="card mt-4">
            <h2 className="font-bold text-white">Candidates · live counts</h2>
            <div className="mt-3 grid gap-2">
              {candidates.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <div>
                    <span className="font-semibold text-white">{c.name || `(candidate ${i + 1})`}</span>
                    {c.tagline && <span className="ml-2 text-xs text-gray-500">{c.tagline}</span>}
                    {!c.active && <span className="ml-2 text-xs text-red-300">removed</span>}
                  </div>
                  <span className="font-mono text-sm text-emerald-300">{c.voteCount.toString()} votes</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
