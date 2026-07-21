import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { evaluatePrediction } from "./evaluator.ts";
import { loadPredictionRegistry } from "./registry.ts";

const AUDITS_DIR = new URL("../../../data/audits/", import.meta.url).pathname;

export async function runAudit(nowUtcMs = Date.now()): Promise<void> {
  await mkdir(AUDITS_DIR, { recursive: true });
  const registry = await loadPredictionRegistry();
  const audits = [];
  for (const prediction of registry) {
    const audit = await evaluatePrediction(prediction, nowUtcMs);
    audits.push(audit);
    await appendFile(
      `${AUDITS_DIR}ledger.jsonl`,
      `${JSON.stringify({ runAt: new Date(nowUtcMs).toISOString(), predictionId: audit.predictionId, verdict: audit.verdict, evidence: audit.evidence })}\n`,
    );
    console.log(`${audit.predictionId}: ${audit.verdict}`);
  }
  await writeFile(
    `${AUDITS_DIR}audit-results.json`,
    JSON.stringify(
      { runAt: new Date(nowUtcMs).toISOString(), audits },
      null,
      2,
    ),
  );
  console.log(`Resultados en ${AUDITS_DIR}audit-results.json`);
}

if (import.meta.main) {
  await runAudit();
}
