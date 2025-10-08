import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.warn("⚠️  WARNING: PRIVATE_KEY not found");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
    },
  },
  networks: {
    passetHubTestnet: {
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      chainId: 420420422,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
