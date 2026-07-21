import { describe, expect, test } from "bun:test";
import {
  deriveConsumerStatus,
  MemorySourceHealthStore,
  observationToCheck,
  type ProbeObservation,
  recordCheck,
} from "../src/index.ts";

function observation(overrides: Partial<ProbeObservation>): ProbeObservation {
  return {
    sourceId: "igp-arcgis-ultimo-sismo",
    checkedAt: "2026-07-21T00:00:00Z",
    httpStatus: 200,
    durationMs: 400,
    contentType: "application/json",
    responded: true,
    schemaValid: true,
    recordCount: 1,
    freshnessKnown: true,
    latencyDegradedMs: 4000,
    errorKind: null,
    evidence: "HTTP 200 en 400 ms",
    ...overrides,
  };
}

describe("estados deterministas del consumidor", () => {
  test("respuesta válida y rápida es OPERATIONAL", () => {
    expect(deriveConsumerStatus(observation({}))).toBe("OPERATIONAL");
  });

  test("timeout o red caída es UNAVAILABLE", () => {
    expect(
      deriveConsumerStatus(
        observation({
          responded: false,
          httpStatus: null,
          errorKind: "timeout",
        }),
      ),
    ).toBe("UNAVAILABLE");
  });

  test("HTTP 500 es UNAVAILABLE", () => {
    expect(deriveConsumerStatus(observation({ httpStatus: 500 }))).toBe(
      "UNAVAILABLE",
    );
  });

  test("payload que rompe el contrato es SCHEMA_CHANGED", () => {
    expect(deriveConsumerStatus(observation({ schemaValid: false }))).toBe(
      "SCHEMA_CHANGED",
    );
  });

  test("latencia sobre umbral es DEGRADED", () => {
    expect(deriveConsumerStatus(observation({ durationMs: 4500 }))).toBe(
      "DEGRADED",
    );
  });

  test("dato vacío es DEGRADED, nunca dato válido", () => {
    expect(deriveConsumerStatus(observation({ recordCount: 0 }))).toBe(
      "DEGRADED",
    );
  });

  test("sin señal de frescura es FRESHNESS_UNKNOWN aunque responda bien", () => {
    expect(deriveConsumerStatus(observation({ freshnessKnown: false }))).toBe(
      "FRESHNESS_UNKNOWN",
    );
  });

  test("prioridad: indisponible sobre schema sobre degradado", () => {
    expect(
      deriveConsumerStatus(
        observation({ httpStatus: 503, schemaValid: false, durationMs: 9000 }),
      ),
    ).toBe("UNAVAILABLE");
    expect(
      deriveConsumerStatus(
        observation({ schemaValid: false, durationMs: 9000 }),
      ),
    ).toBe("SCHEMA_CHANGED");
  });
});

describe("transiciones y cambios observados", () => {
  test("una degradación abre un cambio y la recuperación lo cierra", async () => {
    const store = new MemorySourceHealthStore();

    const ok1 = observationToCheck(
      observation({ checkedAt: "2026-07-21T00:00:00Z" }),
    );
    await recordCheck(store, ok1);
    expect((await store.getState("igp-arcgis-ultimo-sismo"))?.status).toBe(
      "OPERATIONAL",
    );
    expect(await store.listChanges("igp-arcgis-ultimo-sismo", 10)).toHaveLength(
      0,
    );

    const down = observationToCheck(
      observation({
        checkedAt: "2026-07-21T00:10:00Z",
        responded: false,
        httpStatus: null,
        errorKind: "network",
      }),
    );
    await recordCheck(store, down);
    const state = await store.getState("igp-arcgis-ultimo-sismo");
    expect(state?.status).toBe("UNAVAILABLE");
    expect(state?.consecutiveFailures).toBe(1);
    const open = await store.getOpenChange("igp-arcgis-ultimo-sismo");
    expect(open?.toStatus).toBe("UNAVAILABLE");
    expect(open?.closedAt).toBeNull();

    const ok2 = observationToCheck(
      observation({ checkedAt: "2026-07-21T00:20:00Z" }),
    );
    await recordCheck(store, ok2);
    expect((await store.getState("igp-arcgis-ultimo-sismo"))?.status).toBe(
      "OPERATIONAL",
    );
    expect(
      (await store.getState("igp-arcgis-ultimo-sismo"))?.consecutiveFailures,
    ).toBe(0);
    expect(await store.getOpenChange("igp-arcgis-ultimo-sismo")).toBeNull();
    const changes = await store.listChanges("igp-arcgis-ultimo-sismo", 10);
    expect(changes).toHaveLength(1);
    expect(changes[0]?.closedAt).toBe("2026-07-21T00:20:00Z");
  });

  test("fallas consecutivas acumulan el contador", async () => {
    const store = new MemorySourceHealthStore();
    for (const minute of ["00", "10", "20"]) {
      await recordCheck(
        store,
        observationToCheck(
          observation({
            checkedAt: `2026-07-21T01:${minute}:00Z`,
            responded: false,
            httpStatus: null,
          }),
        ),
      );
    }
    expect(
      (await store.getState("igp-arcgis-ultimo-sismo"))?.consecutiveFailures,
    ).toBe(3);
  });
});
