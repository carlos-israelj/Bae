"use client";

export default function WellnessPanel({ latestReading }) {
  if (!latestReading)
    return (
      <div className="lg:col-span-3 bg-surface rounded-xl shadow-md p-6 text-center">
        <p className="text-gray-500">Cargando datos...</p>
      </div>
    );

  const temp = latestReading.temperature;
  let status = "Confort";
  let bgColor = "#9FC0AF";
  let emoji = "😊";

  if (temp < 18) {
    status = "Frío";
    bgColor = "#ACDEE7";
    emoji = "🥶";
  } else if (temp > 28) {
    status = "Calor";
    bgColor = "#FFF2C3";
    emoji = "😓";
  }

  return (
    <div
      className="lg:col-span-3 rounded-xl shadow-md p-6 text-center"
      style={{ backgroundColor: bgColor }}
    >
      <h2 className="text-xl font-bold text-[#4B4B4B] mb-2">
        Panel de bienestar
      </h2>
      <p className="text-lg">
        Temperatura corporal actual:{" "}
        <span className="font-semibold">{temp.toFixed(2)}°C</span>
      </p>
      <p className="text-2xl mt-2">
        {emoji} {status}
      </p>
    </div>
  );
}
