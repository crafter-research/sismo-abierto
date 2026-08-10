import { describe, expect, test } from "bun:test";
import type { NormalizedEvent } from "@sismo/contracts";
import { summarizeEventActivity } from "../src/summary.ts";

function event(timeLocal: string | null, magnitude: number): NormalizedEvent {
  return {
    id: `${timeLocal}-${magnitude}`,
    timeUtc: timeLocal,
    timeLocal,
    magnitude,
    depthKm: 20,
    latitude: -12,
    longitude: -77,
    reference: null,
    intensity: null,
    aceldatReportNumber: null,
    provenance: {
      source: { id: "test", name: "Test", url: "https://example.com" },
      fetchedAt: "2026-07-23T12:00:00-05:00",
      timezone: "America/Lima",
      sourceUpdatedAt: null,
      freshness: "FRESHNESS_UNKNOWN",
      classification: "official",
    },
    fieldClasses: {},
  };
}

describe("summarizeEventActivity", () => {
  test("agrega eventos por mes, magnitud y pico", () => {
    const summary = summarizeEventActivity([
      event("2026-05-02T08:00:00-05:00", 4.2),
      event("2026-05-03T08:00:00-05:00", 5),
      event("2026-07-01T08:00:00-05:00", 6.5),
      event("2026-07-02T08:00:00-05:00", 3.8),
    ]);

    expect(summary).toEqual({
      total: 4,
      magnitudeAtLeast5: 2,
      maxMagnitude: 6.5,
      monthly: [
        { month: "2026-05", count: 2 },
        { month: "2026-07", count: 2 },
      ],
      peakMonths: [
        { month: "2026-05", count: 2 },
        { month: "2026-07", count: 2 },
      ],
    });
  });

  test("devuelve un resumen vacío sin inventar métricas", () => {
    expect(summarizeEventActivity([])).toEqual({
      total: 0,
      magnitudeAtLeast5: 0,
      maxMagnitude: null,
      monthly: [],
      peakMonths: [],
    });
  });

  test("incluye meses sin resultados dentro del rango solicitado", () => {
    expect(
      summarizeEventActivity([event("2026-03-04T11:08:31-05:00", 3.2)], {
        start: "2026-01-01",
        end: "2026-04-30",
      }),
    ).toMatchObject({
      monthly: [
        { month: "2026-01", count: 0 },
        { month: "2026-02", count: 0 },
        { month: "2026-03", count: 1 },
        { month: "2026-04", count: 0 },
      ],
      peakMonths: [{ month: "2026-03", count: 1 }],
    });
  });
});
