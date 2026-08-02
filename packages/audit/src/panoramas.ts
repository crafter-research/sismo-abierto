import type { PanoramaReport } from "@sismo/contracts";
import panoramaReportsJson from "../../../data/predictions/panorama-reports.json";

function isPanoramaReport(value: unknown): value is PanoramaReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<PanoramaReport>;
  return (
    typeof report.slug === "string" &&
    typeof report.title === "string" &&
    typeof report.sourceUrl === "string" &&
    typeof report.sourcePublishedAtLima === "string" &&
    !Number.isNaN(Date.parse(report.sourcePublishedAtLima)) &&
    Array.isArray(report.points) &&
    report.points.length > 0
  );
}

export function parsePanoramaReports(jsonText: string): PanoramaReport[] {
  const parsed: unknown = JSON.parse(jsonText);
  if (!Array.isArray(parsed) || !parsed.every(isPanoramaReport)) {
    throw new Error("El registro de panoramas no tiene el formato esperado");
  }
  const slugs = new Set(parsed.map((report) => report.slug));
  if (slugs.size !== parsed.length) {
    throw new Error("El registro de panoramas contiene slugs duplicados");
  }
  return parsed.toSorted((a, b) => a.periodStart.localeCompare(b.periodStart));
}

let panoramaCache: PanoramaReport[] | null = null;

export async function loadPanoramaReportRegistry(): Promise<PanoramaReport[]> {
  if (!panoramaCache) {
    panoramaCache = parsePanoramaReports(JSON.stringify(panoramaReportsJson));
  }
  return panoramaCache;
}

export async function getPanoramaReport(
  slug: string,
): Promise<PanoramaReport | null> {
  const reports = await loadPanoramaReportRegistry();
  return reports.find((report) => report.slug === slug) ?? null;
}

export async function findPanoramaByPredictionId(
  predictionId: string,
): Promise<PanoramaReport | null> {
  const reports = await loadPanoramaReportRegistry();
  return (
    reports.find((report) =>
      report.points.some((point) => point.predictionId === predictionId),
    ) ?? null
  );
}
