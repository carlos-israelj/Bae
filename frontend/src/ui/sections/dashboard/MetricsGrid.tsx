"use client";

import TemperatureChart from "./charts/TemperatureChart";
import HumidityChart from "./charts/HumidityChart";
import CombinedChart from "./charts/CombinedChart";
import type { Reading } from "@models/reading";

interface MetricsGridProps {
  readings: Reading[];
}

export default function MetricsGrid({ readings }: MetricsGridProps) {
  return (
    <div
      className="
        lg:col-span-3
        grid 
        grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-3 
        gap-6
        mt-4
      "
    >
      {/* 🔹 Tarjeta Temperatura */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-5 flex flex-col items-center justify-center min-h-[250px] hover:shadow-md transition-shadow duration-300">
        <TemperatureChart readings={readings} />
      </div>

      {/* 🔹 Tarjeta Humedad */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-5 flex flex-col items-center justify-center min-h-[250px] hover:shadow-md transition-shadow duration-300">
        <HumidityChart readings={readings} />
      </div>

      {/* 🔹 Tarjeta Combinada */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-5 flex flex-col items-center justify-center min-h-[250px] hover:shadow-md transition-shadow duration-300">
        <CombinedChart readings={readings} />
      </div>
    </div>
  );
}
