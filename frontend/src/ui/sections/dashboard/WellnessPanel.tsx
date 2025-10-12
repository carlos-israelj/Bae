"use client";

import type { WellnessPanelProps } from "@models/reading";

export default function WellnessPanel({ latestReading }: WellnessPanelProps) {
  if (!latestReading)
    return (
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6 sm:p-8 text-center mx-auto w-full max-w-sm sm:max-w-none">
        <p className="text-gray-500 text-sm">Cargando datos...</p>
      </div>
    );

  const temp = latestReading.temperature;
  let status = "Confort";
  let bgColor = "#E7F5EF"; // verde claro
  let emoji = "😊";

  if (temp < 18) {
    status = "Frío";
    bgColor = "#E3F6FB"; // azul pastel
    emoji = "🥶";
  } else if (temp > 28) {
    status = "Calor";
    bgColor = "#FFF7D6"; // amarillo pastel
    emoji = "😓";
  }

  return (
    <div
      className="lg:col-span-3 rounded-2xl shadow-sm border border-[#E8E8E8] p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 mx-auto w-full max-w-sm sm:max-w-none"
      style={{ backgroundColor: bgColor }}
    >
      {/* 🔸 Temperatura */}
      <p className="text-base sm:text-lg md:text-xl text-[#4B4B4B] mb-1">
        Temperatura corporal actual:
      </p>
      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#4B4B4B]">
        {temp.toFixed(2)}°C
      </p>

      {/* 🔸 Estado / Emoji */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span className="text-3xl">{emoji}</span>
        <span className="text-lg font-semibold text-[#4B4B4B]">{status}</span>
      </div>

      {/* 🔹 Línea decorativa */}
      <div className="w-16 h-[3px] bg-[#C6E2E3] mt-5 rounded-full opacity-70"></div>
    </div>
  );
}
