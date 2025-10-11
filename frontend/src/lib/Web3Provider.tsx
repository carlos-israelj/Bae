"use client";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "wagmi";
import { paseoTestnet } from "@lib/wagmi";

const config = getDefaultConfig({
  appName: "BAE IoT DApp",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [paseoTestnet],
  transports: {
    [paseoTestnet.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL ||
        "https://testnet-passet-hub-eth-rpc.polkadot.io",
    ),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
