import type { NormalizedEvent } from "@sismo/contracts";

export interface MonthlyActivity {
  month: string;
  count: number;
}

export interface EventActivitySummary {
  total: number;
  magnitudeAtLeast5: number;
  maxMagnitude: number | null;
  monthly: MonthlyActivity[];
  peakMonths: MonthlyActivity[];
}

function eventMonth(event: NormalizedEvent): string | null {
  const timestamp = event.timeLocal ?? event.timeUtc;
  return timestamp?.slice(0, 7) ?? null;
}

export function summarizeEventActivity(
  events: NormalizedEvent[],
): EventActivitySummary {
  const monthlyCounts = new Map<string, number>();
  let magnitudeAtLeast5 = 0;
  let maxMagnitude: number | null = null;

  for (const event of events) {
    if (event.magnitude >= 5) magnitudeAtLeast5 += 1;
    maxMagnitude =
      maxMagnitude === null
        ? event.magnitude
        : Math.max(maxMagnitude, event.magnitude);

    const month = eventMonth(event);
    if (month) {
      monthlyCounts.set(month, (monthlyCounts.get(month) ?? 0) + 1);
    }
  }

  const monthly = [...monthlyCounts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
  const peakCount = Math.max(0, ...monthly.map((entry) => entry.count));

  return {
    total: events.length,
    magnitudeAtLeast5,
    maxMagnitude,
    monthly,
    peakMonths: monthly.filter((entry) => entry.count === peakCount),
  };
}
