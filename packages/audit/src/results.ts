import type { PredictionAudit } from "@sismo/contracts";
import currentResultsJson from "../../../data/audits/audit-results.json";

export interface PredictionAuditResults {
  runAt: string;
  audits: PredictionAudit[];
}

export async function loadPredictionAuditResults(): Promise<PredictionAuditResults> {
  return currentResultsJson as unknown as PredictionAuditResults;
}
