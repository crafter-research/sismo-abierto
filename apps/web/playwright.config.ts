import { defineConfig } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  retries: 1,
  use: {
    baseURL,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: `bun run start --port ${port}`,
    env: {
      SISMO_FUENTES_PUBLIC: "true",
      SISMO_SGC_PROVIDER: "true",
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
