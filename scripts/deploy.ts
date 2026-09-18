import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Election = await ethers.getContractFactory("Election");
  const implementation = await Election.deploy();
  await implementation.waitForDeployment();
  const implAddr = await implementation.getAddress();
  console.log("Election implementation:", implAddr);

  const Factory = await ethers.getContractFactory("ElectionFactory");
  const factory = await Factory.deploy(implAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("ElectionFactory:", factoryAddr);

  const network = await ethers.provider.getNetwork();
  const out = {
    chainId: Number(network.chainId),
    implementation: implAddr,
    factory: factoryAddr,
    deployer: deployer.address,
    explorer: process.env.EXPLORER_URL ?? "http://127.0.0.1:4000",
  };
  fs.writeFileSync("deployment.json", JSON.stringify(out, null, 2));
  fs.writeFileSync("web/.env.local.appchain", `NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddr}\nNEXT_PUBLIC_RPC_URL=${process.env.APPCHAIN_RPC_URL ?? "http://127.0.0.1:8545"}\nNEXT_PUBLIC_CHAIN_ID=${Number(network.chainId)}\nNEXT_PUBLIC_EXPLORER_URL=${out.explorer}\n`);
  console.log("Wrote deployment.json + web/.env.local.appchain");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
