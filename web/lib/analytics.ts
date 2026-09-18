import type { VoteEvent } from "./storage/adapter";

export interface CandidateTally {
  id: number;
  name: string;
  votes: number;
  pct: number;
}

export function tallyVotes(events: VoteEvent[], names: string[]): CandidateTally[] {
  const counts = new Map<number, number>();
  for (const e of events) counts.set(e.candidateId, (counts.get(e.candidateId) ?? 0) + 1);
  const total = events.length || 1;
  return names.map((name, i) => {
    const votes = counts.get(i + 1) ?? 0;
    return { id: i + 1, name, votes, pct: (votes / total) * 100 };
  });
}

export function cumulativeOverTime(events: VoteEvent[]): { t: number; total: number }[] {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  return sorted.map((e, i) => ({ t: e.timestamp, total: i + 1 }));
}

export function toCsv(rows: CandidateTally[]): string {
  return ["id,name,votes,pct", ...rows.map((r) => `${r.id},"${r.name}",${r.votes},${r.pct.toFixed(2)}`)].join("\n");
}
