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

function rangeMonths(range: { start: string; end: string }): string[] {
  const start = new Date(`${range.start.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${range.end.slice(0, 7)}-01T00:00:00Z`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return [];
  }
  const months: string[] = [];
  while (start <= end) {
    months.push(start.toISOString().slice(0, 7));
    start.setUTCMonth(start.getUTCMonth() + 1);
  }
  return months;
}

export function summarizeEventActivity(
  events: NormalizedEvent[],
  range?: { start: string; end: string },
): EventActivitySummary {
  const monthlyCounts = new Map(
    rangeMonths(range ?? { start: "", end: "" }).map((month) => [month, 0]),
  );
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
    peakMonths:
      peakCount === 0
        ? []
        : monthly.filter((entry) => entry.count === peakCount),
  };
}
