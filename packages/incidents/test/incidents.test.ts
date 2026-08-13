import { describe, expect, test } from "bun:test";
import {
  incidentViewResponseSchema,
  type NormalizedEvent,
} from "@sismo/contracts";
import {
  COLOMBIA_INCIDENT,
  getIncidentView,
  MemoryIncidentStore,
  publishHumanitarianVersion,
  submitHumanitarianSnapshot,
} from "../src/index.ts";

const event: NormalizedEvent = {
  id: COLOMBIA_INCIDENT.eventId,
  sourceEventId: "SGC2026pqqmro",
  agency: "SGC",
  reviewStatus: "manual",
  magnitudeType: "Mw",
  timeUtc: "2026-08-10T12:34:27Z",
  timeLocal: "2026-08-10T07:34:27-05:00",
  magnitude: 7.4,
  depthKm: 15,
  latitude: 4.9,
  longitude: -76.2,
  reference: "San José del Palmar, Chocó",
  intensity: null,
  aceldatReportNumber: null,
  provenance: {
    source: { id: "sgc-sismos", name: "SGC", url: "https://sgc.gov.co" },
    fetchedAt: "2026-08-10T20:00:00Z",
    timezone: "America/Bogota",
    sourceUpdatedAt: "2026-08-10T19:59:30Z",
    freshness: "FRESH",
    classification: "official",
  },
  fieldClasses: {},
};

describe("incidentes versionados", () => {
  test("sirve fallback público sin base de datos", async () => {
    const view = await getIncidentView(
      COLOMBIA_INCIDENT.slug,
      null,
      new Date("2026-08-11T13:00:00Z"),
      false,
    );
    expect(view?.storage).toBe("fallback");
    expect(view?.humanitarian.versionLabel).toBe(
      "Informe Consolidado No. 22 · 13/08 10:00",
    );
    expect(view?.humanitarian.facts[0]?.value).toBe(273);
    expect(
      view?.history.some((entry) => entry.source.reportNumber === "002"),
    ).toBe(true);
    expect(
      view?.history.some(
        (entry) =>
          entry.id === "humanitarian-colombia-2026-08-10-asocapitales-1730",
      ),
    ).toBe(true);
    expect(
      view?.history.some(
        (entry) =>
          entry.id ===
          "humanitarian-colombia-2026-08-11-asocapitales-report-14",
      ),
    ).toBe(true);
    expect(
      view?.history.some(
        (entry) =>
          entry.id === "humanitarian-colombia-2026-08-11-asocapitales-0640",
      ),
    ).toBe(true);
    expect(incidentViewResponseSchema.safeParse(view).success).toBe(true);
  });

  test("un corte humanitario no es público hasta aprobarlo", async () => {
    const store = new MemoryIncidentStore();
    await getIncidentView(
      COLOMBIA_INCIDENT.slug,
      store,
      new Date("2026-08-11T13:00:00Z"),
      false,
    );
    const candidate = await submitHumanitarianSnapshot(
      COLOMBIA_INCIDENT.id,
      {
        versionLabel: "Reporte preliminar 023",
        observedAt: "2026-08-13T11:00:00-05:00",
        source: {
          name: "UNGRD",
          url: "https://www.gestiondelriesgo.gov.co/",
          reportNumber: "023",
          issuedAt: "2026-08-13T11:00:00-05:00",
        },
        facts: [
          {
            key: "deaths",
            value: 170,
            displayValue: "170",
            label: "fallecidos",
          },
        ],
      },
      store,
    );
    const before = await getIncidentView(
      COLOMBIA_INCIDENT.slug,
      store,
      new Date("2026-08-13T17:00:00Z"),
      false,
    );
    expect(before?.humanitarian.versionLabel).toBe(
      "Informe Consolidado No. 22 · 13/08 10:00",
    );
    expect(
      before?.history.some((entry) => entry.source.reportNumber === "002"),
    ).toBe(true);
    await publishHumanitarianVersion(COLOMBIA_INCIDENT.id, candidate.id, store);
    const after = await getIncidentView(
      COLOMBIA_INCIDENT.slug,
      store,
      new Date("2026-08-13T17:00:00Z"),
      false,
    );
    expect(after?.humanitarian.source.reportNumber).toBe("023");
  });

  test("acepta una versión sísmica automática reciente", async () => {
    const store = new MemoryIncidentStore();
    await store.upsertIncident(COLOMBIA_INCIDENT);
    await store.insertVersion({
      id: "seismic-test",
      incidentId: COLOMBIA_INCIDENT.id,
      kind: "seismic",
      versionLabel: "SGC manual",
      reviewStatus: "automatic",
      observedAt: "2026-08-10T19:59:30Z",
      publishedAt: "2026-08-10T20:00:00Z",
      source: {
        name: "SGC",
        url: "https://sgc.gov.co",
        reportNumber: "SGC2026pqqmro",
        issuedAt: "2026-08-10T19:59:30Z",
      },
      payload: { event, syncedAt: "2026-08-10T20:00:00Z" },
      createdAt: "2026-08-10T20:00:00Z",
    });
    const view = await getIncidentView(
      COLOMBIA_INCIDENT.slug,
      store,
      new Date("2026-08-10T20:01:00Z"),
    );
    expect(view?.seismic?.freshness).toBe("FRESH");
    expect(view?.seismic?.event.magnitude).toBe(7.4);
  });
});
