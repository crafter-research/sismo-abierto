import type { SourceStatus } from "@sismo/contracts";

export interface ProbeObservation {
  sourceId: string;
  checkedAt: string;
  httpStatus: number | null;
  durationMs: number;
  contentType: string | null;
  responded: boolean;
  schemaValid: boolean | null;
  recordCount: number | null;
  freshnessKnown: boolean;
  latencyDegradedMs: number;
  errorKind: string | null;
  evidence: string;
}

export function deriveConsumerStatus(
  observation: ProbeObservation,
): SourceStatus {
  if (!observation.responded || (observation.httpStatus ?? 0) >= 400) {
    return "UNAVAILABLE";
  }
  if (observation.schemaValid === false) {
    return "SCHEMA_CHANGED";
  }
  if (
    observation.durationMs > observation.latencyDegradedMs ||
    observation.recordCount === 0
  ) {
    return "DEGRADED";
  }
  if (!observation.freshnessKnown) {
    return "FRESHNESS_UNKNOWN";
  }
  return "OPERATIONAL";
}

export const SOURCE_HEALTH_DISCLAIMER =
  "Describe lo observado por el consumidor de este proyecto sobre fuentes públicas. No representa el estado interno ni una alerta del IGP.";
