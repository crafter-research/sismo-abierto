import { mkdir, writeFile } from "node:fs/promises";
import type {
  HistoricalReportAudit,
  HistoricalReportAuditResults,
} from "@sismo/contracts";
import { evaluatePrediction } from "./evaluator.ts";
import {
  historicalPointToPrediction,
  loadHistoricalReportRegistry,
} from "./historical-reports.ts";
import { MATCH_OUTCOME_LABELS } from "./interpretation.ts";

const AUDITS_DIR = new URL("../../../data/audits/", import.meta.url).pathname;

function renderMarkdown(results: HistoricalReportAuditResults): string {
  const sections = results.reports.map(({ report, points }) => {
    const rows = points.map(({ point, audit }) => {
      const baseline = audit.baseline
        ? `${(audit.baseline.probabilityAtLeastOne * 100).toFixed(1)}%`
        : "No disponible";
      const candidates = audit.candidates
        .map(
          (candidate) =>
            `${candidate.eventTimeUtc} M${candidate.magnitude} ${candidate.place}`,
        )
        .join("; ");
      return `| ${point.pointNumber} | ${point.claimedProbability}% | ${MATCH_OUTCOME_LABELS[audit.interpretation.matchOutcome]} | ${baseline} | ${candidates || "Ninguno"} |`;
    });
    return `## Informe ${report.reportNumber}\n\n- Origen declarado: ${report.origin} M${report.originMagnitude}\n- Ventana: ${report.startDate} a ${report.deadlineEndLima}\n- Evidencia fuente: ${report.sourceEvidence}\n\n| Punto | Porcentaje declarado | Resultado | Tasa base | Candidatos |\n| ---: | ---: | --- | ---: | --- |\n${rows.join("\n")}`;
  });
  return `# Auditoría retrospectiva de informes históricos\n\nCorrida UTC: \`${results.runAt}\`\n\nEstos informes se incorporaron retrospectivamente el 2026-08-02 desde capturas aportadas por el usuario. No constituyen un registro preinscrito antes de los resultados. Una coincidencia literal no establece capacidad predictiva y los porcentajes declarados no se interpretan como probabilidades calibradas.\n\n${sections.join("\n\n")}\n`;
}

export async function runHistoricalReportAudit(
  nowUtcMs = Date.now(),
): Promise<HistoricalReportAuditResults> {
  const reports = await loadHistoricalReportRegistry();
  const auditedReports: HistoricalReportAudit[] = [];

  for (const report of reports) {
    const points = [];
    for (const point of report.points) {
      const prediction = historicalPointToPrediction(report, point);
      const audit = await evaluatePrediction(prediction, nowUtcMs);
      points.push({ point, prediction, audit });
      console.log(
        `Informe ${report.reportNumber} · Punto ${point.pointNumber}: ${audit.interpretation.matchOutcome}`,
      );
    }
    auditedReports.push({ report, points });
  }

  const results: HistoricalReportAuditResults = {
    runAt: new Date(nowUtcMs).toISOString(),
    reports: auditedReports,
  };
  await mkdir(AUDITS_DIR, { recursive: true });
  await writeFile(
    `${AUDITS_DIR}historical-report-results.json`,
    JSON.stringify(results, null, 2),
  );
  await writeFile(
    `${AUDITS_DIR}historical-report-results.md`,
    renderMarkdown(results),
  );
  return results;
}

if (import.meta.main) {
  await runHistoricalReportAudit();
}
