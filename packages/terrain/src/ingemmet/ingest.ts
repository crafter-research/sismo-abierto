import {
  featuresBody,
  featuresUrl,
  INGEMMET_BATCH_SIZE,
  INGEMMET_MAX_ATTEMPTS,
  INGEMMET_MIN_BATCH_SIZE,
  INGEMMET_REQUEST_DELAY_MS,
  INGEMMET_RETRY_BACKOFF_MS,
  type IngemmetLayer,
  idsUrl,
} from "./source.ts";

export interface IngemmetFeature {
  layerId: string;
  objectId: number;
  properties: Record<string, unknown>;
  geometry: unknown;
}

export interface IngemmetTiming {
  requestDelayMs?: number;
  retryBackoffMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function batchIds(
  ids: number[],
  size = INGEMMET_BATCH_SIZE,
): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

async function withRetry<T>(
  what: string,
  attempt: () => Promise<T>,
  retryBackoffMs: number,
): Promise<T> {
  let lastError = "";
  for (let i = 1; i <= INGEMMET_MAX_ATTEMPTS; i++) {
    if (i > 1) await sleep(retryBackoffMs);
    try {
      return await attempt();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(
    `GEOCATMIN falló en ${what} tras ${INGEMMET_MAX_ATTEMPTS} intentos: ${lastError}`,
  );
}

/**
 * Lista completa de OBJECTID de una capa.
 *
 * `returnIdsOnly` no respeta `maxRecordCount`, así que devuelve todo de una.
 * Es la única via para saber qué pedir: los ids no son contiguos.
 */
export async function fetchObjectIds(
  layer: IngemmetLayer,
  fetchImpl: typeof fetch = fetch,
  timing: IngemmetTiming = {},
): Promise<number[]> {
  const retryBackoffMs = timing.retryBackoffMs ?? INGEMMET_RETRY_BACKOFF_MS;
  return withRetry(
    `ids de ${layer.id}`,
    async () => {
      const response = await fetchImpl(idsUrl(layer));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = (await response.json()) as { objectIds?: number[] };
      if (!Array.isArray(body.objectIds)) {
        throw new Error("respuesta sin `objectIds`");
      }
      return body.objectIds;
    },
    retryBackoffMs,
  );
}

/**
 * Trae un lote por `objectIds`. Va por POST: 500 ids no entran cómodos en una
 * query string.
 *
 * Un lote que vuelve con menos features de los pedidos no se acepta en silencio:
 * se reintenta y termina lanzando. Contar de menos aquí publicaría cobertura
 * incompleta sin que nadie lo note.
 */
export async function fetchBatch(
  layer: IngemmetLayer,
  ids: number[],
  fetchImpl: typeof fetch = fetch,
  timing: IngemmetTiming = {},
): Promise<IngemmetFeature[]> {
  const retryBackoffMs = timing.retryBackoffMs ?? INGEMMET_RETRY_BACKOFF_MS;
  return withRetry(
    `lote de ${ids.length} en ${layer.id}`,
    async () => {
      const response = await fetchImpl(featuresUrl(layer), {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: featuresBody(layer, ids).toString(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = (await response.json()) as {
        features?: {
          id?: number;
          properties?: Record<string, unknown>;
          geometry?: unknown;
        }[];
        error?: { message?: string };
      };
      if (body.error) throw new Error(body.error.message ?? "error de ArcGIS");
      if (!Array.isArray(body.features))
        throw new Error("respuesta sin `features`");
      if (body.features.length < ids.length) {
        throw new Error(
          `el servicio devolvió ${body.features.length} de ${ids.length} features pedidos`,
        );
      }
      return body.features.map((feature, index) => ({
        layerId: layer.id,
        objectId: feature.id ?? ids[index] ?? -1,
        properties: feature.properties ?? {},
        geometry: feature.geometry ?? null,
      }));
    },
    retryBackoffMs,
  );
}

/**
 * Trae un lote partiéndolo a la mitad si el servicio lo rechaza.
 *
 * GEOCATMIN falla por peso de respuesta, no por cantidad, y ese peso no se puede
 * saber antes de pedir. Partir al fallar deja que la mayoría de los lotes viajen
 * en 500 y solo los pesados se fragmenten.
 */
async function fetchAdaptive(
  layer: IngemmetLayer,
  ids: number[],
  fetchImpl: typeof fetch,
  timing: IngemmetTiming,
  requestDelayMs: number,
): Promise<IngemmetFeature[]> {
  try {
    return await fetchBatch(layer, ids, fetchImpl, timing);
  } catch (error) {
    if (ids.length <= INGEMMET_MIN_BATCH_SIZE) throw error;
    const mid = Math.ceil(ids.length / 2);
    const out: IngemmetFeature[] = [];
    for (const half of [ids.slice(0, mid), ids.slice(mid)]) {
      if (half.length === 0) continue;
      await sleep(requestDelayMs);
      out.push(
        ...(await fetchAdaptive(
          layer,
          half,
          fetchImpl,
          timing,
          requestDelayMs,
        )),
      );
    }
    return out;
  }
}

/**
 * Recorre una capa entera en lotes, entregando cada lote apenas llega para que
 * el llamador lo escriba sin acumular 113k features en memoria.
 */
export async function ingestLayer(
  layer: IngemmetLayer,
  onBatch: (
    features: IngemmetFeature[],
    done: number,
    total: number,
  ) => Promise<void>,
  fetchImpl: typeof fetch = fetch,
  timing: IngemmetTiming = {},
): Promise<{ total: number; ingested: number }> {
  const requestDelayMs = timing.requestDelayMs ?? INGEMMET_REQUEST_DELAY_MS;
  const ids = await fetchObjectIds(layer, fetchImpl, timing);
  const batches = batchIds(ids);
  let ingested = 0;
  for (const [index, batch] of batches.entries()) {
    if (index > 0) await sleep(requestDelayMs);
    const features = await fetchAdaptive(
      layer,
      batch,
      fetchImpl,
      timing,
      requestDelayMs,
    );
    ingested += features.length;
    await onBatch(features, ingested, ids.length);
  }
  if (ingested < ids.length) {
    throw new Error(
      `${layer.id}: se ingirieron ${ingested} de ${ids.length} features declarados`,
    );
  }
  return { total: ids.length, ingested };
}
