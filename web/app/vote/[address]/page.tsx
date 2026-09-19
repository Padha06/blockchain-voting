"use client";

import { useCallback, useEffect, useState } from "react";
import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { buildTree, getProof, normaliseRollNo } from "@/lib/census";
import {
  chainForConfig,
  ELECTION_ABI,
  EXPLORER_URL as DEFAULT_EXPLORER,
  getPublicClient,
} from "@/lib/contracts";
import { envChainConfig, loadChainConfig, type ChainConfig } from "@/lib/chain-config";
import type { Census } from "@/lib/storage/adapter";

interface CandidateView {
  name: string;
  tagline: string;
  imageUrl: string;
  voteCount: bigint;
  active: boolean;
}

interface Receipt {
  candidateName: string;
  txHash: string;
  blockNumber: string;
  explorer: string;
}

export default function Vote({ params }: { params: { address: string } }) {
  const addr = params.address as `0x${string}`;
  const [cfg, setCfg] = useState<ChainConfig>(() => envChainConfig());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");
  const [state, setState] = useState(0);
  const [candidates, setCandidates] = useState<CandidateView[]>([]);
  const [census, setCensus] = useState<Census | null>(null);

  const [roll, setRoll] = useState("");
  const [foundName, setFoundName] = useState<string | null>(null);
  const [proof, setProof] = useState<{ leaf: `0x${string}`; proof: `0x${string}`[] } | null>(null);
  const [lookupMsg, setLookupMsg] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [voting, setVoting] = useState<number | null>(null);
  const [voteErr, setVoteErr] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const load = useCallback(async () => {
    try {
      const c = await loadChainConfig();
      setCfg(c);
      const pc = getPublicClient(c.rpcUrl, c.chainId);
      const [t, stats, uri, root, cands] = await Promise.all([
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "title" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "getStats" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "censusURI" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "merkleRoot" }),
        pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "getCandidates" }),
      ]);
      setTitle(t as string);
      setState((stats as unknown as [number, bigint, bigint, bigint, bigint])[0]);
      setCandidates(cands as unknown as CandidateView[]);

      // Fetch + verify census (never trust the file blindly).
      const res = await fetch(uri as string);
      if (!res.ok) throw new Error(`Census file missing (${uri as string}). Ask the organiser to publish it.`);
      const file = (await res.json()) as Census;
      const { verifyCensus } = await import("@/lib/census");
      if (!verifyCensus(file, addr, root as `0x${string}`)) {
        throw new Error("Census file does not match the on-chain commitment. Stopped for safety.");
      }
      setCensus(file);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load election.");
    } finally {
      setLoading(false);
    }
  }, [addr]);

  useEffect(() => {
    void load();
  }, [load]);

  async function checkRoll() {
    setLookupMsg("");
    setFoundName(null);
    setProof(null);
    setAlreadyVoted(false);
    setVoteErr("");
    if (!census) return;
    const tree = buildTree(census.voters, census.salt, addr, census.chainId);
    const p = getProof(tree, roll);
    if (!p) {
      setLookupMsg("This roll number is not on the voter list for this election.");
      return;
    }
    const voter = census.voters.find((v) => normaliseRollNo(v.rollNo) === normaliseRollNo(roll));
    setFoundName(voter?.name ?? normaliseRollNo(roll));
    setProof(p);
    const pc = getPublicClient(cfg.rpcUrl, cfg.chainId);
    const voted = await pc.readContract({ address: addr, abi: ELECTION_ABI, functionName: "hasVoted", args: [p.leaf] });
    if (voted) setAlreadyVoted(true);
  }

  async function castVote(candidateId: number, candidateName: string) {
    if (!proof) return;
    if (!confirm(`Vote for ${candidateName}? This is irreversible.`)) return;
    setVoting(candidateId);
    setVoteErr("");
    try {
      // Free burner wallet — no MetaMask, no funds needed on the zero-gas chain.
      const burner = privateKeyToAccount(generatePrivateKey());
      const wallet = createWalletClient({
        account: burner,
        chain: chainForConfig(cfg),
        transport: http(cfg.rpcUrl),
      });
      const pc = getPublicClient(cfg.rpcUrl, cfg.chainId);
      const hash = await wallet.writeContract({
        address: addr,
        abi: ELECTION_ABI,
        functionName: "castVote",
        args: [BigInt(candidateId), proof.leaf, proof.proof],
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
      });
      const rc = await pc.waitForTransactionReceipt({ hash });
      const explorer = cfg.explorerUrl !== "http://127.0.0.1:8545" ? cfg.explorerUrl : DEFAULT_EXPLORER;
      setReceipt({
        candidateName,
        txHash: hash,
        blockNumber: rc.blockNumber.toString(),
        explorer: `${explorer.replace(/\/$/, "")}/tx/${hash}`,
      });
      setAlreadyVoted(true);
    } catch (e) {
      setVoteErr(e instanceof Error ? e.message : "Vote failed.");
    } finally {
      setVoting(null);
    }
  }

  if (loading) return <main className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-gray-500">Loading election…</main>;

  if (err) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="card text-center text-sm text-red-300">{err}</div>
      </main>
    );
  }

  if (state !== 1) {
    const msg = state === 0 ? "Voting has not started yet." : state === 2 ? "Voting has ended." : "This election was cancelled.";
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-white">{title}</h1>
        <div className="card mt-6 text-sm text-gray-300">{msg} <a href={`/results/${addr}`} className="text-indigo-300 underline">View results →</a></div>
      </main>
    );
  }

  if (receipt) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="card border-emerald-400/30 text-center">
          <div className="text-4xl">✅</div>
          <h1 className="mt-2 text-2xl font-extrabold text-white">Vote recorded</h1>
          <p className="mt-1 text-sm text-gray-300">You voted for <b className="text-white">{receipt.candidateName}</b></p>
          <div className="mt-4 rounded-xl bg-black/40 p-3 text-left">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">Transaction hash</p>
            <p className="break-all font-mono text-xs text-emerald-300">{receipt.txHash}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-gray-500">Block</p>
            <p className="font-mono text-xs text-gray-300">{receipt.blockNumber}</p>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href={receipt.explorer} target="_blank" rel="noreferrer" className="btn-primary !px-4 !py-2 text-sm">View on explorer</a>
            <button
              onClick={() => void navigator.clipboard.writeText(`Voted for ${receipt.candidateName} in ${title}. Tx: ${receipt.txHash} (block ${receipt.blockNumber})`)}
              className="btn-ghost !px-4 !py-2 text-sm"
            >
              Copy receipt
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-center font-mono text-xs text-gray-500">{addr}</p>
      <h1 className="mt-1 text-center text-3xl font-extrabold tracking-tight text-white">{title}</h1>
      <p className="mt-2 text-center text-sm text-gray-400">Free on the college chain — no wallet or funds needed.</p>

      <div className="card mt-8">
        <label className="text-sm font-semibold text-gray-300">Step 1 · Find yourself on the roll</label>
        <div className="mt-2 flex gap-2">
          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="e.g. CS20260042"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 uppercase text-white placeholder:normal-case placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
          />
          <button onClick={() => void checkRoll()} className="btn-primary shrink-0">Check</button>
        </div>
        {lookupMsg && <p className="mt-2 text-xs text-red-300">{lookupMsg}</p>}
        {foundName && (
          <p className="mt-2 text-sm text-emerald-300">Voting as: <b>{foundName}</b></p>
        )}
        {alreadyVoted && <p className="mt-1 text-xs text-amber-300">This roll number has already voted.</p>}
      </div>

      {foundName && !alreadyVoted && (
        <div className="card mt-4">
          <div className="text-sm font-semibold text-gray-300">Step 2 · Pick one candidate</div>
          <div className="mt-3 grid gap-2">
            {candidates.map((c, i) => (
              c.active && (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <div>
                    <span className="font-semibold text-white">{c.name}</span>
                    {c.tagline && <span className="ml-2 text-xs text-gray-500">{c.tagline}</span>}
                  </div>
                  <button
                    onClick={() => void castVote(i + 1, c.name)}
                    disabled={voting !== null}
                    className="btn-primary !px-4 !py-1.5 text-sm disabled:opacity-40"
                  >
                    {voting === i + 1 ? "⏳ Voting…" : "Vote"}
                  </button>
                </div>
              )
            ))}
          </div>
          {voteErr && <p className="mt-2 text-xs text-red-300">{voteErr}</p>}
        </div>
      )}
    </main>
  );
}
