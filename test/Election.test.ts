import { expect } from "chai";
import { ethers } from "hardhat";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { randomBytes } from "crypto";

// Leaf = [rollNo(normalised), salt, election(address), chainId] keeps proofs
// bound to one election on one chain (app-chain replay protection).
function buildTree(rolls: string[], salt: string, election: string, chainId: number) {
  const values = rolls.map((r) => [r, salt, election, chainId.toString()]);
  return StandardMerkleTree.of(values, ["string", "bytes32", "address", "uint256"]);
}

describe("Election", () => {
  const ZERO_ROOT = "0x0000000000000000000000000000000000000000000000000000000000000000";

  async function deployFresh() {
    const [owner, a, b] = await ethers.getSigners();
    const Election = await ethers.getContractFactory("Election");
    const impl = await Election.deploy();
    await impl.waitForDeployment();
    const Factory = await ethers.getContractFactory("ElectionFactory");
    const f = await Factory.deploy(await impl.getAddress());
    await f.waitForDeployment();
    // Production path: EIP-1167 clone + initialize (implementation itself is locked
    // via _disableInitializers, so direct initialize would revert).
    const tx = await f.createElection("T", "D", ZERO_ROOT, "/census/x.json");
    const receipt = await tx.wait();
    const addr = receipt?.logs
      ? (f.interface.parseLog(receipt.logs[receipt.logs.length - 1] as unknown as { topics: string[]; data: string })?.args[0] as string)
      : await f.getElections().then((a) => a[a.length - 1]);
    const e = Election.attach(addr);
    return { owner, a, b, e };
  }

  it("sets owner on initialize", async () => {
    const { owner, e } = await deployFresh();
    expect(await e.owner()).to.equal(owner.address);
  });

  it("rejects addCandidate from non-owner", async () => {
    const { a, e } = await deployFresh();
    await expect(e.connect(a).addCandidate("X", "t", "")).to.be.reverted;
  });

  it("rejects startElection with fewer than 2 candidates", async () => {
    const { e } = await deployFresh();
    await (await e.addCandidate("A", "t", "")).wait();
    await expect(e.startElection()).to.be.revertedWithCustomError(e, "ZeroMerkleRoot");
  });

  it("rejects startElection with zero merkle root", async () => {
    const { e } = await deployFresh();
    await (await e.addCandidate("A", "t", "")).wait();
    await (await e.addCandidate("B", "t", "")).wait();
    await expect(e.startElection()).to.be.revertedWithCustomError(e, "ZeroMerkleRoot");
  });

  it("accepts a valid vote, rejects double vote + outsiders", async () => {
    const { e } = await deployFresh();
    await (await e.addCandidate("Alice", "P1", "")).wait();
    await (await e.addCandidate("Bob", "P2", "")).wait();
    const addr = await e.getAddress();
    const net = await ethers.provider.getNetwork();
    const salt = "0x" + randomBytes(32).toString("hex");
    const tree = buildTree(["CS001", "CS002"], salt, addr, Number(net.chainId));
    await (await e.updateCensus(tree.root as `0x${string}`, "/census/x.json")).wait();
    await (await e.startElection()).wait();

    let leaf = "";
    let proof: string[] = [];
    for (const [i, v] of tree.entries()) {
      if (v[0] === "CS001") {
        leaf = tree.leafHash(v);
        proof = tree.getProof(i);
      }
    }
    await expect(await e.castVote(1, leaf, proof)).to.emit(e, "VoteCast");
    await expect(e.castVote(1, leaf, proof)).to.be.revertedWithCustomError(e, "AlreadyVoted");

    // outsider leaf from a different tree
    const other = buildTree(["ZZZ999"], salt, addr, Number(net.chainId));
    const [oi, ov] = [...other.entries()][0];
    await expect(
      e.castVote(1, other.leafHash(ov), other.getProof(oi))
    ).to.be.revertedWithCustomError(e, "NotEligible");
  });

  it("rejects voting before start and after end", async () => {
    const { e } = await deployFresh();
    await (await e.addCandidate("A", "t", "")).wait();
    await (await e.addCandidate("B", "t", "")).wait();
    const addr = await e.getAddress();
    const net = await ethers.provider.getNetwork();
    const salt = "0x" + randomBytes(32).toString("hex");
    const tree = buildTree(["CS001"], salt, addr, Number(net.chainId));
    const [i, v] = [...tree.entries()][0];
    const leaf = tree.leafHash(v);
    const proof = tree.getProof(i);
    await (await e.updateCensus(tree.root as `0x${string}`, "/census/x.json")).wait();
    await expect(e.castVote(1, leaf, proof)).to.be.revertedWithCustomError(e, "NotActive");
    await (await e.startElection()).wait();
    await (await e.castVote(1, leaf, proof)).wait();
    await (await e.endElection()).wait();
    await expect(e.castVote(2, leaf, proof)).to.be.revertedWithCustomError(e, "NotActive");
  });

  it("tallies 100 voters correctly", async () => {
    const { e } = await deployFresh();
    await (await e.addCandidate("A", "t", "")).wait();
    await (await e.addCandidate("B", "t", "")).wait();
    const addr = await e.getAddress();
    const net = await ethers.provider.getNetwork();
    const salt = "0x" + randomBytes(32).toString("hex");
    const rolls = Array.from({ length: 100 }, (_, i) => `R${String(i).padStart(4, "0")}`);
    const tree = buildTree(rolls, salt, addr, Number(net.chainId));
    await (await e.updateCensus(tree.root as `0x${string}`, "/census/x.json")).wait();
    await (await e.startElection()).wait();
    let n = 0;
    for (const [i, v] of tree.entries()) {
      await (await e.castVote(n % 2 === 0 ? 1 : 2, tree.leafHash(v), tree.getProof(i))).wait();
      n++;
    }
    const stats = await e.getStats();
    expect(stats[1]).to.equal(100n);
  });
});
