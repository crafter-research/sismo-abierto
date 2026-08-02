import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/verifica": ["../../data/predictions/**"],
    "/verifica/[predictionId]": ["../../data/predictions/**"],
    "/verifica/informes/[reportNumber]": ["../../data/predictions/**"],
    "/verifica/panoramas/[slug]": ["../../data/predictions/**"],
  },
  transpilePackages: [
    "@sismo/aula-content",
    "@sismo/contracts",
    "@sismo/data",
    "@sismo/geo",
    "@sismo/waveforms",
    "@sismo/audit",
    "@sismo/volcanoes",
    "@sismo/source-health",
  ],
};

export default nextConfig;
