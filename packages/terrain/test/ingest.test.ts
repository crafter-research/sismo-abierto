import { describe, expect, test } from "bun:test";
import { AGGREGATE_LAYERS, TERRAIN_DIMENSIONS } from "../src/dimensions.ts";
import {
  buildFeatureUrl,
  cityFromLayerName,
  fetchLayer,
  ingestDimension,
  layersForDimension,
} from "../src/ingest.ts";

const FAST = { requestDelayMs: 0, retryBackoffMs: 0 };

const CAPABILITIES = `
<WFS_Capabilities>
  <FeatureType><Name>CapacidadPortante:cap_por_barranca</Name></FeatureType>
  <FeatureType><Name>CapacidadPortante:cap_por_tacna</Name></FeatureType>
  <FeatureType><Name>CapacidadPortante:capacidad_portante</Name></FeatureType>
  <FeatureType><Name>Suelos:suelos_tacna</Name></FeatureType>
</WFS_Capabilities>`;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("descubrimiento de capas", () => {
  test("toma solo las capas de la dimensión pedida", () => {
    const layers = layersForDimension(CAPABILITIES, "CapacidadPortante");
    expect(layers).toEqual([
      "CapacidadPortante:cap_por_barranca",
      "CapacidadPortante:cap_por_tacna",
    ]);
  });

  test("excluye la capa nacional agregada que el servidor trunca en 100", () => {
    const layers = layersForDimension(CAPABILITIES, "CapacidadPortante");
    expect(layers).not.toContain("CapacidadPortante:capacidad_portante");
    expect(AGGREGATE_LAYERS.has("CapacidadPortante:capacidad_portante")).toBe(
      true,
    );
  });

  test("las seis dimensiones del IGP están declaradas", () => {
    expect(TERRAIN_DIMENSIONS).toHaveLength(6);
    expect(TERRAIN_DIMENSIONS).toContain("CapacidadPortante");
  });

  test("deriva la ciudad del nombre de la capa", () => {
    expect(cityFromLayerName("CapacidadPortante:cap_por_alto_alianza")).toBe(
      "alto_alianza",
    );
  });

  test("pide GeoJSON al WFS", () => {
    const url = buildFeatureUrl("CapacidadPortante:cap_por_tacna");
    expect(url).toContain("outputFormat=application%2Fjson");
    expect(url).toContain("typeNames=CapacidadPortante%3Acap_por_tacna");
  });
});

describe("rate limit silencioso del WFS", () => {
  test("reintenta cuando la respuesta llega sin `features`", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) return jsonResponse({ numberMatched: 2 });
      return jsonResponse({
        numberMatched: 2,
        features: [{ properties: { zona: "II" }, geometry: null }],
      });
    }) as unknown as typeof fetch;

    const result = await fetchLayer(
      "CapacidadPortante:cap_por_barranca",
      fetchImpl,
      FAST,
    );
    expect(calls).toBe(2);
    expect(result.features).toHaveLength(1);
    expect(result.city).toBe("barranca");
  });

  test("lanza en vez de reportar cero cuando el WFS nunca responde bien", async () => {
    const fetchImpl = (async () =>
      jsonResponse({ numberMatched: 5 })) as unknown as typeof fetch;

    await expect(
      fetchLayer("CapacidadPortante:cap_por_tacna", fetchImpl, FAST),
    ).rejects.toThrow(/no devolvió features/);
  });

  test("una capa caída corta la corrida y no la deja a medias en silencio", async () => {
    const fetchImpl = (async (input: string) => {
      if (String(input).includes("tacna")) return jsonResponse({});
      return jsonResponse({ numberMatched: 1, features: [{ properties: {} }] });
    }) as unknown as typeof fetch;

    await expect(
      ingestDimension(
        [
          "CapacidadPortante:cap_por_barranca",
          "CapacidadPortante:cap_por_tacna",
        ],
        fetchImpl,
        undefined,
        FAST,
      ),
    ).rejects.toThrow(/tacna/);
  });
});
