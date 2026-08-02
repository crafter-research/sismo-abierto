import { describe, expect, test } from "bun:test";
import {
  baselineProbabilityBand,
  interpretPredictionResult,
} from "../src/interpretation.ts";

describe("interpretación pública separada del protocolo congelado", () => {
  test("renombra STRICT_HIT como coincidencia estricta sin reescribir el veredicto", () => {
    const interpretation = interpretPredictionResult("STRICT_HIT", {
      lookbackDays: 365,
      matchingEventCount: 170,
      eventsPerDay: 0.4658,
      probabilityAtLeastOne: 0.994,
      windowDays: 11,
    });

    expect(interpretation).toEqual({
      matchOutcome: "STRICT_MATCH",
      baselineProbability: 0.994,
      baselineBand: "VERY_HIGH",
      predictiveEvidence: "NOT_ESTABLISHED",
    });
  });

  test("clasifica bandas descriptivas sin convertirlas en significancia", () => {
    expect(baselineProbabilityBand(0.8)).toBe("VERY_HIGH");
    expect(baselineProbabilityBand(0.5)).toBe("HIGH");
    expect(baselineProbabilityBand(0.2)).toBe("MODERATE");
    expect(baselineProbabilityBand(0.074)).toBe("LOW");
    expect(baselineProbabilityBand(null)).toBe("UNAVAILABLE");
  });
});
