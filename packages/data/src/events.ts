import {
  derivedProvenance,
  EVENT_PROVIDER_IDS,
  type EventProviderId,
  type EventQueryFilters,
  type EventStation,
  type NormalizedEvent,
  type Provenance,
  SOURCES,
} from "@sismo/contracts";
import {
  type AceldatEventDetail,
  buildAceldatFileUrl,
  fetchAceldatEventDetail,
  fetchAceldatReports,
} from "./adapters/aceldat.ts";
import { type CensisRow, fetchCensisCatalog } from "./adapters/censis.ts";
import { fetchLatestEventRaw } from "./adapters/latest.ts";
import {
  fetchSgcEvent,
  fetchSgcEvents,
  fetchSgcLatestEvent,
  fetchSgcRecentEvents,
} from "./adapters/sgc.ts";
import { SourceError } from "./errors.ts";
import { haversineKm } from "./geo.ts";
import { utcDateOnly, utcIsoToLimaIso } from "./lima-time.ts";

const MATCH_TOLERANCE_MS = 90_000;
const MATCH_NOTE =
  "Asociación derivada: mismo tiempo de origen UTC con tolerancia de 90 s entre fuentes oficiales.";

export function censisEventId(row: CensisRow): string {
  const compact = row.timeUtcIso.replace(/[-:]/g, "").replace("Z", "");
  return `censis-${compact}Z_${row.latitude}_${row.longitude}`;
}

export interface ParsedCensisId {
  timeUtcIso: string;
  latitude: number;
  longitude: number;
}

