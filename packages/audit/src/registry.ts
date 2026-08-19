import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { FrozenPrediction } from "@sismo/contracts";
import {
  historicalPointToPrediction,
  loadHistoricalReportRegistry,
} from "./historical-reports.ts";
import { loadPanoramaReportRegistry } from "./panoramas.ts";
import { parseFrozenPredictions } from "./predictions.ts";

function resolvePredictionsPath(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth++) {
    const candidate = join(dir, "data", "predictions", "predictions.csv");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "No se encontró data/predictions/predictions.csv subiendo desde el directorio actual",
  );
}

let cache: FrozenPrediction[] | null = null;

export async function loadPredictionRegistry(): Promise<FrozenPrediction[]> {
  if (!cache) {
    const text = await readFile(resolvePredictionsPath(), "utf8");
    cache = parseFrozenPredictions(text);
  }
  return cache;
}

export async function getPrediction(
  predictionId: string,
): Promise<FrozenPrediction | null> {
  const registry = await loadPredictionRegistry();
  const frozen = registry.find(
    (prediction) => prediction.predictionId === predictionId,
  );
  if (frozen) return frozen;
  const panoramas = await loadPanoramaReportRegistry();
  const fromPanorama = panoramas
    .flatMap((report) => report.points)
    .find((prediction) => prediction.predictionId === predictionId);
  if (fromPanorama) return fromPanorama;
  const historical = await loadHistoricalReportRegistry();
  for (const report of historical) {
    for (const point of report.points) {
      const prediction = historicalPointToPrediction(report, point);
      if (prediction.predictionId === predictionId) return prediction;
    }
  }
  return null;
}
