"use client";

import SectionContainer from "@layouts/section-container/SectionContainer";
import DashboardHeader from "@sections/dashboard/DashboardHeader";
import WellnessPanel from "@sections/dashboard/WellnessPanel";
import MetricsGrid from "@sections/dashboard/MetricsGrid";
import BlockchainPanel from "@sections/dashboard/BlockchainPanel";
import { useEffect, useState } from "react";

export default function TestPage() {
  const [readings, setReadings] = useState([]);
  const [latestReading, setLatestReading] = useState(null);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/readings/history`,
        );
        const data = await res.json();
        setReadings(data.readings || []);
        setLatestReading(data.readings?.[0] || null);
      } catch (err) {
        console.error("Error fetching readings:", err);
      }
    };
    fetchReadings();
  }, []);

  return (
    <SectionContainer className="min-h-screen py-10 px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#FFF8EA]">
      <DashboardHeader latestReading={latestReading} />
      <WellnessPanel latestReading={latestReading} />
      <MetricsGrid readings={readings} />
      <BlockchainPanel />
    </SectionContainer>
  );
}
