import { LocalStorageAdapter } from "./local";
import type { StorageAdapter } from "./adapter";

export const storage: StorageAdapter = new LocalStorageAdapter();
// Future: export const storage: StorageAdapter = new SupabaseAdapter(client);
export * from "./adapter";
