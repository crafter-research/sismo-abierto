import {
  type EventQueryFilters,
  type NormalizedEvent,
  officialProvenance,
  type Provenance,
  SOURCES,
} from "@sismo/contracts";
import { cached } from "../cache.ts";
import { SourceError } from "../errors.ts";
import { fetchJson } from "../http.ts";

const SGC_API_URL = "https://api.sgc.gov.co/biweekly/biweekly_earthquakes";
const SGC_LATEST_URL =
  "https://archive.sgc.gov.co/feed/v1.0.1/summary/five_days_all.json";
const SGC_DETAIL_BASE = "https://archive.sgc.gov.co/events";
const SGC_MAX_RANGE_DAYS = 31;

interface SgcFeature {
  type: string;
  id: string;
  properties: {
    status: string;
    type: string;
    magType: string;
    agency: string;
    utcTime: string;
    localTime: string;
    place: string;
    mag: number;
    mmi: number | null;
    depth?: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
}

interface SgcFeatureCollection {
  type?: string;
  metadata?: { count?: number };
  features?: SgcFeature[];
  error?: { statusCode?: number; error?: string };
  errorType?: string;
  errorMessage?: string;
}

type CoordinateOrder = "longitude-latitude" | "latitude-longitude";

function utcMinusFiveIso(value: string): string | null {
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?/,
  );
  if (!match?.[1] || !match[2]) return null;
  return `${match[1]}T${match[2]}:${match[3] ?? "00"}-05:00`;
}

function utcIso(value: string): string | null {
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?/,
  );
  if (!match?.[1] || !match[2]) return null;
  return `${match[1]}T${match[2]}:${match[3] ?? "00"}Z`;
}

function nowBogotaIso(): string {
  const now = new Date(Date.now() - 5 * 3_600_000).toISOString();
  return `${now.slice(0, 19)}-05:00`;
}

function sgcProvenance(status?: string): Provenance {
  return officialProvenance(SOURCES["sgc-sismos"], nowBogotaIso(), {
    timezone: "America/Bogota",
    freshness: "FRESHNESS_UNKNOWN",
    note: status
      ? `Estado publicado por el SGC: ${status}. Los parámetros pueden ser revisados.`
      : "Los eventos del SGC pueden cambiar al pasar de automáticos a revisados.",
  });
}

function assertCollection(data: SgcFeatureCollection): SgcFeature[] {
  if (data.error || data.errorType) {
    throw new SourceError({
      kind: "http",
      sourceId: "sgc-sismos",
      message:
        data.error?.error ??
        data.errorMessage ??
        "El SGC devolvió un error dentro de una respuesta HTTP 200",
      httpStatus: data.error?.statusCode ?? 503,
    });
  }
  if (!Array.isArray(data.features)) {
    throw new SourceError({
      kind: "schema",
      sourceId: "sgc-sismos",
      message: "El SGC no devolvió una colección de features",
    });
  }
  return data.features;
}

export function parseSgcFeature(
  feature: SgcFeature,
  coordinateOrder: CoordinateOrder,
): NormalizedEvent {
  const { properties, geometry } = feature;
  const coordinates = geometry?.coordinates;
  if (
    feature.type !== "Feature" ||
    typeof feature.id !== "string" ||
    !Array.isArray(coordinates) ||
    coordinates.length < 3 ||
    typeof properties?.mag !== "number" ||
    typeof properties?.utcTime !== "string" ||
    typeof properties?.localTime !== "string" ||
    typeof properties?.place !== "string"
  ) {
    throw new SourceError({
      kind: "schema",
      sourceId: "sgc-sismos",
      message: "Feature sísmico del SGC con campos requeridos ausentes",
    });
  }
  const longitude =
    coordinateOrder === "longitude-latitude" ? coordinates[0] : coordinates[1];
  const latitude =
    coordinateOrder === "longitude-latitude" ? coordinates[1] : coordinates[0];
  const depthKm = properties.depth ?? coordinates[2];
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof depthKm !== "number" ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    throw new SourceError({
      kind: "schema",
      sourceId: "sgc-sismos",
      message: "Coordenadas o profundidad inválidas en la respuesta del SGC",
    });
  }
  const timeUtc = utcIso(properties.utcTime);
  const timeLocal = utcMinusFiveIso(properties.localTime);
  if (!timeUtc || !timeLocal) {
    throw new SourceError({
      kind: "schema",
      sourceId: "sgc-sismos",
      message: "Fecha ilegible en la respuesta del SGC",
    });
  }
  return {
    id: `sgc-${feature.id}`,
    sourceEventId: feature.id,
    agency: properties.agency,
    reviewStatus: properties.status,
    magnitudeType: properties.magType,
    timeUtc,
    timeLocal,
    magnitude: properties.mag,
    depthKm,
    latitude,
    longitude,
    reference: properties.place,
    intensity:
      typeof properties.mmi === "number" && properties.mmi > 0
        ? `MMI ${properties.mmi}`
        : null,
    aceldatReportNumber: null,
    provenance: sgcProvenance(properties.status),
    fieldClasses: {
      sourceEventId: "official",
      agency: "official",
      reviewStatus: "official",
      magnitudeType: "official",
      timeUtc: "official",
      timeLocal: "official",
      magnitude: "official",
      depthKm: "official",
      latitude: "official",
      longitude: "official",
      reference: "official",
      intensity: "official",
    },
  };
}

export function parseSgcFeatureCollection(
  data: SgcFeatureCollection,
  coordinateOrder: CoordinateOrder = "longitude-latitude",
): NormalizedEvent[] {
  return assertCollection(data)
    .filter(
      (feature) =>
        feature.properties?.type === "earthquake" &&
        feature.properties.agency === "SGC",
    )
    .map((feature) => parseSgcFeature(feature, coordinateOrder));
}

