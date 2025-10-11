import { Chain } from "viem/chains";

// 🧠 Definimos la red Paseo Testnet (EVM compatible)
export const paseoTestnet: Chain = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 3338,
  name: process.env.NEXT_PUBLIC_NETWORK_NAME || "Paseo Testnet",
  nativeCurrency: { name: "PASEO", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://testnet-passet-hub-eth-rpc.polkadot.io",
      ],
    },
  },
  testnet: true,
};
