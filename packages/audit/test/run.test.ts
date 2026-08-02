import { describe, expect, test } from "bun:test";
import type { PredictionAudit } from "@sismo/contracts";
import {
  assertAllWindowsClosed,
  renderAuditCsv,
  renderAuditLog,
  renderFinalAudit,
} from "../src/run.ts";

function audit(
  predictionId: string,
  verdict: PredictionAudit["verdict"],
): PredictionAudit {
  return {
    predictionId,
    verdict,
    evaluatedAt: verdict === "PENDING" ? null : "2026-08-02T05:00:00.000Z",
    windowStartLima: "2026-07-20T00:00:00-05:00",
    windowEndLima: "2026-08-01T23:59:59-05:00",
    candidates: [],
    ambiguousRegions: [],
    unambiguousRegions: ["Ica"],
    baseline: {
      lookbackDays: 365,
      matchingEventCount: 2,
      eventsPerDay: 0.0055,
      probabilityAtLeastOne: 0.071,
      windowDays: 13,
    },
    evidence: [
      {
        at: "2026-08-02T05:00:00.000Z",
        action: "Consulta CENSIS",
        url: "https://example.test/evidence",
        detail: "2 eventos devueltos",
      },
    ],
  };
}

describe("artefactos de auditoría final", () => {
  test("se rehúsa a publicar mientras exista una ventana abierta", () => {
    expect(() => assertAllWindowsClosed([audit("P6", "PENDING")])).toThrow(
      "P6",
    );
  });

  test("genera CSV, log e informe con tasa base y evidencia", () => {
    const strictHit = audit("P1", "STRICT_HIT");
    strictHit.candidates.push({
      sourceId: "us7000test",
      eventTimeUtc: "2026-07-24T16:51:37.514Z",
      magnitude: 5.7,
      latitude: -38.8,
      longitude: 175.5,
      place: "49 km W of Turangi, New Zealand",
      matchedRegion: "Nueva Zelanda",
      regionIsAmbiguous: false,
    });
    const audits = [strictHit, audit("P2", "NO_MATCH")];
    const runAt = "2026-08-02T05:00:00.000Z";

    expect(renderAuditCsv(runAt, audits)).toContain(
      "P1,STRICT_HIT,2026-08-02T05:00:00.000Z",
    );
    expect(renderAuditLog(runAt, audits)).toContain(
      "[Consulta CENSIS](https://example.test/evidence)",
    );
    expect(renderFinalAudit(runAt, audits)).toContain("| STRICT_HIT | 1 |");
    expect(renderFinalAudit(runAt, audits)).toContain(
      "| SOURCE_DISAGREEMENT | 0 |",
    );
    expect(renderFinalAudit(runAt, audits)).toContain("| PENDING | 0 |");
    expect(renderFinalAudit(runAt, audits)).toContain(
      "49 km W of Turangi, New Zealand",
    );
    expect(renderFinalAudit(runAt, audits)).toContain(
      "7.1% de probabilidad base",
    );
  });
});
