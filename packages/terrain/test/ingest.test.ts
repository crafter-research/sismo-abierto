import { describe, expect, test } from "bun:test";
import {
  AGGREGATE_LAYERS,
  TERRAIN_DIMENSIONS,
  type TerrainDimension,
} from "../src/dimensions.ts";
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

  test("cada dimensión excluye su capa nacional", () => {
    // Estaba listada solo la de CapacidadPortante: las otras cinco se habrían
    // ingerido junto a sus capas por ciudad, duplicando todo.
    const nacionales: [TerrainDimension, string][] = [
      ["CapacidadPortante", "CapacidadPortante:capacidad_portante"],
      ["ZonificacionSismica", "ZonificacionSismica:zonificacion_sismica"],
      ["Suelos", "Suelos:suelos"],
      ["Geologia", "Geologia:geologia"],
      ["Geomorfologia", "Geomorfologia:geomorfologia"],
      ["Geodinamica", "Geodinamica:geodinamica"],
    ];
    for (const [dimension, layer] of nacionales) {
      expect(AGGREGATE_LAYERS.has(layer)).toBe(true);
      const caps = `<WFS_Capabilities>
        <FeatureType><Name>${layer}</Name></FeatureType>
        <FeatureType><Name>${dimension}:algo_ciudad</Name></FeatureType>
      </WFS_Capabilities>`;
      expect(layersForDimension(caps, dimension)).toEqual([
        `${dimension}:algo_ciudad`,
      ]);
    }
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

  test("normaliza el typo de la fuente en Chaclacayo", () => {
    // Geologia y Suelos publican "chaclacacayo" (con "caca" repetido); el resto
    // de dimensiones publica "chaclacayo" bien escrito. Sin normalizar, la
    // misma ciudad queda partida en dos.
    expect(cityFromLayerName("Geologia:geologia_chaclacacayo")).toBe(
      "chaclacayo",
    );
    expect(cityFromLayerName("Suelos:suelos_chaclacacayo")).toBe("chaclacayo");
    expect(cityFromLayerName("CapacidadPortante:cap_por_chaclacayo")).toBe(
      "chaclacayo",
    );
    expect(cityFromLayerName("Geodinamica:geodinamica_chaclacayo")).toBe(
      "chaclacayo",
    );
    expect(cityFromLayerName("Geomorfologia:geomorfologia_chaclacayo")).toBe(
      "chaclacayo",
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
      if (calls === 1) return jsonResponse({ numberMatched: 1 });
      return jsonResponse({
        numberMatched: 1,
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

describe("tope de 100 features por petición", () => {
  test("pagina hasta juntar la capa entera", async () => {
    const total = 436;
    const calls: string[] = [];
    const fetchImpl = (async (input: string) => {
      const url = new URL(String(input));
      calls.push(url.searchParams.get("startIndex") ?? "0");
      const start = Number(url.searchParams.get("startIndex") ?? 0);
      const size = Math.max(0, Math.min(100, total - start));
      return jsonResponse({
        numberMatched: total,
        features: Array.from({ length: size }, () => ({ properties: {} })),
      });
    }) as unknown as typeof fetch;

    const result = await fetchLayer("Geologia:geologia", fetchImpl, FAST);

    expect(result.features).toHaveLength(total);
    expect(result.matched).toBe(total);
    expect(calls).toEqual(["0", "100", "200", "300", "400"]);
  });

  test("no pide una segunda página cuando la capa entra en una", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse({
        numberMatched: 8,
        features: Array.from({ length: 8 }, () => ({ properties: {} })),
      });
    }) as unknown as typeof fetch;

    const result = await fetchLayer(
      "ZonificacionSismica:zon_tacna",
      fetchImpl,
      FAST,
    );
    expect(result.features).toHaveLength(8);
    expect(calls).toBe(1);
  });

  test("una capa no listada que entrega de menos corta la corrida", async () => {
    const fetchImpl = (async (input: string) => {
      const start = Number(
        new URL(String(input)).searchParams.get("startIndex") ?? 0,
      );
      return jsonResponse({
        numberMatched: 11,
        features:
          start === 0
            ? Array.from({ length: 10 }, () => ({ properties: {} }))
            : [],
      });
    }) as unknown as typeof fetch;

    await expect(
      fetchLayer("ZonificacionSismica:zon_chosica", fetchImpl, FAST),
    ).rejects.toThrow(/10 de 11/);
  });

  test("el hueco medido de zon_barranca se cuenta, no tumba la corrida", async () => {
    // Medido 2026-08-20: declara 11 y sirve 10 con cualquier página >= 11.
    const fetchImpl = (async (input: string) => {
      const start = Number(
        new URL(String(input)).searchParams.get("startIndex") ?? 0,
      );
      return jsonResponse({
        numberMatched: 11,
        features:
          start === 0
            ? Array.from({ length: 10 }, () => ({ properties: {} }))
            : [],
      });
    }) as unknown as typeof fetch;

    const result = await fetchLayer(
      "ZonificacionSismica:zon_barranca",
      fetchImpl,
      FAST,
    );
    expect(result.features).toHaveLength(10);
    expect(result.matched).toBe(11);
    expect(result.shortfall).toBe(1);
  });

  test("una capa sana no reporta hueco", async () => {
    const fetchImpl = (async () =>
      jsonResponse({
        numberMatched: 8,
        features: Array.from({ length: 8 }, () => ({ properties: {} })),
      })) as unknown as typeof fetch;

    const result = await fetchLayer(
      "ZonificacionSismica:zon_tacna",
      fetchImpl,
      FAST,
    );
    expect(result.shortfall).toBe(0);
  });
});
