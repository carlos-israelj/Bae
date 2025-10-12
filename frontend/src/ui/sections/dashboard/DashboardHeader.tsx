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
    <div className="lg:col-span-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6 text-center sm:text-left gap-4 sm:gap-0">
      {/* 🧸 Título principal */}
      <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B4B4B] tracking-tight w-full sm:w-auto">
        Panel de bienestar
      </h1>

      {/* 🧾 Estado y conexión */}
      <div className="flex flex-col items-center sm:items-end text-sm space-y-1 w-full sm:w-auto">
        {isConnected ? (
          <>
            <span className="font-semibold text-[#4B4B4B] text-base">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>

            {latestReading && (
              <span className="text-xs text-gray-600">
                Última lectura:{" "}
                {new Date(latestReading.timestampDate).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}

            <a
              href="https://blockscout-passet-hub.parity-testnet.parity.io/address/0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217?tab=txs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 bg-[#C6E2E3] text-[#4B4B4B] font-semibold px-4 py-1.5 rounded-full hover:bg-[#B6D7D8] transition-all duration-200 text-xs shadow-sm"
            >
              Ver transacciones
            </a>
          </>
        ) : (
          <span className="text-gray-500 italic">No wallet connected</span>
        )}
      </div>
    </div>
  );
}