export function parseCensisEventId(id: string): ParsedCensisId | null {
  const match = id.match(/^censis-(\d{8})T(\d{6})Z_(-?[\d.]+)_(-?[\d.]+)$/);
  if (!match) return null;
  const [, date, time, lat, lon] = match;
  if (!date || !time || !lat || !lon) return null;
  const timeUtcIso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}Z`;
  if (Number.isNaN(Date.parse(timeUtcIso))) return null;
  return { timeUtcIso, latitude: Number(lat), longitude: Number(lon) };
}

export function parseRanEventId(id: string): number | null {
  const match = id.match(/^ran-(\d+)$/);
  return match?.[1] ? Number(match[1]) : null;
}

function censisRowToEvent(
  row: CensisRow,
  provenance: Provenance,
): NormalizedEvent {
  return {
    id: censisEventId(row),
    timeUtc: row.timeUtcIso,
    timeLocal: row.timeLocalIso,
    magnitude: row.magnitude,
    depthKm: row.depthKm,
    latitude: row.latitude,
    longitude: row.longitude,
    reference: null,
    intensity: null,
    aceldatReportNumber: null,
    provenance,
    fieldClasses: {
      timeUtc: "official",
      magnitude: "official",
      depthKm: "official",
      latitude: "official",
      longitude: "official",
      timeLocal: "derived",
    },
  };
}

function aceldatDetailToEvent(detail: AceldatEventDetail): NormalizedEvent {
  return {
    id: `ran-${detail.reportNumber}`,
    timeUtc: detail.timeUtcIso,
    timeLocal: utcIsoToLimaIso(detail.timeUtcIso),
    magnitude: detail.magnitude,
    depthKm: detail.depthKm,
    latitude: detail.latitude,
    longitude: detail.longitude,
    reference: detail.reference,
    intensity: detail.intensity,
    aceldatReportNumber: detail.reportNumber,
    provenance: detail.provenance,
    fieldClasses: {
      timeUtc: "official",
      magnitude: "official",
      depthKm: "official",
      latitude: "official",
      longitude: "official",
      reference: "official",
      intensity: "official",
      timeLocal: "derived",
    },
  };
}

async function findAceldatReportByTime(
  timeUtcIso: string,
): Promise<number | null> {
  const target = Date.parse(timeUtcIso);
  if (Number.isNaN(target)) return null;
  try {
    const { reports } = await fetchAceldatReports();
    const match = reports.find(
      (report) =>
        Math.abs(Date.parse(report.timeUtcIso) - target) <= MATCH_TOLERANCE_MS,
    );
    return match?.reportNumber ?? null;
  } catch {
    return null;
  }
}

export function resolveEventProvider(
  value: string | undefined,
): EventProviderId {
  if (value === undefined || value === "") return "igp";
  if ((EVENT_PROVIDER_IDS as readonly string[]).includes(value)) {
    return value as EventProviderId;
  }
  throw new SourceError({
    kind: "invalid",
    sourceId: "event-provider",
    message: `Provider desconocido "${value}". Usa igp o sgc.`,
  });
}

export function eventProviderFromId(eventId: string): EventProviderId {
  return eventId.startsWith("sgc-") ? "sgc" : "igp";
}

export function eventProviderHasStations(provider: EventProviderId): boolean {
  return provider === "igp";
}

export async function getLatestEvent(
  provider: EventProviderId = "igp",
): Promise<NormalizedEvent> {
  if (provider === "sgc") return fetchSgcLatestEvent();
  const raw = await fetchLatestEventRaw();
  const reportNumber = raw.timeUtc
    ? await findAceldatReportByTime(raw.timeUtc)
    : null;
  const compact = raw.timeUtc
    ? raw.timeUtc
        .replace(/[-:]/g, "")
        .replace(/\.\d+Z$/, "Z")
        .replace("Z", "")
    : null;
  const id = reportNumber
    ? `ran-${reportNumber}`
    : compact
      ? `censis-${compact}Z_${raw.latitud}_${raw.longitud}`
      : "ultimo-sismo";
  return {
    id,
    timeUtc: raw.timeUtc,
    timeLocal: raw.timeLocal,
    magnitude: raw.magnitud,
    depthKm: raw.profundidad,
    latitude: raw.latitud,
    longitude: raw.longitud,
    reference: raw.referencia,
    intensity: raw.intensidad,
    aceldatReportNumber: reportNumber,
    provenance: raw.provenance,
    fieldClasses: {
      timeUtc: "derived",
      timeLocal: "official",
      magnitude: "official",
      depthKm: "official",
      latitude: "official",
      longitude: "official",
      reference: "official",
      intensity: "official",
      ...(reportNumber ? { aceldatReportNumber: "derived" } : {}),
    },
  };
}

export async function getRecentMajorEvent(
  provider: EventProviderId,
  minMagnitude = 7,
): Promise<NormalizedEvent | null> {
  const events =
    provider === "sgc"
      ? await fetchSgcRecentEvents()
      : (
          await queryEventCatalog({
            provider,
            since: "5d",
            minMagnitude,
          })
        ).events;
  return selectMajorEvent(events, minMagnitude);
}

export function selectMajorEvent(
  events: NormalizedEvent[],
  minMagnitude = 7,
): NormalizedEvent | null {
  return events.find((event) => event.magnitude >= minMagnitude) ?? null;
}

export function eventProviderLocalDate(
  provider: EventProviderId,
  now = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: provider === "sgc" ? "America/Bogota" : "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function resolveEventDateRange(
  filters: EventQueryFilters,
  now = new Date(),
): {
  start: string;
  end: string;
} {
  const provider = filters.provider ?? "igp";
  const today = eventProviderLocalDate(provider, now);
  const end = filters.until ?? today;
  let start: string;
  if (!filters.since) {
    start = new Date(Date.parse(`${today}T00:00:00Z`) - 30 * 86_400_000)
      .toISOString()
      .slice(0, 10);
  } else {
    const durationMatch = filters.since.match(/^(\d+)d$/);
    if (filters.since === "ytd") {
      start = `${today.slice(0, 4)}-01-01`;
    } else {
      start = durationMatch?.[1]
        ? new Date(
            Date.parse(`${today}T00:00:00Z`) -
              Number(durationMatch[1]) * 86_400_000,
          )
            .toISOString()
            .slice(0, 10)
        : filters.since.slice(0, 10);
    }
  }
  if (Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) {
    throw new SourceError({
      kind: "schema",
      sourceId: provider === "sgc" ? "sgc-sismos" : "igp-censis-catalogo",
      message: `Rango de fechas inválido: ${filters.since} → ${filters.until}`,
    });
  }
  return { start, end };
}

export async function queryEventCatalog(filters: EventQueryFilters): Promise<{
  events: NormalizedEvent[];
  provenance: Provenance;
  queryUrl: string;
  range: { start: string; end: string };
}> {
  const numericFilters = [
    ["minMagnitude", filters.minMagnitude],
    ["maxMagnitude", filters.maxMagnitude],
    ["minDepthKm", filters.minDepthKm],
    ["maxDepthKm", filters.maxDepthKm],
  ] as const;
  const invalidFilter = numericFilters.find(
    ([, value]) => value !== undefined && !Number.isFinite(value),
  );
  if (invalidFilter) {
    throw new SourceError({
      kind: "invalid",
      sourceId:
        filters.provider === "sgc" ? "sgc-sismos" : "igp-censis-catalogo",
      message: `Filtro numérico inválido: ${invalidFilter[0]}.`,
    });
  }
  const { start, end } = resolveEventDateRange(filters);
  if (filters.provider === "sgc") {
    const result = await fetchSgcEvents({ start, end }, filters);
    return { ...result, range: { start, end } };
  }
  const catalog = await fetchCensisCatalog({
    startDate: start,
    endDate: end,
    minMagnitude: filters.minMagnitude,
    maxMagnitude: filters.maxMagnitude,
  });
  let rows = catalog.rows;
  if (filters.minDepthKm !== undefined) {
    rows = rows.filter((row) => row.depthKm >= (filters.minDepthKm ?? 0));
  }
  if (filters.maxDepthKm !== undefined) {
    rows = rows.filter((row) => row.depthKm <= (filters.maxDepthKm ?? 900));
  }
  const events = rows
    .map((row) => censisRowToEvent(row, catalog.provenance))
    .sort((a, b) =>
      a.timeUtc && b.timeUtc ? b.timeUtc.localeCompare(a.timeUtc) : 0,
    );
  return {
    events,
    provenance: catalog.provenance,
    queryUrl: catalog.queryUrl,
    range: { start, end },
  };
}

export async function getEvent(eventId: string): Promise<NormalizedEvent> {
  if (eventId.startsWith("sgc-")) return fetchSgcEvent(eventId);
  const reportNumber = parseRanEventId(eventId);
  if (reportNumber !== null) {
    const { reports } = await fetchAceldatReports();
    const report = reports.find((entry) => entry.reportNumber === reportNumber);
    if (!report) {
      throw new SourceError({
        kind: "not_found",
        sourceId: "igp-aceldat",
        message: `No existe el reporte ACELDAT ${reportNumber}`,
      });
    }
    const detail = await fetchAceldatEventDetail(report.timeUtcIso);
    return aceldatDetailToEvent(detail);
  }

  const parsed = parseCensisEventId(eventId);
  if (!parsed) {
    throw new SourceError({
      kind: "not_found",
      sourceId: "igp-censis-catalogo",
      message: `ID de evento no reconocido: ${eventId}`,
    });
  }
  const day = utcDateOnly(parsed.timeUtcIso);
  const catalog = await fetchCensisCatalog({ startDate: day, endDate: day });
  const row = catalog.rows.find(
    (entry) =>
      entry.timeUtcIso === parsed.timeUtcIso &&
      Math.abs(entry.latitude - parsed.latitude) < 0.011 &&
      Math.abs(entry.longitude - parsed.longitude) < 0.011,
  );
  if (!row) {
    throw new SourceError({
      kind: "not_found",
      sourceId: "igp-censis-catalogo",
      message: `El catálogo CENSIS no contiene el evento ${eventId}`,
    });
  }
  const event = censisRowToEvent(row, catalog.provenance);
  const reportMatch = await findAceldatReportByTime(row.timeUtcIso);
  if (reportMatch) {
    event.aceldatReportNumber = reportMatch;
    event.fieldClasses.aceldatReportNumber = "derived";
    event.provenance = { ...event.provenance };
  }
  return event;
}

export async function listEventStations(eventId: string): Promise<{
  stations: EventStation[];
  detail: AceldatEventDetail;
  provenance: Provenance;
}> {
  if (eventProviderFromId(eventId) === "sgc") {
    throw new SourceError({
      kind: "not_found",
      sourceId: "sgc-sismos",
      message:
        "La primera integración del SGC expone catálogo y detalle, no estaciones ni formas de onda.",
    });
  }
  let reportNumber = parseRanEventId(eventId);
  let timeUtcIso: string | null = null;

  if (reportNumber === null) {
    const parsed = parseCensisEventId(eventId);
    if (!parsed) {
      throw new SourceError({
        kind: "not_found",
        sourceId: "igp-aceldat",
        message: `ID de evento no reconocido: ${eventId}`,
      });
    }
    reportNumber = await findAceldatReportByTime(parsed.timeUtcIso);
    if (reportNumber === null) {
      throw new SourceError({
        kind: "not_found",
        sourceId: "igp-aceldat",
        message:
          "ACELDAT no publica un reporte acelerométrico para este evento (usualmente requiere M4.5+)",
      });
    }
  }

  const { reports } = await fetchAceldatReports();
  const report = reports.find((entry) => entry.reportNumber === reportNumber);
  if (!report) {
    throw new SourceError({
      kind: "not_found",
      sourceId: "igp-aceldat",
      message: `No existe el reporte ACELDAT ${reportNumber}`,
    });
  }
  timeUtcIso = report.timeUtcIso;
  const detail = await fetchAceldatEventDetail(timeUtcIso);
  const stationProvenance = derivedProvenance(
    detail.provenance,
    "Distancia epicentral calculada por el proyecto con la fórmula de haversine sobre coordenadas oficiales.",
  );
  const stations: EventStation[] = detail.stations.map((station) => ({
    code: station.code,
    network: station.network,
    name: station.name,
    latitude: station.latitude,
    longitude: station.longitude,
    kind: station.kind,
    order: station.order,
    epicentralDistanceKm:
      Math.round(
        haversineKm(
          detail.latitude,
          detail.longitude,
          station.latitude,
          station.longitude,
        ) * 10,
      ) / 10,
    hasWaveform: station.kind === "acc",
    officialPga: null,
    provenance: station.kind === "acc" ? detail.provenance : stationProvenance,
  }));
  return { stations, detail, provenance: detail.provenance };
}

export function waveformFileUrl(
  detail: AceldatEventDetail,
  stationCode: string,
): string | null {
  const station = detail.stations.find(
    (entry) => entry.code === stationCode && entry.kind === "acc",
  );
  if (!station) return null;
  return buildAceldatFileUrl(
    detail.reportNumber,
    detail.timeUtcIso,
    station.code,
    station.network,
  );
}

export const EVENT_SOURCES = SOURCES;
export { MATCH_NOTE };
