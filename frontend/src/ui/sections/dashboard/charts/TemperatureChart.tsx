"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  type ChartOptions,
} from "chart.js";
import type { MetricsGridProps } from "@models/reading"; // ✅ Importa el tipo global

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);

export default function TemperatureChart({ readings }: MetricsGridProps) {
  const labels = readings.map((r) =>
    new Date(r.timestampDate).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Temperatura corporal (°C)",
        data: readings.map((r) => r.temperature),
        borderColor: "#FF9689",
        backgroundColor: "rgba(255,150,137,0.2)",
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: "Temperatura corporal vs tiempo" },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: "°C" },
      },
      x: {
        title: { display: true, text: "Tiempo" },
      },
    },
  };

  return (
    <div className="bg-[#FFF8EA] p-4 rounded-xl shadow-md">
      <Line data={data} options={options} />
    </div>
  );
}
