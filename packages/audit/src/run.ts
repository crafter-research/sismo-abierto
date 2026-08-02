import { appendFile, mkdir, writeFile } from "node:fs/promises";
import type { PredictionAudit, PredictionVerdict } from "@sismo/contracts";
import { evaluatePrediction } from "./evaluator.ts";
import { loadPredictionRegistry } from "./registry.ts";

const AUDITS_DIR = new URL("../../../data/audits/", import.meta.url).pathname;
const VERDICTS: PredictionVerdict[] = [
  "STRICT_HIT",
  "NO_MATCH",
  "AMBIGUOUS_GEOGRAPHY",
  "SOURCE_DISAGREEMENT",
  "PENDING",
];

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function assertAllWindowsClosed(audits: PredictionAudit[]): void {
  const pending = audits
    .filter((audit) => audit.verdict === "PENDING")
    .map((audit) => audit.predictionId);
  if (pending.length > 0) {
    throw new Error(
      `La auditoría final se rehúsa a publicar ventanas abiertas: ${pending.join(", ")}`,
    );
  }
}

export function renderAuditCsv(
  runAt: string,
  audits: PredictionAudit[],
): string {
  const header = [
    "run_at",
    "prediction_id",
    "verdict",
    "evaluated_at",
    "window_start_lima",
    "window_end_lima",
    "candidate_count",
    "baseline_matching_event_count",
    "baseline_probability_at_least_one",
  ];
  const rows = audits.map((audit) =>
    [
      runAt,
      audit.predictionId,
      audit.verdict,
      audit.evaluatedAt,
      audit.windowStartLima,
      audit.windowEndLima,
      audit.candidates.length,
      audit.baseline?.matchingEventCount ?? null,
      audit.baseline?.probabilityAtLeastOne ?? null,
    ]
      .map(csvCell)
      .join(","),
  );
  return `${header.join(",")}\n${rows.join("\n")}\n`;
}

function evidenceLine(entry: PredictionAudit["evidence"][number]): string {
  const action = entry.url ? `[${entry.action}](${entry.url})` : entry.action;
  return `- ${action}: ${entry.detail}`;
}

export function renderAuditLog(
  runAt: string,
  audits: PredictionAudit[],
): string {
  const sections = audits.map((audit) => {
    const candidates =
      audit.candidates.length === 0
        ? "- Ningún evento candidato."
        : audit.candidates
            .map(
              (candidate) =>
                `- ${candidate.eventTimeUtc} · M${candidate.magnitude} · ${candidate.place} · ${candidate.matchedRegion} · ${candidate.sourceId}`,
            )
            .join("\n");
    const evidence = audit.evidence.map(evidenceLine).join("\n");
    return `## ${audit.predictionId} · ${audit.verdict}\n\n### Candidatos\n\n${candidates}\n\n### Evidencia\n\n${evidence || "- Sin evidencia registrada."}`;
  });
  return `# Log de auditoría\n\nCorrida UTC: \`${runAt}\`\n\n${sections.join("\n\n")}\n`;
}

export function renderFinalAudit(
  runAt: string,
  audits: PredictionAudit[],
): string {
  const counts = Object.fromEntries(
    VERDICTS.map((verdict) => [
      verdict,
      audits.filter((audit) => audit.verdict === verdict).length,
    ]),
  ) as Record<PredictionVerdict, number>;
  const summaryRows = VERDICTS.filter((verdict) => counts[verdict] > 0).map(
    (verdict) => `| ${verdict} | ${counts[verdict]} |`,
  );
  const results = audits.map((audit) => {
    const baseline = audit.baseline
      ? `${(audit.baseline.probabilityAtLeastOne * 100).toFixed(1)}% de probabilidad base de al menos un evento en ${audit.baseline.windowDays} días, estimada con ${audit.baseline.matchingEventCount} eventos en los 365 días previos.`
      : "Tasa base no disponible para una geografía inequívoca.";
    return `### ${audit.predictionId} · ${audit.verdict}\n\n- Candidatos: ${audit.candidates.length}\n- Ventana: ${audit.windowStartLima} a ${audit.windowEndLima}\n- Control contra azar: ${baseline}`;
  });
  return `# Auditoría final de predicciones sísmicas\n\nCorrida UTC: \`${runAt}\`\n\nEste informe aplica el protocolo congelado antes de conocer los resultados. Evalúa esta tanda de afirmaciones y no valida ni refuta por sí solo una teoría o capacidad predictiva.\n\n## Resumen\n\n| Veredicto | Cantidad |\n| --- | ---: |\n${summaryRows.join("\n")}\n\n## Resultados\n\n${results.join("\n\n")}\n\n## Interpretación\n\nUn \`STRICT_HIT\` describe una coincidencia con los criterios publicados. No demuestra capacidad predictiva, especialmente cuando la tasa base de al menos un evento en la ventana es alta. Los casos ambiguos y los desacuerdos entre fuentes se conservan como categorías separadas.\n`;
}

export async function runAudit(nowUtcMs = Date.now()): Promise<void> {
  const registry = await loadPredictionRegistry();
  const audits = [];
  for (const prediction of registry) {
    const audit = await evaluatePrediction(prediction, nowUtcMs);
    audits.push(audit);
    console.log(`${audit.predictionId}: ${audit.verdict}`);
  }
  assertAllWindowsClosed(audits);

  const runAt = new Date(nowUtcMs).toISOString();
  await mkdir(AUDITS_DIR, { recursive: true });
  for (const audit of audits) {
    await appendFile(
      `${AUDITS_DIR}ledger.jsonl`,
      `${JSON.stringify({ runAt, predictionId: audit.predictionId, verdict: audit.verdict, evidence: audit.evidence })}\n`,
    );
  }
  await writeFile(
    `${AUDITS_DIR}audit-results.json`,
    JSON.stringify({ runAt, audits }, null, 2),
  );
  await writeFile(
    `${AUDITS_DIR}audit-results.csv`,
    renderAuditCsv(runAt, audits),
  );
  await writeFile(`${AUDITS_DIR}audit-log.md`, renderAuditLog(runAt, audits));
  await writeFile(
    `${AUDITS_DIR}final-audit.md`,
    renderFinalAudit(runAt, audits),
  );
  console.log(`Resultados en ${AUDITS_DIR}`);
}

if (import.meta.main) {
  await runAudit();
}
