import {
  AGGREGATE_LAYERS,
  TERRAIN_WFS_URL,
  type TerrainDimension,
  WFS_MAX_ATTEMPTS,
  WFS_REQUEST_DELAY_MS,
  WFS_RETRY_BACKOFF_MS,
} from "./dimensions.ts";

export interface TerrainFeature {
  dimension: TerrainDimension;
  layer: string;
  city: string;
  properties: Record<string, unknown>;
  geometry: unknown;
}

export interface LayerIngestResult {
  layer: string;
  city: string;
  matched: number;
  features: TerrainFeature[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** `CapacidadPortante:cap_por_alto_alianza` -> `alto_alianza` */
export function cityFromLayerName(layer: string): string {
  const local = layer.slice(layer.indexOf(":") + 1);
  return local.replace(/^(cap_por|suelos|geo[a-z]*|zon(?:a|ificacion)?)_/, "");
}

export function buildGetCapabilitiesUrl(): string {
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetCapabilities",
  });
  return `${TERRAIN_WFS_URL}?${params.toString()}`;
}

export function buildFeatureUrl(layer: string): string {
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: layer,
    outputFormat: "application/json",
  });
  return `${TERRAIN_WFS_URL}?${params.toString()}`;
}

/** Capas de una dimensión, sin las agregadas nacionales truncadas en 100. */
export function layersForDimension(
  capabilitiesXml: string,
  dimension: TerrainDimension,
): string[] {
  const names = capabilitiesXml.match(/<Name>[^<]*<\/Name>/g) ?? [];
  return names
    .map((tag) => tag.slice(6, -7))
    .filter((name) => name.startsWith(`${dimension}:`))
    .filter((name) => !AGGREGATE_LAYERS.has(name));
}

/**
 * Trae una capa reintentando el fallo silencioso del WFS.
 *
 * Una respuesta sin `features` no se trata como capa vacía: se reintenta y, si
 * insiste, se lanza. Contar eso como cero publicaría cobertura incompleta sin
 * que nadie lo note, que es exactamente el modo de falla medido.
 */
export interface IngestTiming {
  /** Pausa entre capas. Los tests la bajan a 0; producción usa la medida. */
  requestDelayMs?: number;
  retryBackoffMs?: number;
}

export async function fetchLayer(
  layer: string,
  fetchImpl: typeof fetch = fetch,
  timing: IngestTiming = {},
): Promise<LayerIngestResult> {
  const retryBackoffMs = timing.retryBackoffMs ?? WFS_RETRY_BACKOFF_MS;
  let lastError = "";
  for (let attempt = 1; attempt <= WFS_MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(retryBackoffMs);
    let payload: unknown;
    try {
      const response = await fetchImpl(buildFeatureUrl(layer));
      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }
      payload = await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }
    const body = payload as {
      features?: { properties?: Record<string, unknown>; geometry?: unknown }[];
      numberMatched?: number | string;
    };
    if (!Array.isArray(body.features)) {
      lastError = "respuesta sin `features` (rate limit silencioso del WFS)";
      continue;
    }
    const matched = Number(body.numberMatched ?? body.features.length);
    if (Number.isFinite(matched) && body.features.length < matched) {
      lastError = `el WFS sirvió ${body.features.length} de ${matched} features (tope por petición); falta paginar con startIndex`;
      continue;
    }
    const city = cityFromLayerName(layer);
    const dimension = layer.slice(0, layer.indexOf(":")) as TerrainDimension;
    return {
      layer,
      city,
      matched,
      features: body.features.map((feature) => ({
        dimension,
        layer,
        city,
        properties: feature.properties ?? {},
        geometry: feature.geometry ?? null,
      })),
    };
  }
  throw new Error(
    `El WFS del IGP no devolvió features para ${layer} tras ${WFS_MAX_ATTEMPTS} intentos: ${lastError}`,
  );
}

/** Recorre las capas en serie, respetando la pausa medida entre peticiones. */
export async function ingestDimension(
  layers: string[],
  fetchImpl: typeof fetch = fetch,
  onProgress?: (result: LayerIngestResult) => void,
  timing: IngestTiming = {},
): Promise<LayerIngestResult[]> {
  const requestDelayMs = timing.requestDelayMs ?? WFS_REQUEST_DELAY_MS;
  const results: LayerIngestResult[] = [];
  for (const [index, layer] of layers.entries()) {
    if (index > 0) await sleep(requestDelayMs);
    const result = await fetchLayer(layer, fetchImpl, timing);
    onProgress?.(result);
    results.push(result);
  }
  return results;
}
