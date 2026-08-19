import { cached } from "../cache.ts";
import { SourceError } from "../errors.ts";
import { fetchJson } from "../http.ts";

const EMSC_BASE = "https://www.seismicportal.eu/fdsnws/event/1/query";

export interface EmscQuery {
  startTimeUtc: string;
  endTimeUtc: string;
  minMagnitude?: number;
  minLatitude?: number;
  maxLatitude?: number;
  minLongitude?: number;
  maxLongitude?: number;
}

export interface EmscEvent {
  eventTimeUtc: string;
  magnitude: number;
  magnitudeType: string;
  latitude: number;
  longitude: number;
  depthKm: number;
  place: string;
  author: string;
}

interface EmscFeature {
  properties?: {
    time?: string;
    mag?: number;
    magtype?: string;
    lat?: number;
    lon?: number;
    depth?: number;
    flynn_region?: string;
    auth?: string;
  };
}

export function buildEmscUrl(query: EmscQuery): string {
  const params = new URLSearchParams({
    format: "json",
    starttime: query.startTimeUtc,
    endtime: query.endTimeUtc,
  });
  if (query.minMagnitude !== undefined)
    params.set("minmag", String(query.minMagnitude));
  if (query.minLatitude !== undefined)
    params.set("minlat", String(query.minLatitude));
  if (query.maxLatitude !== undefined)
    params.set("maxlat", String(query.maxLatitude));
  if (query.minLongitude !== undefined)
    params.set("minlon", String(query.minLongitude));
  if (query.maxLongitude !== undefined)
    params.set("maxlon", String(query.maxLongitude));
  return `${EMSC_BASE}?${params.toString()}`;
}

/**
 * Tercera fuente de contraste, independiente de USGS y del IGP.
 *
 * Importa porque una publicación puede citar una magnitud que no coincide con
 * ningún catálogo, y con dos fuentes no se distingue "las agencias discrepan
 * entre sí" de "la cifra no sale de ninguna agencia". EMSC conserva el tipo de
 * magnitud (mb, mw, ml), que es justamente lo que las publicaciones omiten.
 */
export async function fetchEmscEvents(
  query: EmscQuery,
): Promise<{ events: EmscEvent[]; queryUrl: string }> {
  const url = buildEmscUrl(query);
  return cached(`emsc:${url}`, 600_000, async () => {
    const data = await fetchJson<{ features?: EmscFeature[] } | null>(url, {
      sourceId: "emsc-seismicportal",
      timeoutMs: 20_000,
      retries: 2,
    });
    // EMSC responde `null` cuando la consulta no tiene resultados, en vez de una
    // colección vacía. Sin este caso una ventana sin sismos revienta la corrida.
    if (data === null) return { events: [], queryUrl: url };
    if (!Array.isArray(data.features)) {
      throw new SourceError({
        kind: "schema",
        sourceId: "emsc-seismicportal",
        message: "EMSC no devolvió features",
      });
    }
    const events: EmscEvent[] = [];
    for (const feature of data.features) {
      const p = feature.properties;
      if (
        !p ||
        typeof p.time !== "string" ||
        typeof p.mag !== "number" ||
        typeof p.lat !== "number" ||
        typeof p.lon !== "number"
      ) {
        continue;
      }
      events.push({
        eventTimeUtc: p.time,
        magnitude: p.mag,
        magnitudeType: p.magtype ?? "desconocida",
        latitude: p.lat,
        longitude: p.lon,
        depthKm: p.depth ?? 0,
        place: p.flynn_region ?? "sin referencia",
        author: p.auth ?? "EMSC",
      });
    }
    return { events, queryUrl: url };
  });
}
