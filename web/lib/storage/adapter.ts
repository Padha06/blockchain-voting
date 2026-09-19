// StorageAdapter — the ONLY persistence interface. Everything async so a
// future SupabaseAdapter drops in without changing call sites.
// Rule: no component/page may call window.localStorage directly.
export type ElectionState = "Created" | "Active" | "Ended" | "Cancelled";

export interface VoterRecord {
  rollNo: string;
  name: string;
  department?: string;
  year?: string;
  section?: string;
}

export interface Census {
  electionAddress: string;
  merkleRoot: `0x${string}`;
  salt: `0x${string}`;
  chainId: number;
  voters: VoterRecord[];
  createdAt: number;
}

export interface VoteEvent {
  leaf: `0x${string}`;
  candidateId: number;
  blockNumber: number;
  timestamp: number;
  txHash: `0x${string}`;
}

export interface ElectionDraft {
  id: string;
  title: string;
  description: string;
  candidates: { name: string; tagline: string; imageUrl: string }[];
  voters: VoterRecord[];
  createdAt: number;
}

export interface StorageAdapter {
  saveDraft(id: string, draft: ElectionDraft): Promise<void>;
  getDraft(id: string): Promise<ElectionDraft | null>;
  listDrafts(): Promise<ElectionDraft[]>;
  deleteDraft(id: string): Promise<void>;
  putCensus(electionAddress: string, census: Census): Promise<void>;
  getCensus(electionAddress: string): Promise<Census | null>;
  putEvents(electionAddress: string, events: VoteEvent[]): Promise<void>;
  getEvents(electionAddress: string): Promise<VoteEvent[]>;
  getLastIndexedBlock(electionAddress: string): Promise<bigint | null>;
  setLastIndexedBlock(electionAddress: string, block: bigint): Promise<void>;

  // UI settings (e.g. runtime chain overrides). Namespaced keys.
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  deleteSetting(key: string): Promise<void>;
}
