"use client";

import { useState } from "react";
import { useAccount, useConnect, usePublicClient, useWriteContract } from "wagmi";
import { decodeEventLog } from "viem";
import { buildTree } from "@/lib/census";
import {
  CHAIN_ID,
  ELECTION_ABI,
  FACTORY_ABI,
  FACTORY_ADDRESS,
  ZERO_ROOT,
} from "@/lib/contracts";
import { storage, type Census, type VoterRecord } from "@/lib/storage";

interface CandidateInput {
  name: string;
  tagline: string;
  imageUrl: string;
}

type Phase =
  | "idle"
  | "connecting"
  | "creating"
  | "binding-census"
  | "adding-candidates"
  | "done"
  | "error";

export function DeployButton({
  title,
  description,
  voters,
  salt,
  candidates,
}: {
  title: string;
  description: string;
  voters: VoterRecord[];
  salt: `0x${string}`;
  candidates: CandidateInput[];
}) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [election, setElection] = useState<`0x${string}` | null>(null);

  const ready = voters.length > 0 && candidates.length >= 2 && title.trim().length >= 4;

  async function run() {
    if (!ready) return;
    if (!isConnected || !address) {
      setPhase("connecting");
      const injected = connectors[0];
      if (!injected) {
        setPhase("error");
        setMessage("No wallet found — install MetaMask and point it at the app-chain RPC.");
        return;
      }
      connect({ connector: injected });
      return;
    }
    if (chainId !== CHAIN_ID) {
      setPhase("error");
      setMessage(`Wrong network in wallet (got ${chainId}, need ${CHAIN_ID}). Switch networks and retry.`);
      return;
    }
    if (!publicClient) {
      setPhase("error");
      setMessage("No RPC connection — check NEXT_PUBLIC_RPC_URL.");
      return;
    }
    try {
      // 1. Clone via factory with a placeholder root (real address unknown until mined).
      setPhase("creating");
      setMessage("Creating election clone… confirm in wallet.");
      const createHash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createElection",
        args: [title, description, ZERO_ROOT, "pending"],
      });
      const createRc = await publicClient.waitForTransactionReceipt({ hash: createHash });
      let electionAddr: `0x${string}` | null = null;
      for (const log of createRc.logs) {
        try {
          const decoded = decodeEventLog({ abi: FACTORY_ABI, data: log.data, topics: log.topics }) as unknown as {
            eventName: string;
            args: { election: `0x${string}` };
          };
          if (decoded.eventName === "ElectionCreated") {
            electionAddr = decoded.args.election;
            break;
          }
        } catch {
          // not our event — keep scanning
        }
      }
      if (!electionAddr) throw new Error("ElectionCreated event not found in receipt.");
      setElection(electionAddr);

      // 2. Build the real tree bound to the deployed address, then commit the root.
      setPhase("binding-census");
      setMessage("Binding voter census to the deployed election… confirm in wallet.");
      const tree = buildTree(voters, salt, electionAddr, CHAIN_ID);
      const censusURI = `/census/${electionAddr}.json`;
      const censusHash = await writeContractAsync({
        address: electionAddr,
        abi: ELECTION_ABI,
        functionName: "updateCensus",
        args: [tree.root as `0x${string}`, censusURI],
      });
      await publicClient.waitForTransactionReceipt({ hash: censusHash });

      // 3. Candidates, one tx each (fine at this scale on a zero-gas chain).
      setPhase("adding-candidates");
      for (const [i, c] of candidates.entries()) {
        setMessage(`Adding candidate ${i + 1} of ${candidates.length}… confirm in wallet.`);
        const h = await writeContractAsync({
          address: electionAddr,
          abi: ELECTION_ABI,
          functionName: "addCandidate",
          args: [c.name, c.tagline, c.imageUrl],
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
      }

      // 4. Hand the admin the real census file + clean up the draft.
      const census: Census = {
        electionAddress: electionAddr,
        merkleRoot: tree.root as `0x${string}`,
        salt,
        chainId: CHAIN_ID,
        voters,
        createdAt: Date.now(),
      };
      await storage.putCensus(electionAddr, census);
      await storage.deleteDraft("wizard-current");
      const blob = new Blob([JSON.stringify(census, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${electionAddr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setPhase("done");
      setMessage("");
    } catch (e) {
      setPhase("error");
      setMessage(e instanceof Error ? e.message : "Deploy failed.");
    }
  }

  if (phase === "done" && election) {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
        <p className="font-semibold text-emerald-300">🎉 Election deployed on-chain</p>
        <p className="mt-1 break-all font-mono text-xs text-gray-300">{election}</p>
        <p className="mt-1 text-xs text-gray-400">
          Census file downloaded — commit it to <code>web/public/census/{election}.json</code> and redeploy the site.
        </p>
        <a href={`/admin/${election}`} className="btn-primary mt-3 !px-4 !py-2 text-sm">
          Open manage page →
        </a>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => void run()} disabled={!ready || phase !== "idle" && phase !== "error" && phase !== "connecting"} className="btn-primary !px-4 !py-2 text-sm disabled:opacity-40">
        {phase === "idle" || phase === "error" ? "🚀 Deploy on-chain" : `⏳ ${message || "Working…"}`}
      </button>
      {!isConnected && (phase === "idle" || phase === "connecting") && (
        <p className="mt-1 text-xs text-gray-500">
          {connecting || phase === "connecting" ? "Confirm connection in your wallet…" : "First click connects your admin wallet, second click deploys."}
        </p>
      )}
      {phase === "error" && <p className="mt-2 text-xs text-red-300">{message}</p>}
      {(phase === "creating" || phase === "binding-census" || phase === "adding-candidates") && (
        <p className="mt-2 text-xs text-indigo-300">{message}</p>
      )}
    </div>
  );
}
