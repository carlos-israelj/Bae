import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";
import dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.warn("⚠️  WARNING: PRIVATE_KEY not found in .env");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimizado según documentación oficial
      },
      viaIR: true,
    },
  },
  
  // Configuración del compilador PolkaVM
  resolc: {
    compilerSource: "npm", // Usa el compilador npm (más fácil)
    settings: {
      optimizer: {
        enabled: true,
        parameters: 'z', // Parámetros recomendados
        fallbackOz: true,
        runs: 200,
      },
      standardJson: true,
    },
  },
  
  networks: {
    // Red local de Hardhat con PolkaVM
    hardhat: {
      polkavm: true,
    },
    
    // Nodo local para testing
    localNode: {
      polkavm: true,
      url: "http://127.0.0.1:8545",
    },
    
    // Paseo Hub Testnet (Polkadot Hub TestNet)
    passetHubTestnet: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      chainId: 420420422,
      accounts: privateKey ? [privateKey] : [],
    },
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache-pvm",
    artifacts: "./artifacts-pvm",
  },
};

export default config;