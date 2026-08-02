import type {
  FrozenPrediction,
  HistoricalReport,
  HistoricalReportAuditResults,
  HistoricalReportPoint,
} from "@sismo/contracts";
import historicalResultsJson from "../../../data/audits/historical-report-results.json";
import historicalReportsJson from "../../../data/predictions/historical-reports.json";

function isHistoricalReport(value: unknown): value is HistoricalReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<HistoricalReport>;
  return (
    Number.isInteger(report.reportNumber) &&
    typeof report.origin === "string" &&
    typeof report.originMagnitude === "number" &&
    typeof report.startDate === "string" &&
    typeof report.deadlineEndLima === "string" &&
    !Number.isNaN(Date.parse(report.deadlineEndLima)) &&
    Array.isArray(report.points) &&
    report.points.length === 4
  );
}

export function parseHistoricalReports(jsonText: string): HistoricalReport[] {
  const parsed: unknown = JSON.parse(jsonText);
  if (!Array.isArray(parsed) || !parsed.every(isHistoricalReport)) {
    throw new Error(
      "El registro de informes históricos no tiene el formato esperado",
    );
  }
  const numbers = new Set(parsed.map((report) => report.reportNumber));
  if (numbers.size !== parsed.length) {
    throw new Error(
      "El registro de informes históricos contiene números duplicados",
    );
  }
  return parsed.toSorted((a, b) => a.reportNumber - b.reportNumber);
}

let reportCache: HistoricalReport[] | null = null;

export async function loadHistoricalReportRegistry(): Promise<
  HistoricalReport[]
> {
  if (!reportCache) {
    reportCache = parseHistoricalReports(JSON.stringify(historicalReportsJson));
  }
  return reportCache;
}

export async function getHistoricalReport(
  reportNumber: number,
): Promise<HistoricalReport | null> {
  const reports = await loadHistoricalReportRegistry();
  return reports.find((report) => report.reportNumber === reportNumber) ?? null;
}

export function historicalPointToPrediction(
  report: HistoricalReport,
  point: HistoricalReportPoint,
): FrozenPrediction {
  return {
    predictionId: `R${report.reportNumber}-P${point.pointNumber}`,
    origin: report.origin,
    originMagnitude: report.originMagnitude,
    targetRegions: point.targetRegions,
    predictedMagnitudeMin: report.predictedMagnitudeMin,
    predictedMagnitudeMax: report.predictedMagnitudeMax,
    maxDays: report.maxDays,
    startDate: report.startDate,
    deadlineEndLima: report.deadlineEndLima,
  };
}

export async function loadHistoricalReportAuditResults(): Promise<HistoricalReportAuditResults> {
  return historicalResultsJson as unknown as HistoricalReportAuditResults;
}
