import { describe, expect, it } from "vitest";
import { buildTree, getProof, normaliseRollNo, randomSalt, verifyCensus } from "../lib/census";

describe("census", () => {
  it("normalises roll numbers", () => {
    expect(normaliseRollNo("  cs 001 ")).toBe("CS001");
  });
  it("round-trips: build → proof → root match", () => {
    const voters = [{ rollNo: "CS001", name: "A" }, { rollNo: "CS002", name: "B" }];
    const salt = randomSalt();
    const el = "0x0000000000000000000000000000000000000001";
    const tree = buildTree(voters, salt, el, 20260);
    const p = getProof(tree, " cs001 ");
    expect(p).not.toBeNull();
    expect(
      verifyCensus({ electionAddress: el, merkleRoot: tree.root as `0x${string}`, salt, chainId: 20260, voters, createdAt: 0 }, el, tree.root as `0x${string}`)
    ).toBe(true);
  });
});
