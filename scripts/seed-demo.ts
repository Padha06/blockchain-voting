import { ethers } from "hardhat";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { randomBytes } from "crypto";
import * as fs from "fs";

/**
 * Demo seeder: creates 1 election, 5 candidates, 200 voters, casts ~140 votes.
 * Run AFTER deploy: npx hardhat run scripts/seed-demo.ts --network localhost
 * Output: web/public/census/<addr>.json + web/demo-receipts.json
 * The demo must NEVER be shown with empty charts — this guarantees data.
 */
async function main() {
  const addrs = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractAt("ElectionFactory", addrs.factory);
  const Election = await ethers.getContractFactory("Election");
  const net = await ethers.provider.getNetwork();

  const rolls = Array.from({ length: 200 }, (_, i) => `CS2026${String(i + 1).padStart(4, "0")}`);
  const salt = "0x" + randomBytes(32).toString("hex");
  // Temporary election address placeholder for tree binding — rebuilt after clone.
  const placeholder = "0x0000000000000000000000000000000000000001";
  let tree = StandardMerkleTree.of(
    rolls.map((r) => [r, salt, placeholder, Number(net.chainId).toString()]),
    ["string", "bytes32", "address", "uint256"]
  );

  const tx = await factory.createElection(
    "College Election 2026",
    "Demo: class representative",
    tree.root as `0x${string}`,
    "pending"
  );
  const rc = await tx.wait();
  const count: bigint = await factory.electionCount();
  const all: string[] = await factory.getElections();
  const electionAddr: string = all[Number(count - 1n)] as string;
  console.log("Election:", electionAddr);

  // Rebuild tree bound to the real election address + chain, then update census.
  tree = StandardMerkleTree.of(
    rolls.map((r) => [r, salt, electionAddr, Number(net.chainId).toString()]),
    ["string", "bytes32", "address", "uint256"]
  );
  const e = Election.attach(electionAddr);
  await (await e.updateCensus(tree.root as `0x${string}`, `/census/${electionAddr}.json`)).wait();

  const names = ["Ananya Sharma", "Rohan Verma", "Priya Nair", "Arjun Mehta", "Kavya Iyer"];
  for (const n of names) await (await e.addCandidate(n, "Manifesto: better labs + fests", "")).wait();
  await (await e.startElection()).wait();

  // 140 randomised votes spread across candidates
  const receipts: unknown[] = [];
  let k = 0;
  for (const [i, v] of tree.entries()) {
    if (k >= 140) break;
    const candidateId = (k % 5) + 1;
    const r = await (await e.castVote(candidateId, tree.leafHash(v), tree.getProof(i), { gasPrice: 0 })).wait();
    receipts.push({ rollNo: v[0], candidateId, txHash: r?.hash, block: r?.blockNumber });
    k++;
  }

  const census = {
    electionAddress: electionAddr,
    merkleRoot: tree.root,
    salt,
    chainId: Number(net.chainId),
    voters: rolls.map((rollNo, i) => ({
      rollNo,
      name: `Student ${i + 1}`,
      department: ["CSE", "ECE", "ME", "CE"][i % 4],
      year: ["1", "2", "3", "4"][i % 4],
    })),
    createdAt: Date.now(),
  };
  fs.mkdirSync("web/public/census", { recursive: true });
  fs.writeFileSync(`web/public/census/${electionAddr}.json`, JSON.stringify(census, null, 2));
  fs.writeFileSync("web/demo-receipts.json", JSON.stringify(receipts, null, 2));
  console.log(`Seeded 200 voters, ${receipts.length} votes. Census: web/public/census/${electionAddr}.json`);
  void rc;
  void owner;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
