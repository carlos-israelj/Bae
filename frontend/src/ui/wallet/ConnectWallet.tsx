"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectWallet() {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, status, address } = useAccount();
  const { disconnect } = useDisconnect();

  // 🔁 Redirección dinámica según conexión
  useEffect(() => {
    if (status === "connected" && isConnected && address) {
      console.log("✅ Wallet conectada:", address);
      if (pathname !== "/test") router.push("/test");
    } else if (status === "disconnected" && pathname === "/test") {
      console.log("🚪 Wallet desconectada, redirigiendo al home");
      router.push("/");
    }
  }, [status, isConnected, address, pathname, router]);

  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className="bg-[#9FC0AF] text-black px-4 py-2 rounded font-semibold hover:opacity-90 transition w-full md:w-auto"
            >
              Login Web3
            </button>
          );
        }

        return (
          <button
            onClick={disconnect}
            className="bg-[#FF9689] text-white px-4 py-2 rounded font-semibold hover:bg-[#ff7f70] transition w-full md:w-auto"
            title="Click to disconnect wallet"
          >
            {account.displayName} · Disconnect
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
