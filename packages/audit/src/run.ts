import { appendFile, mkdir, writeFile } from "node:fs/promises";
import type { PredictionAudit, PredictionVerdict } from "@sismo/contracts";
import { evaluatePrediction } from "./evaluator.ts";
import {
  BASELINE_BAND_LABELS,
  MATCH_OUTCOME_LABELS,
} from "./interpretation.ts";
import { loadPanoramaReportRegistry } from "./panoramas.ts";

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
    "match_outcome",
    "baseline_band",
    "predictive_evidence",
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
      audit.interpretation.matchOutcome,
      audit.interpretation.baselineBand,
      audit.interpretation.predictiveEvidence,
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
    const probability =
      audit.interpretation.baselineProbability === null
        ? "no disponible"
        : `${(audit.interpretation.baselineProbability * 100).toFixed(1)}%`;
    return `## ${audit.predictionId} · ${MATCH_OUTCOME_LABELS[audit.interpretation.matchOutcome]}\n\n- Veredicto del protocolo congelado: \`${audit.verdict}\`\n- Tasa base: ${probability} · ${BASELINE_BAND_LABELS[audit.interpretation.baselineBand]}\n- Capacidad predictiva: no establecida\n\n### Candidatos\n\n${candidates}\n\n### Evidencia\n\n${evidence || "- Sin evidencia registrada."}`;
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
  const summaryRows = VERDICTS.map(
    (verdict) => `| ${verdict} | ${counts[verdict]} |`,
  );
  const strictMatchRows = audits
    .filter((audit) => audit.interpretation.matchOutcome === "STRICT_MATCH")
    .map((audit) => {
      const probability =
        audit.interpretation.baselineProbability === null
          ? "No disponible"
          : `${(audit.interpretation.baselineProbability * 100).toFixed(1)}%`;
      return `| ${audit.predictionId} | ${probability} | ${BASELINE_BAND_LABELS[audit.interpretation.baselineBand]} | No establecida |`;
    });
  const results = audits.map((audit) => {
    const baseline = audit.baseline
      ? `${(audit.baseline.probabilityAtLeastOne * 100).toFixed(1)}% de probabilidad base de al menos un evento en ${audit.baseline.windowDays} días, estimada con ${audit.baseline.matchingEventCount} eventos en los 365 días previos.`
      : "Tasa base no disponible para una geografía inequívoca.";
    const candidates =
      audit.candidates.length === 0
        ? "- Ningún evento candidato."
        : audit.candidates
            .map(
              (candidate) =>
                `- ${candidate.eventTimeUtc} · M${candidate.magnitude} · ${candidate.place} · ${candidate.matchedRegion} · ${candidate.sourceId}`,
            )
            .join("\n");
    const ambiguousRegions =
      audit.ambiguousRegions.length === 0
        ? "Ninguna."
        : audit.ambiguousRegions.join("; ");
    return `### ${audit.predictionId} · ${MATCH_OUTCOME_LABELS[audit.interpretation.matchOutcome]}\n\n- Veredicto del protocolo congelado: \`${audit.verdict}\`\n- Ventana: ${audit.windowStartLima} a ${audit.windowEndLima}\n- Geografías ambiguas conservadas: ${ambiguousRegions}\n- Control contra azar: ${baseline}\n- Lectura descriptiva: ${BASELINE_BAND_LABELS[audit.interpretation.baselineBand]}.\n- Capacidad predictiva: no establecida.\n\n#### Candidatos (${audit.candidates.length})\n\n${candidates}`;
  });
  return `# Auditoría de predicciones sísmicas\n\nCorte UTC: \`${runAt}\`\n\nEste informe aplica el protocolo congelado antes de conocer los resultados. Las afirmaciones provienen de sismos.en.peru, no del IGP. IGP/CENSIS y USGS se usan como fuentes de comprobación. Las ventanas abiertas permanecen pendientes hasta su deadline.\n\n## Veredictos del protocolo congelado\n\n| Veredicto | Cantidad |\n| --- | ---: |\n${summaryRows.join("\n")}\n\n## Coincidencias estrictas y tasa base\n\n| Afirmación | Probabilidad base | Lectura descriptiva | Capacidad predictiva |\n| --- | ---: | --- | --- |\n${strictMatchRows.join("\n")}\n\n## Resultados\n\n${results.join("\n\n")}\n\n## Interpretación\n\n\`STRICT_HIT\` es el nombre conservado por el protocolo congelado. La presentación pública usa “Coincidencia estricta” y \`STRICT_MATCH\` para describir una coincidencia, no un éxito predictivo. La probabilidad base se muestra siempre por separado y ninguna coincidencia aislada establece capacidad predictiva.\n`;
}

export async function runAudit(nowUtcMs = Date.now()): Promise<void> {
  const panoramas = await loadPanoramaReportRegistry();
  const registry = panoramas.flatMap((report) => report.points);
  const audits = [];
  for (let index = 0; index < registry.length; index += 3) {
    const batch = registry.slice(index, index + 3);
    const results = await Promise.all(
      batch.map((prediction) => evaluatePrediction(prediction, nowUtcMs)),
    );
    for (const audit of results) {
      audits.push(audit);
      console.log(
        `${audit.predictionId}: ${audit.interpretation.matchOutcome} (${audit.verdict})`,
      );
    }
  }

  const runAt = new Date(nowUtcMs).toISOString();
  await mkdir(AUDITS_DIR, { recursive: true });
  for (const audit of audits) {
    await appendFile(
      `${AUDITS_DIR}ledger.jsonl`,
      `${JSON.stringify({ runAt, predictionId: audit.predictionId, verdict: audit.verdict, interpretation: audit.interpretation, evidence: audit.evidence })}\n`,
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
