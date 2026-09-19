"use client";

import { useEffect, useState } from "react";
import {
  clearChainOverride,
  envChainConfig,
  isFactorySet,
  loadChainConfig,
  probeRpc,
  saveChainOverride,
  type ChainConfig,
} from "@/lib/chain-config";

export default function ChainSettings() {
  const [cfg, setCfg] = useState<ChainConfig>(() => envChainConfig());
  const [rpcUrl, setRpcUrl] = useState("");
  const [chainId, setChainId] = useState("");
  const [factory, setFactory] = useState("");
  const [explorer, setExplorer] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadChainConfig().then((c) => {
      setCfg(c);
      setRpcUrl(c.rpcUrl);
      setChainId(String(c.chainId));
      setFactory(c.factoryAddress);
      setExplorer(c.explorerUrl);
    }).catch(() => undefined);
  }, []);

  async function autofillLocal() {
    setStatus(null);
    setBusy(true);
    try {
      const id = await probeRpc("http://127.0.0.1:8545");
      setRpcUrl("http://127.0.0.1:8545");
      setChainId(String(id));
      setExplorer("http://127.0.0.1:8545");
      setStatus({ kind: "info", text: `Demo chain found (chain ${id}). Paste the factory address, then Test connection & save.` });
    } catch (e) {
      setStatus({ kind: "err", text: e instanceof Error ? `No demo chain on this laptop: ${e.message}` : "No demo chain found." });
    } finally {
      setBusy(false);
    }
  }

  async function testAndSave() {
    setStatus(null);
    setBusy(true);
    try {
      const liveChainId = await probeRpc(rpcUrl.trim());
      const id = Number(chainId);
      if (!Number.isInteger(id) || id <= 0) throw new Error("Chain ID must be a positive integer.");
      if (liveChainId !== id) {
        throw new Error(`RPC reports chainId ${liveChainId}, but you entered ${id}. Fix the Chain ID first.`);
      }
      if (!/^0x[0-9a-fA-F]{40}$/.test(factory.trim())) {
        throw new Error("Factory address must be a 0x address (40 hex chars).");
      }
      await saveChainOverride({
        rpcUrl: rpcUrl.trim().replace(/\/$/, ""),
        chainId: id,
        factoryAddress: factory.trim() as `0x${string}`,
        explorerUrl: explorer.trim().replace(/\/$/, "") || rpcUrl.trim(),
      });
      const next = await loadChainConfig();
      setCfg(next);
      setStatus({ kind: "ok", text: `Saved — chain ${liveChainId} reachable, deploy unlocked. No redeploy needed.` });
    } catch (e) {
      setStatus({ kind: "err", text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    await clearChainOverride();
    const next = await loadChainConfig();
    setCfg(next);
    setRpcUrl(next.rpcUrl);
    setChainId(String(next.chainId));
    setFactory(next.factoryAddress);
    setExplorer(next.explorerUrl);
    setStatus({ kind: "info", text: "Cleared — back to build-time env values." });
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">⚙️ Chain settings</h1>
      <p className="mt-1 text-sm text-gray-400">
        Point this browser at any chain — no Vercel env change, no redeploy. Tunnel restarted with a
        new URL? Paste it here and keep going.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs">
        <span className={`h-2 w-2 rounded-full ${isFactorySet(cfg) ? "bg-emerald-400" : "bg-amber-300"}`} />
        <span className="text-gray-300">
          {isFactorySet(cfg)
            ? `Deploy unlocked · chain ${cfg.chainId} · ${cfg.fromEnv ? "from build env" : "from this form"}`
            : "Deploy locked · set RPC + factory below"}
        </span>
      </div>

      <div className="card mt-4">
        <label className="text-sm font-semibold text-gray-300">RPC URL</label>
        <input value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)} placeholder="https://…trycloudflare.com" className={inputCls} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-300">Chain ID</label>
            <input value={chainId} onChange={(e) => setChainId(e.target.value)} placeholder="31337" className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-300">Explorer URL</label>
            <input value={explorer} onChange={(e) => setExplorer(e.target.value)} placeholder="https://…" className={inputCls} />
          </div>
        </div>
        <label className="mt-3 block text-sm font-semibold text-gray-300">ElectionFactory address</label>
        <input value={factory} onChange={(e) => setFactory(e.target.value)} placeholder="0x…" className={inputCls} />

        {status && (
          <p className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
            status.kind === "ok"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : status.kind === "err"
                ? "border-red-400/30 bg-red-400/10 text-red-200"
                : "border-white/10 bg-white/5 text-gray-300"
          }`}>
            {status.text}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => void autofillLocal()} disabled={busy} className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-40">
            🖥️ Autofill from this laptop
          </button>
          <button onClick={() => void testAndSave()} disabled={busy} className="btn-primary !px-4 !py-2 text-sm disabled:opacity-40">
            {busy ? "Testing RPC…" : "Test connection & save"}
          </button>
          <button onClick={() => void reset()} className="btn-ghost !px-4 !py-2 text-sm">
            Reset to defaults
          </button>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-gray-600">
        Stored only in this browser (localStorage). Each admin device sets it once. Real access
        control stays on-chain: only the election owner's wallet can act.
      </p>
    </main>
  );
}
