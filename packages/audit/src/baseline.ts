import type { BaselineEstimate, FrozenPrediction } from "@sismo/contracts";
import { fetchUsgsEvents } from "@sismo/data";
import { matchersForTarget, matchRegion } from "./geography.ts";
import { windowDays, windowStartUtcMs } from "./windows.ts";

export const BASELINE_LOOKBACK_DAYS = 365;

export async function calculateBackgroundRate(
  prediction: FrozenPrediction,
): Promise<{
  baseline: BaselineEstimate;
  queries: Array<{ url: string; matchingEventCount: number }>;
} | null> {
  const matchers = prediction.targetRegions
    .flatMap((target) => matchersForTarget(target))
    .filter((matcher) => matcher.bbox !== null);
  if (matchers.length === 0) return null;

  const startMs =
    windowStartUtcMs(prediction) - BASELINE_LOOKBACK_DAYS * 86_400_000;
  const startDate = new Date(startMs).toISOString().slice(0, 10);
  const endDate = new Date(windowStartUtcMs(prediction))
    .toISOString()
    .slice(0, 10);

  const queries: Array<{ url: string; matchingEventCount: number }> = [];
  const seenEventIds = new Set<string>();
  for (const matcher of matchers) {
    const bbox = matcher.bbox;
    if (!bbox) continue;
    const { events, queryUrl } = await fetchUsgsEvents({
      startTime: startDate,
      endTime: endDate,
      minMagnitude: prediction.predictedMagnitudeMin,
      maxMagnitude: prediction.predictedMagnitudeMax,
      minLatitude: bbox.minLat,
      maxLatitude: bbox.maxLat,
      minLongitude: bbox.minLon,
      maxLongitude: bbox.maxLon,
    });
    const matchingIds = new Set<string>();
    for (const event of events) {
      if (matchRegion(matcher, event.latitude, event.longitude) !== "outside") {
        matchingIds.add(event.id);
        seenEventIds.add(event.id);
      }
    }
    queries.push({ url: queryUrl, matchingEventCount: matchingIds.size });
  }

  const matchingEventCount = seenEventIds.size;
  const eventsPerDay = matchingEventCount / BASELINE_LOOKBACK_DAYS;
  const days = windowDays(prediction);
  const probabilityAtLeastOne = 1 - Math.exp(-eventsPerDay * days);

  return {
    baseline: {
      lookbackDays: BASELINE_LOOKBACK_DAYS,
      matchingEventCount,
      eventsPerDay: Math.round(eventsPerDay * 10_000) / 10_000,
      probabilityAtLeastOne: Math.round(probabilityAtLeastOne * 1_000) / 1_000,
      windowDays: Math.round(days * 100) / 100,
    },
    queries,
  };
}
