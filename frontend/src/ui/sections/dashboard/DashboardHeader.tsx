"use client";

import { useAccount } from "wagmi";

interface DashboardHeaderProps {
  latestReading?: {
    timestampDate: string | number | Date;
  };
}

export default function DashboardHeader({ latestReading }: DashboardHeaderProps) {
  const { address, isConnected } = useAccount();

  return (
    <div className="lg:col-span-3 flex flex-wrap items-center justify-between bg-[#C6E2E3] p-4 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-[#4B4B4B]">BAE Dashboard</h1>

      <div className="flex flex-col items-end text-sm space-y-1">
        {isConnected ? (
          <>
            <span className="font-semibold text-[#4B4B4B]">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>

            {latestReading && (
              <span className="text-xs text-gray-600">
                Última lectura:{" "}
                {new Date(latestReading.timestampDate).toLocaleString()}
              </span>
            )}

            <a
              href="https://blockscout-passet-hub.parity-testnet.parity.io/address/0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217?tab=txs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 bg-blue-600 text-gray-100 font-semibold px-3 py-1 rounded hover:bg-blue-700 transition text-xs"
            >
              Ver transacciones en Blockscout
            </a>
          </>
        ) : (
          <span className="text-gray-500">No wallet connected</span>
        )}
      </div>
    </div>
  );
}
