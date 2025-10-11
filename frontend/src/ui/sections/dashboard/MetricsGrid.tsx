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
    <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <TemperatureChart readings={readings} />
      <HumidityChart readings={readings} />
      <CombinedChart readings={readings} />
    </div>
  );
}
