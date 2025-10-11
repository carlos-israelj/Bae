import withRspack from "next-rspack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,

  webpack: (config) => {
    config.ignoreWarnings = [
      /pino-pretty/,
      /supportsColor/,
      /debug/,
      /metamask-sdk/,
      /rainbowkit/,
      /wagmi/,
      /Rspack/,
    ];
    return config;
  },
};

export default withRspack(nextConfig);
