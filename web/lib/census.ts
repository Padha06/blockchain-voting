import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { Census, VoterRecord } from "./storage/adapter";

export function normaliseRollNo(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function randomSalt(): `0x${string}` {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return (`0x${[...b].map((x) => x.toString(16).padStart(2, "0")).join("")}` as `0x${string}`);
}

type LeafValue = [string, string, string, string]; // rollNo, salt, election, chainId

export function buildTree(voters: VoterRecord[], salt: string, election: string, chainId: number) {
  const values: LeafValue[] = voters.map((v) => [
    normaliseRollNo(v.rollNo),
    salt,
    election.toLowerCase(),
    chainId.toString(),
  ]);
  return StandardMerkleTree.of(values, ["string", "bytes32", "address", "uint256"]);
}

export function getProof(
  tree: StandardMerkleTree<LeafValue>,
  rollNo: string
): { leaf: `0x${string}`; proof: `0x${string}`[] } | null {
  const target = normaliseRollNo(rollNo);
  for (const [i, v] of tree.entries()) {
    if (v[0] === target) {
      return {
        leaf: tree.leafHash(v) as `0x${string}`,
        proof: tree.getProof(i) as `0x${string}`[],
      };
    }
  }
  return null;
}

/** Rebuild tree from a fetched census and assert it matches the on-chain root. */
export function verifyCensus(census: Census, election: string, onChainRoot: `0x${string}`): boolean {
  const tree = buildTree(census.voters, census.salt, election, census.chainId);
  return tree.root.toLowerCase() === onChainRoot.toLowerCase();
}
