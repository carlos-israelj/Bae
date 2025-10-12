"use client";

import { useEffect, useState } from "react";

export default function BlockchainPanel() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = "0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217";

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://blockscout-passet-hub.parity-testnet.parity.io/api/v2/addresses/${contractAddress}/transactions`
        );
        if (!res.ok) throw new Error("Error en la API");
        const data = await res.json();
        setTxs(data.items || []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las transacciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchTxs();
  }, [contractAddress]);

  return (
    <div className="lg:col-span-3 bg-surface rounded-2xl shadow-sm border border-[#EAEAEA] p-6 flex flex-col transition-all hover:shadow-md">
      {/* 🔸 Título actualizado */}
      <h3 className="text-lg font-bold text-[#4B4B4B] mb-3 flex items-center gap-2">
        <span className="inline-block w-3 h-3 bg-[#FF9689] rounded-full" />
        Historial IoT en Blockchain
      </h3>

      {/* Estado de carga */}
      {loading && (
        <p className="text-sm text-gray-500 text-center py-6">
          Cargando transacciones...
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2 text-center">
          {error}
        </p>
      )}

      {/* Lista de transacciones */}
      {!loading && !error && txs.length > 0 && (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C6E2E3] scrollbar-track-transparent">
          {txs.slice(0, 6).map((tx) => (
            <li
              key={tx.hash}
              className="bg-[#F9F9F9] border border-gray-100 rounded-lg px-3 py-2 hover:bg-[#FFF8EA] transition-colors duration-200"
            >
              <a
                href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4B4B4B] font-medium text-xs break-all hover:text-[#FF9689] transition"
              >
                {tx.hash}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Sin transacciones */}
      {!loading && !error && txs.length === 0 && (
        <p className="text-gray-400 text-sm text-center mt-4">
          No hay transacciones registradas.
        </p>
      )}

      {/* Botón de Blockscout visible */}
      <div className="mt-5 flex justify-end">
        <a
          href={`https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}?tab=txs`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#FF9689] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#ff8272] transition-all duration-200 shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 8.25L21 12l-3.75 3.75M3 12h18"
            />
          </svg>
          Ver todas en Blockscout
        </a>
      </div>
    </div>
  );
}
