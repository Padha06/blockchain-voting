import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

export const appchain = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 20260),
  name: "College AppChain",
  nativeCurrency: { name: "Gas", symbol: "GAS", decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"] } },
});

export const wagmiConfig = createConfig({
  chains: [appchain],
  transports: { [appchain.id]: http() },
});

export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "http://127.0.0.1:4000";

export const ELECTION_ABI = [
  "function addCandidate(string name, string tagline, string imageUrl)",
  "function startElection()",
  "function endElection()",
  "function castVote(uint256 candidateId, bytes32 leaf, bytes32[] proof)",
  "function getCandidates() view returns (tuple(string name,string tagline,string imageUrl,uint256 voteCount,bool active)[])",
  "function getStats() view returns (uint8,uint256,uint256,uint256,uint256)",
  "function merkleRoot() view returns (bytes32)",
  "function censusURI() view returns (string)",
  "function hasVoted(bytes32) view returns (bool)",
  "event VoteCast(bytes32 indexed leaf, uint256 indexed candidateId, uint256 timestamp)",
] as const;

export const FACTORY_ABI = [
  "function createElection(string title,string description,bytes32 merkleRoot,string censusURI) returns (address)",
  "function getElectionsByOwner(address) view returns (address[])",
  "event ElectionCreated(address indexed election, address indexed owner, string title)",
] as const;
