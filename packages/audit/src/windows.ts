import type { FrozenPrediction } from "@sismo/contracts";

export const WINDOW_START_LIMA = "2026-07-20T00:00:00-05:00";

export function windowStartUtcMs(prediction: FrozenPrediction): number {
  return Date.parse(`${prediction.startDate}T00:00:00-05:00`);
}

export function windowEndUtcMs(prediction: FrozenPrediction): number {
  return Date.parse(prediction.deadlineEndLima);
}

export function isInWindow(
  prediction: FrozenPrediction,
  originTimeUtcIso: string,
): boolean {
  const originMs = Date.parse(originTimeUtcIso);
  if (Number.isNaN(originMs)) return false;
  return (
    originMs >= windowStartUtcMs(prediction) &&
    originMs <= windowEndUtcMs(prediction)
  );
}

export function isMagnitudeInRange(
  prediction: FrozenPrediction,
  magnitude: number,
): boolean {
  return (
    magnitude >= prediction.predictedMagnitudeMin &&
    magnitude <= prediction.predictedMagnitudeMax
  );
}

export function windowHasClosed(
  prediction: FrozenPrediction,
  nowUtcMs: number,
): boolean {
  return nowUtcMs > windowEndUtcMs(prediction);
}

export function windowDays(prediction: FrozenPrediction): number {
  return (
    (windowEndUtcMs(prediction) - windowStartUtcMs(prediction)) / 86_400_000
  );
}
