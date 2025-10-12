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

export default function CombinedChart({ readings }: MetricsGridProps) {
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
        label: "Temperatura (°C)",
        data: readings.map((r) => r.temperature),
        borderColor: "#FF9689",
        backgroundColor: "rgba(255,150,137,0.1)",
        tension: 0.4,
        pointRadius: 2,
        yAxisID: "y1",
      },
      {
        label: "Humedad (%)",
        data: readings.map((r) => r.humidity),
        borderColor: "#ACDEE7",
        backgroundColor: "rgba(172,222,231,0.1)",
        tension: 0.4,
        pointRadius: 2,
        yAxisID: "y2",
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true },
      title: { display: true, text: "Temperatura y Humedad (comparativo)" },
    },
    scales: {
      y1: {
        type: "linear",
        position: "left",
        stacked: false,
        title: { display: true, text: "°C" },
      },
      y2: {
        type: "linear",
        position: "right",
        stacked: false,
        title: { display: true, text: "%" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="w-full h-[200px] sm:h-[220px] md:h-[240px] lg:h-[260px] flex items-center justify-center">
      <Line data={data} options={options} />
    </div>
  );
}
