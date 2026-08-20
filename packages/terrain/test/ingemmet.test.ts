import { describe, expect, test } from "bun:test";
import {
  batchIds,
  fetchBatch,
  fetchObjectIds,
  ingestLayer,
} from "../src/ingemmet/ingest.ts";
import { INGEMMET_LAYERS, type IngemmetLayer } from "../src/ingemmet/source.ts";

const FAST = { requestDelayMs: 0, retryBackoffMs: 0 };
const LAYER = INGEMMET_LAYERS[0] as IngemmetLayer;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("lotes por objectIds", () => {
  test("parte la lista completa sin perder ids", () => {
    const ids = Array.from({ length: 1250 }, (_, i) => i + 1);
    const batches = batchIds(ids, 500);
    expect(batches.map((b) => b.length)).toEqual([500, 500, 250]);
    expect(batches.flat()).toEqual(ids);
  });

  test("los ids no contiguos se respetan tal cual", () => {
    // Geologia declara 113,051 features con OBJECTID maximo 118,826: hay huecos.
    const ids = [1, 7, 900, 118826];
    expect(batchIds(ids, 2)).toEqual([
      [1, 7],
      [900, 118826],
    ]);
  });
});

describe("lista de OBJECTID", () => {
  test("toma la lista completa aunque supere maxRecordCount", async () => {
    const ids = Array.from({ length: 62109 }, (_, i) => i + 1);
    const fetchImpl = (async () =>
      jsonResponse({ objectIds: ids })) as unknown as typeof fetch;

    expect(await fetchObjectIds(LAYER, fetchImpl, FAST)).toHaveLength(62109);
  });

  test("una respuesta sin objectIds no pasa como capa vacía", async () => {
    const fetchImpl = (async () => jsonResponse({})) as unknown as typeof fetch;
    await expect(fetchObjectIds(LAYER, fetchImpl, FAST)).rejects.toThrow(
      /objectIds/,
    );
  });
});

describe("descarga de un lote", () => {
  test("un lote incompleto no se acepta en silencio", async () => {
    const fetchImpl = (async () =>
      jsonResponse({
        features: [{ id: 1, properties: {}, geometry: null }],
      })) as unknown as typeof fetch;

    await expect(fetchBatch(LAYER, [1, 2, 3], fetchImpl, FAST)).rejects.toThrow(
      /1 de 3/,
    );
  });

  test("un error de ArcGIS en cuerpo 200 se trata como fallo", async () => {
    const fetchImpl = (async () =>
      jsonResponse({
        error: { message: "Pagination is not supported." },
      })) as unknown as typeof fetch;

    await expect(fetchBatch(LAYER, [1], fetchImpl, FAST)).rejects.toThrow(
      /Pagination/,
    );
  });

  test("conserva el OBJECTID real de cada feature", async () => {
    const fetchImpl = (async () =>
      jsonResponse({
        features: [
          { id: 900, properties: { SUBUNIDAD: "Colina" }, geometry: null },
          {
            id: 118826,
            properties: { SUBUNIDAD: "Vertiente" },
            geometry: null,
          },
        ],
      })) as unknown as typeof fetch;

    const out = await fetchBatch(LAYER, [900, 118826], fetchImpl, FAST);
    expect(out.map((f) => f.objectId)).toEqual([900, 118826]);
    expect(out[0]?.layerId).toBe(LAYER.id);
  });
});

describe("capa entera", () => {
  test("entrega los lotes a medida que llegan y cuenta el total", async () => {
    const ids = Array.from({ length: 1200 }, (_, i) => i + 1);
    const fetchImpl = (async (_input: string, init?: RequestInit) => {
      if (!init?.body) return jsonResponse({ objectIds: ids });
      const asked = new URLSearchParams(String(init.body)).get("objectIds");
      const list = (asked ?? "").split(",").filter(Boolean);
      return jsonResponse({
        features: list.map((id) => ({
          id: Number(id),
          properties: {},
          geometry: null,
        })),
      });
    }) as unknown as typeof fetch;

    const seen: number[] = [];
    const result = await ingestLayer(
      LAYER,
      async (features) => {
        seen.push(features.length);
      },
      fetchImpl,
      FAST,
    );

    expect(seen).toEqual([500, 500, 200]);
    expect(result).toEqual({ total: 1200, ingested: 1200, skipped: 0 });
  });
});

describe("lotes que el servicio rechaza por peso", () => {
  test("parte el lote a la mitad y recupera todas las features", async () => {
    const ids = Array.from({ length: 500 }, (_, i) => i + 1);
    const sizesAsked: number[] = [];
    const fetchImpl = (async (_input: string, init?: RequestInit) => {
      if (!init?.body) return jsonResponse({ objectIds: ids });
      const list = (
        new URLSearchParams(String(init.body)).get("objectIds") ?? ""
      )
        .split(",")
        .filter(Boolean);
      sizesAsked.push(list.length);
      // El servicio muere con lotes de mas de 200: es peso, no cantidad.
      if (list.length > 200) {
        return new Response("Error performing query operation", {
          status: 500,
        });
      }
      return jsonResponse({
        features: list.map((id) => ({
          id: Number(id),
          properties: {},
          geometry: null,
        })),
      });
    }) as unknown as typeof fetch;

    const collected: number[] = [];
    const result = await ingestLayer(
      LAYER,
      async (features) => {
        for (const f of features) collected.push(f.objectId);
      },
      fetchImpl,
      FAST,
    );

    expect(result).toEqual({ total: 500, ingested: 500, skipped: 0 });
    expect(collected).toEqual(ids);
    expect(Math.max(...sizesAsked)).toBe(500);
    expect(Math.min(...sizesAsked)).toBeLessThanOrEqual(125);
  });

  test("un lote que falla ya en el piso se propaga", async () => {
    const ids = [1, 2, 3];
    const fetchImpl = (async (_input: string, init?: RequestInit) => {
      if (!init?.body) return jsonResponse({ objectIds: ids });
      return new Response("boom", { status: 500 });
    }) as unknown as typeof fetch;

    await expect(
      ingestLayer(LAYER, async () => {}, fetchImpl, FAST),
    ).rejects.toThrow(/500/);
  });
});

describe("reanudar una corrida cortada", () => {
  test("pide solo los ids que faltan y cuenta los saltados", async () => {
    const ids = Array.from({ length: 1000 }, (_, i) => i + 1);
    const asked: number[] = [];
    const fetchImpl = (async (_input: string, init?: RequestInit) => {
      if (!init?.body) return jsonResponse({ objectIds: ids });
      const list = (
        new URLSearchParams(String(init.body)).get("objectIds") ?? ""
      )
        .split(",")
        .filter(Boolean)
        .map(Number);
      asked.push(...list);
      return jsonResponse({
        features: list.map((id) => ({ id, properties: {}, geometry: null })),
      });
    }) as unknown as typeof fetch;

    // Simula una corrida que murió a los 600 (fue un corte de Neon, no del origen).
    const already = new Set(ids.slice(0, 600));
    const result = await ingestLayer(
      LAYER,
      async () => {},
      fetchImpl,
      FAST,
      already,
    );

    expect(result).toEqual({ total: 1000, ingested: 400, skipped: 600 });
    expect(asked).toEqual(ids.slice(600));
  });
});
