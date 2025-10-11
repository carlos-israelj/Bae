/**
 * Represents a sensor reading obtained from an IoT device.
 * Used throughout the dashboard and analytics components.
 */
export interface Reading {
  deviceId: string;
  temperature: number;
  humidity: number;
  timestamp: number;
  timestampDate: string | Date;
  blockNumber: number;
  [key: string]: unknown;
}

/**
 * Props used by dashboard components that display
 * current readings, analytics, or charts.
 */
export interface WellnessPanelProps {
  latestReading?: Reading;
}

export interface DashboardHeaderProps {
  latestReading?: Reading;
}

export interface MetricsGridProps {
  readings: Reading[];
}

export interface BlockchainPanelProps {
  latestReading?: Reading;
}
