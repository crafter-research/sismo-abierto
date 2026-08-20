import {
  AGGREGATE_LAYERS,
  LAYERS_WITH_SOURCE_SHORTFALL,
  TERRAIN_WFS_URL,
  type TerrainDimension,
  WFS_MAX_ATTEMPTS,
  WFS_PAGE_SIZE,
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
  /** Features que la fuente declaró y nunca entregó. 0 en una capa sana. */
  shortfall: number;
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

export function buildFeatureUrl(layer: string, startIndex = 0): string {
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: layer,
    outputFormat: "application/json",
    count: String(WFS_PAGE_SIZE),
  });
  if (startIndex > 0) params.set("startIndex", String(startIndex));
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

interface WfsPage {
  features: { properties?: Record<string, unknown>; geometry?: unknown }[];
  matched: number;
}

/**
 * Trae una página reintentando el fallo silencioso del WFS.
 *
 * Una respuesta sin `features` no se trata como página vacía: se reintenta y, si
 * insiste, se lanza. Contar eso como cero publicaría cobertura incompleta sin
 * que nadie lo note, que es exactamente el modo de falla medido.
 */
async function fetchPage(
  layer: string,
  startIndex: number,
  fetchImpl: typeof fetch,
  retryBackoffMs: number,
): Promise<WfsPage> {
  let lastError = "";
  for (let attempt = 1; attempt <= WFS_MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(retryBackoffMs);
    let payload: unknown;
    try {
      const response = await fetchImpl(buildFeatureUrl(layer, startIndex));
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
    return {
      features: body.features,
      matched: Number(body.numberMatched ?? body.features.length),
    };
  }
  throw new Error(
    `El WFS del IGP no devolvió features para ${layer} (startIndex=${startIndex}) tras ${WFS_MAX_ATTEMPTS} intentos: ${lastError}`,
  );
}

/**
 * Trae una capa entera, paginando hasta cubrir `numberMatched`.
 *
 * El servidor topa en 100 features por petición aunque se pida más, así que una
 * sola petición devuelve capas incompletas en silencio. El loop corta cuando ya
 * juntó el total declarado o cuando una página vuelve vacía.
 *
 * Si al final faltan features se lanza, salvo en las capas donde el hueco ya
 * está medido y es de la fuente (`LAYERS_WITH_SOURCE_SHORTFALL`): ahí se
 * devuelve lo que hay con `shortfall > 0` para que el faltante quede contado en
 * vez de tumbar la corrida entera.
 */
export async function fetchLayer(
  layer: string,
  fetchImpl: typeof fetch = fetch,
  timing: IngestTiming = {},
): Promise<LayerIngestResult> {
  const retryBackoffMs = timing.retryBackoffMs ?? WFS_RETRY_BACKOFF_MS;
  const requestDelayMs = timing.requestDelayMs ?? WFS_REQUEST_DELAY_MS;
  const city = cityFromLayerName(layer);
  const dimension = layer.slice(0, layer.indexOf(":")) as TerrainDimension;

  const collected: {
    properties?: Record<string, unknown>;
    geometry?: unknown;
  }[] = [];
  let matched = 0;
  for (let page = 0; ; page++) {
    if (page > 0) await sleep(requestDelayMs);
    const result = await fetchPage(
      layer,
      page * WFS_PAGE_SIZE,
      fetchImpl,
      retryBackoffMs,
    );
    if (page === 0) matched = result.matched;
    collected.push(...result.features);
    if (result.features.length === 0) break;
    if (collected.length >= matched) break;
  }

  const shortfall =
    Number.isFinite(matched) && collected.length < matched
      ? matched - collected.length
      : 0;
  if (shortfall > 0 && !LAYERS_WITH_SOURCE_SHORTFALL.has(layer)) {
    throw new Error(
      `El WFS del IGP sirvió ${collected.length} de ${matched} features para ${layer} incluso paginando: la fuente declara más de lo que entrega.`,
    );
  }

  return {
    layer,
    city,
    matched,
    shortfall,
    features: collected.map((feature) => ({
      dimension,
      layer,
      city,
      properties: feature.properties ?? {},
      geometry: feature.geometry ?? null,
    })),
  };
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
