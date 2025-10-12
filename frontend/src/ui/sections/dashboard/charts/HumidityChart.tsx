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
import type { MetricsGridProps } from "@models/reading";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);

export default function HumidityChart({ readings }: MetricsGridProps) {
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
        label: "Humedad ambiental (%)",
        data: readings.map((r) => r.humidity),
        borderColor: "#9FC0AF",
        backgroundColor: "rgba(159,192,175,0.2)",
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: "Humedad ambiental vs tiempo" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "%" },
      },
      x: {
        title: { display: true, text: "Tiempo" },
      },
    },
  };

  return (
    <div className="w-full h-[200px] sm:h-[220px] md:h-[240px] lg:h-[260px] flex items-center justify-center">
      <Line data={data} options={options} />
    </div>
  );
}
