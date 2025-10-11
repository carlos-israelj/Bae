"use client";

import { useEffect, useState } from "react";

export default function BlockchainPanel() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contractAddress =
    "0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217";

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://blockscout-passet-hub.parity-testnet.parity.io/api/v2/addresses/${contractAddress}/transactions`
        );
        if (!res.ok) throw new Error("Error en la API");
        const data = await res.json();
        setTxs(data.items || []); // Blockscout devuelve { items: [...] }
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
    <div className="lg:col-span-3 bg-surface rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold mb-2 text-[#4B4B4B]">
        Transacciones del contrato
      </h3>

      {loading && <p className="text-gray-500">Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {txs.map((tx) => (
            <li key={tx.hash}>
              <a
                href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {tx.hash}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <a
          href={`https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}?tab=txs`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-violet-600 text-gray-100 font-semibold px-4 py-2 rounded hover:bg-violet-700 transition"
        >
          Ver todas en Blockscout
        </a>
      </div>
    </div>
  );
}
