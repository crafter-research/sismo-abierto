import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
