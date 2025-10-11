"use client";

import TemperatureChart from "./charts/TemperatureChart";
import HumidityChart from "./charts/HumidityChart";
import CombinedChart from "./charts/CombinedChart";

export default function MetricsGrid({ readings }) {
  return (
    <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <TemperatureChart readings={readings} />
      <HumidityChart readings={readings} />
      <CombinedChart readings={readings} />
    </div>
  );
}
