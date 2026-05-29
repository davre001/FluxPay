import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const COORDINATOR_PRIVATE_KEY = process.env.COORDINATOR_PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Morph Holesky Testnet — deploy here first
    morph_holesky: {
      url: "https://rpc-holesky.morphl2.io",
      chainId: 2810,
      accounts: COORDINATOR_PRIVATE_KEY ? [COORDINATOR_PRIVATE_KEY] : [],
    },
    // Morph Mainnet — only after testnet validation
    morph_mainnet: {
      url: "https://rpc.morphl2.io",
      chainId: 2818,
      accounts: COORDINATOR_PRIVATE_KEY ? [COORDINATOR_PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./src",
    tests:   "./test",
    cache:   "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
