import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set turbopack root to avoid inference issues
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
  // Reduce memory pressure
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
