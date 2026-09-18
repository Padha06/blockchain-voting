import type { Census, ElectionDraft, StorageAdapter, VoteEvent } from "./adapter";

// LocalStorageAdapter — v1. Draft cache + census/event cache ONLY.
// Source of truth is on-chain root + published static census file (verified on fetch).
const K = {
  drafts: "bv.drafts",
  census: (a: string) => `bv.census.${a.toLowerCase()}`,
  events: (a: string) => `bv.events.${a.toLowerCase()}`,
  block: (a: string) => `bv.block.${a.toLowerCase()}`,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export class LocalStorageAdapter implements StorageAdapter {
  async saveDraft(id: string, draft: ElectionDraft): Promise<void> {
    const all = read<Record<string, ElectionDraft>>(K.drafts, {});
    all[id] = draft;
    write(K.drafts, all);
  }
  async getDraft(id: string): Promise<ElectionDraft | null> {
    return read<Record<string, ElectionDraft>>(K.drafts, {})[id] ?? null;
  }
  async listDrafts(): Promise<ElectionDraft[]> {
    return Object.values(read<Record<string, ElectionDraft>>(K.drafts, {}));
  }
  async deleteDraft(id: string): Promise<void> {
    const all = read<Record<string, ElectionDraft>>(K.drafts, {});
    delete all[id];
    write(K.drafts, all);
  }
  async putCensus(electionAddress: string, census: Census): Promise<void> {
    write(K.census(electionAddress), census);
  }
  async getCensus(electionAddress: string): Promise<Census | null> {
    return read<Census | null>(K.census(electionAddress), null);
  }
  async putEvents(electionAddress: string, events: VoteEvent[]): Promise<void> {
    write(K.events(electionAddress), events);
  }
  async getEvents(electionAddress: string): Promise<VoteEvent[]> {
    return read<VoteEvent[]>(K.events(electionAddress), []);
  }
  async getLastIndexedBlock(electionAddress: string): Promise<bigint | null> {
    const v = read<string | null>(K.block(electionAddress), null);
    return v ? BigInt(v) : null;
  }
  async setLastIndexedBlock(electionAddress: string, block: bigint): Promise<void> {
    write(K.block(electionAddress), block.toString());
  }
}
