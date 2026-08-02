import { describe, expect, test } from "bun:test";
import {
  API_ENDPOINT_PATHS,
  buildOpenApiDocument,
  eventDetailResponseSchema,
  eventListResponseSchema,
  latestEventResponseSchema,
  sourcesResponseSchema,
  stationListResponseSchema,
  volcanoDetailResponseSchema,
  volcanoListResponseSchema,
  waveformResponseSchema,
} from "../src/index.ts";

const fixture = async (name: string) =>
  Bun.file(new URL(`./fixtures/${name}`, import.meta.url).pathname).json();

describe("documento OpenAPI", () => {
  const document = buildOpenApiDocument() as {
    openapi: string;
    paths: Record<string, unknown>;
    components: { schemas: Record<string, unknown> };
  };

  test("expone los 10 endpoints del contrato", () => {
    expect(Object.keys(document.paths).sort()).toEqual(
      [...API_ENDPOINT_PATHS].sort(),
    );
    expect(API_ENDPOINT_PATHS.length).toBe(10);
    expect(document.paths["/v1/sources/{sourceId}/badge.svg"]).toBeDefined();
  });

  test("es OpenAPI 3.1 con esquemas de componentes", () => {
    expect(document.openapi).toBe("3.1.0");
    expect(
      Object.keys(document.components.schemas).length,
    ).toBeGreaterThanOrEqual(10);
    expect(document.components.schemas.ApiError).toBeDefined();
  });
});

describe("respuestas reales capturadas validan contra el contrato", () => {
  const cases = [
    ["latest-response.json", latestEventResponseSchema],
    ["events-response.json", eventListResponseSchema],
    ["event-detail-response.json", eventDetailResponseSchema],
    ["stations-response.json", stationListResponseSchema],
    ["waveform-response.json", waveformResponseSchema],
    ["volcanoes-response.json", volcanoListResponseSchema],
    ["volcano-detail-response.json", volcanoDetailResponseSchema],
    ["sources-response.json", sourcesResponseSchema],
  ] as const;

  for (const [name, schema] of cases) {
    test(name, async () => {
      const payload = await fixture(name);
      const result = schema.safeParse(payload);
      if (!result.success) {
        throw new Error(`${name} no valida: ${result.error.message}`);
      }
    });
  }

  test("toda respuesta de eventos incluye procedencia con fuente y hora", async () => {
    const payload = (await fixture("events-response.json")) as {
      provenance: {
        source: { url: string };
        fetchedAt: string;
        timezone: string;
      };
      limitations: string[];
    };
    expect(payload.provenance.source.url).toStartWith("https://");
    expect(payload.provenance.timezone).toBe("America/Lima");
    expect(payload.limitations.length).toBeGreaterThan(0);
  });

  test("los 16 volcanes llegan con FRESHNESS_UNKNOWN", async () => {
    const payload = (await fixture("volcanoes-response.json")) as {
      volcanoes: unknown[];
      freshness: string;
    };
    expect(payload.volcanoes.length).toBe(16);
    expect(payload.freshness).toBe("FRESHNESS_UNKNOWN");
  });
});
