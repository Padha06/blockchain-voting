import { expect } from "chai";
import { ethers } from "hardhat";

describe("ElectionFactory", () => {
  it("deploys clones with correct owner and indexes by owner", async () => {
    const [owner, other] = await ethers.getSigners();
    const Election = await ethers.getContractFactory("Election");
    const impl = await Election.deploy();
    await impl.waitForDeployment();
    const Factory = await ethers.getContractFactory("ElectionFactory");
    const f = await Factory.deploy(await impl.getAddress());
    await f.waitForDeployment();

    const zero = "0x0000000000000000000000000000000000000000000000000000000000000000";
    await (await f.createElection("E1", "d", zero, "/census/1.json")).wait();
    await (await f.connect(other).createElection("E2", "d", zero, "/census/2.json")).wait();

    expect(await f.electionCount()).to.equal(2);
    const mine = await f.getElectionsByOwner(owner.address);
    expect(mine.length).to.equal(1);
    const el = Election.attach(mine[0]);
    expect(await el.owner()).to.equal(owner.address);
  });
});
