import { storage } from "./storage";

// Runtime chain config. Priority: admin UI override (per-browser) > build-time env.
// This is what makes tunnel restarts painless: paste the new RPC/factory URL in
// Admin → Settings instead of changing Vercel env vars + redeploying.
export interface ChainConfig {
  rpcUrl: string;
  chainId: number;
  factoryAddress: `0x${string}`;
  explorerUrl: string;
  /** true when every value comes from env (no override stored) */
  fromEnv: boolean;
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export function envChainConfig(): ChainConfig {
  return {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545",
    chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 20260),
    factoryAddress: ((process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? ZERO_ADDR) as `0x${string}`),
    explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "http://127.0.0.1:4000",
    fromEnv: true,
  };
}

export async function loadChainConfig(): Promise<ChainConfig> {
  const base = envChainConfig();
  try {
    const [rpc, chain, factory, explorer] = await Promise.all([
      storage.getSetting("chain.rpcUrl"),
      storage.getSetting("chain.chainId"),
      storage.getSetting("chain.factory"),
      storage.getSetting("chain.explorer"),
    ]);
    if (!rpc && !chain && !factory && !explorer) return base;
    return {
      rpcUrl: rpc ?? base.rpcUrl,
      chainId: chain ? Number(chain) : base.chainId,
      factoryAddress: ((factory ?? base.factoryAddress) as `0x${string}`),
      explorerUrl: explorer ?? base.explorerUrl,
      fromEnv: false,
    };
  } catch {
    return base;
  }
}

export async function saveChainOverride(cfg: Omit<ChainConfig, "fromEnv">): Promise<void> {
  await Promise.all([
    storage.setSetting("chain.rpcUrl", cfg.rpcUrl),
    storage.setSetting("chain.chainId", String(cfg.chainId)),
    storage.setSetting("chain.factory", cfg.factoryAddress),
    storage.setSetting("chain.explorer", cfg.explorerUrl),
  ]);
}

export async function clearChainOverride(): Promise<void> {
  await Promise.all([
    storage.deleteSetting("chain.rpcUrl"),
    storage.deleteSetting("chain.chainId"),
    storage.deleteSetting("chain.factory"),
    storage.deleteSetting("chain.explorer"),
  ]);
}

export function isFactorySet(cfg: ChainConfig): boolean {
  return cfg.factoryAddress.toLowerCase() !== ZERO_ADDR;
}

/** Ping an RPC URL, return its chainId. Throws with a readable message. */
export async function probeRpc(rpcUrl: string): Promise<number> {
  let res: Response;
  try {
    res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
    });
  } catch {
    throw new Error("Unreachable — check the URL and that the chain/tunnel is running.");
  }
  if (!res.ok) throw new Error(`RPC returned HTTP ${res.status}.`);
  const json = (await res.json()) as { result?: string; error?: { message?: string } };
  if (json.error) throw new Error(`RPC error: ${json.error.message ?? "unknown"}.`);
  if (!json.result) throw new Error("No chainId in RPC response.");
  return Number(json.result);
}
