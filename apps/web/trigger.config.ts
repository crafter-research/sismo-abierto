import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_sismo_abierto_placeholder",
  dirs: ["./trigger"],
  runtime: "node",
  maxDuration: 300,
});