function dateChunks(range: { start: string; end: string }) {
  const chunks: Array<{ start: string; end: string }> = [];
  let cursor = Date.parse(`${range.start}T00:00:00Z`);
  const final = Date.parse(`${range.end}T00:00:00Z`);
  while (cursor <= final) {
    const chunkEnd = Math.min(cursor + 13 * 86_400_000, final);
    chunks.push({
      start: new Date(cursor).toISOString().slice(0, 10),
      end: new Date(chunkEnd).toISOString().slice(0, 10),
    });
    cursor = chunkEnd + 86_400_000;
  }
  return chunks;
}

export function isSgcProviderEnabled(): boolean {
  return (
    process.env.SISMO_SGC_PROVIDER === "true" || process.env.NODE_ENV === "test"
  );
}

export function assertSgcProviderEnabled(): void {
  if (!isSgcProviderEnabled()) {
    throw new SourceError({
      kind: "disabled",
      sourceId: "sgc-sismos",
      message:
        "El provider SGC está listo pero deshabilitado en producción hasta confirmar permiso de reutilización con la institución.",
    });
  }
}

export async function fetchSgcLatestEvent(): Promise<NormalizedEvent> {
  assertSgcProviderEnabled();
  return cached("sgc:latest", 60_000, async () => {
    const data = await fetchJson<SgcFeatureCollection>(SGC_LATEST_URL, {
      sourceId: "sgc-sismos",
      timeoutMs: 15_000,
      expectedContentType: "json",
    });
    const events = parseSgcFeatureCollection(data, "latitude-longitude").sort(
      (a, b) => (b.timeUtc ?? "").localeCompare(a.timeUtc ?? ""),
    );
    const latest = events[0];
    if (!latest) {
      throw new SourceError({
        kind: "empty",
        sourceId: "sgc-sismos",
        message: "El feed oficial del SGC no contiene eventos sísmicos",
      });
    }
    return latest;
  });
}

export async function fetchSgcEvent(eventId: string): Promise<NormalizedEvent> {
  assertSgcProviderEnabled();
  const sourceEventId = eventId.replace(/^sgc-/, "");
  if (!/^SGC\d{4}[a-z]+$/i.test(sourceEventId)) {
    throw new SourceError({
      kind: "not_found",
      sourceId: "sgc-sismos",
      message: `ID SGC no reconocido: ${eventId}`,
    });
  }
  const url = `${SGC_DETAIL_BASE}/${sourceEventId}/detail.json`;
  return cached(`sgc:detail:${sourceEventId}`, 60_000, async () => {
    const feature = await fetchJson<SgcFeature>(url, {
      sourceId: "sgc-sismos",
      timeoutMs: 15_000,
      expectedContentType: "octet-stream",
    });
    return parseSgcFeature(feature, "latitude-longitude");
  });
}

export async function fetchSgcEvents(
  range: { start: string; end: string },
  filters: EventQueryFilters,
): Promise<{
  events: NormalizedEvent[];
  provenance: Provenance;
  queryUrl: string;
}> {
  assertSgcProviderEnabled();
  const startMs = Date.parse(`${range.start}T00:00:00Z`);
  const endMs = Date.parse(`${range.end}T23:59:59Z`);
  const rangeDays = Math.floor((endMs - startMs) / 86_400_000) + 1;
  if (rangeDays < 1 || rangeDays > SGC_MAX_RANGE_DAYS) {
    throw new SourceError({
      kind: "invalid",
      sourceId: "sgc-sismos",
      message: `El provider SGC admite rangos de 1 a ${SGC_MAX_RANGE_DAYS} días para evitar timeouts del origen.`,
    });
  }
  const queryUrl = `https://www.sgc.gov.co/catalogo?start=${range.start}&end=${range.end}`;
  const cacheKey = `sgc:events:${range.start}:${range.end}:${filters.minMagnitude ?? ""}:${filters.maxMagnitude ?? ""}:${filters.minDepthKm ?? ""}:${filters.maxDepthKm ?? ""}`;
  return cached(cacheKey, 60_000, async () => {
    const features: SgcFeature[] = [];
    for (const chunk of dateChunks(range)) {
      const params = new URLSearchParams({
        startdate: `${chunk.start}T00:00:00`,
        enddate: `${chunk.end}T23:59:59`,
      });
      const data = await fetchJson<SgcFeatureCollection>(
        `${SGC_API_URL}?${params.toString()}`,
        {
          sourceId: "sgc-sismos",
          timeoutMs: 20_000,
          expectedContentType: "json",
        },
      );
      features.push(...assertCollection(data));
    }
    const deduped = new Map(features.map((feature) => [feature.id, feature]));
    let events = parseSgcFeatureCollection({
      type: "FeatureCollection",
      features: [...deduped.values()],
    });
    if (filters.minMagnitude !== undefined) {
      events = events.filter(
        (event) => event.magnitude >= (filters.minMagnitude ?? -10),
      );
    }
    if (filters.maxMagnitude !== undefined) {
      events = events.filter(
        (event) => event.magnitude <= (filters.maxMagnitude ?? 10),
      );
    }
    if (filters.minDepthKm !== undefined) {
      events = events.filter(
        (event) => event.depthKm >= (filters.minDepthKm ?? 0),
      );
    }
    if (filters.maxDepthKm !== undefined) {
      events = events.filter(
        (event) => event.depthKm <= (filters.maxDepthKm ?? 1_000),
      );
    }
    events.sort((a, b) => (b.timeUtc ?? "").localeCompare(a.timeUtc ?? ""));
    return {
      events,
      provenance: sgcProvenance(),
      queryUrl,
    };
  });
}
