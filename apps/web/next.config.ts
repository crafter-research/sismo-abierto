import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/verifica": ["../../data/predictions/**"],
    "/verifica/[predictionId]": ["../../data/predictions/**"],
  },
  transpilePackages: [
    "@sismo/aula-content",
    "@sismo/contracts",
    "@sismo/data",
    "@sismo/waveforms",
    "@sismo/audit",
    "@sismo/volcanoes",
    "@sismo/source-health",
  ],
};

export default nextConfig;
