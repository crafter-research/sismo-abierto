#!/usr/bin/env bun
import {
  buildProbeConfigs,
  getDefaultStore,
  runSourceChecks,
} from "../packages/source-health/src/index.ts";

const store = getDefaultStore();
const checks = await runSourceChecks(store, buildProbeConfigs());

const EXPECTED_UNKNOWN = new Set(["igp-wfs-volcanes"]);
let broken = 0;
let degraded = 0;

console.log(`${"Fuente".padEnd(26)}${"Estado".padEnd(19)}Evidencia`);
console.log("-".repeat(90));
for (const check of checks) {
  console.log(
    check.sourceId.padEnd(26) + check.status.padEnd(19) + check.evidence,
  );
  if (check.status === "UNAVAILABLE" || check.status === "SCHEMA_CHANGED") {
    broken++;
  } else if (check.status === "DEGRADED") {
    degraded++;
  } else if (
    check.status === "FRESHNESS_UNKNOWN" &&
    !EXPECTED_UNKNOWN.has(check.sourceId)
  ) {
    degraded++;
  }
}

console.log("-".repeat(90));
if (broken > 0) {
  console.error(
    `${broken} fuente(s) con contrato roto o inaccesible. Revisa la evidencia de arriba.`,
  );
  process.exit(1);
}
if (degraded > 0) {
  console.warn(`${degraded} fuente(s) degradada(s). Sin ruptura de contrato.`);
}
console.log("Contratos externos OK.");
