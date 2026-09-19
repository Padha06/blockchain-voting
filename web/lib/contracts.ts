import { createPublicClient, defineChain, http, parseAbi } from "viem";

export const appchain = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 20260),
  name: "College AppChain",
  nativeCurrency: { name: "Gas", symbol: "GAS", decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"] } },
});

export function getPublicClient() {
  return createPublicClient({ chain: appchain, transport: http() });
}

export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "http://127.0.0.1:4000";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 20260);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

export const ZERO_ROOT = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export const ELECTION_ABI = parseAbi([
  "function addCandidate(string name, string tagline, string imageUrl)",
  "function updateCensus(bytes32 newRoot, string newURI)",
  "function startElection()",
  "function endElection()",
  "function castVote(uint256 candidateId, bytes32 leaf, bytes32[] proof)",
  "function getCandidates() view returns ((string name, string tagline, string imageUrl, uint256 voteCount, bool active)[])",
  "function getStats() view returns (uint8 state, uint256 totalVotes, uint256 candidateCount, uint256 startedAt, uint256 endedAt)",
  "function merkleRoot() view returns (bytes32)",
  "function censusURI() view returns (string)",
  "function hasVoted(bytes32 leaf) view returns (bool)",
  "event VoteCast(bytes32 indexed leaf, uint256 indexed candidateId, uint256 timestamp)",
]);

export const FACTORY_ABI = parseAbi([
  "function createElection(string title, string description, bytes32 merkleRoot, string censusURI) returns (address election)",
  "function getElectionsByOwner(address owner) view returns (address[] elections)",
  "function electionCount() view returns (uint256)",
  "event ElectionCreated(address indexed election, address indexed owner, string title)",
]);
