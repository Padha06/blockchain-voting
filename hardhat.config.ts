import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import * as dotenv from "dotenv";
dotenv.config();

const DEPLOYER_KEY =
  process.env.DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // hardhat #0

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    // Zero-gas chain: base fee starts at 0 and automine keeps empty blocks at 0,
    // so voters with unfunded burner wallets can still transact (gasPrice 0).
    hardhat: { chainId: 31337, gasPrice: 0, initialBaseFeePerGas: 0 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    // Zero-gas college app-chain (Geth Clique, gasPrice 0). Same key format.
    appchain: {
      url: process.env.APPCHAIN_RPC_URL ?? "http://127.0.0.1:8545",
      chainId: Number(process.env.APPCHAIN_CHAIN_ID ?? 20260),
      accounts: [DEPLOYER_KEY],
      gasPrice: 0,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
