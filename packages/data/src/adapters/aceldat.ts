import { officialProvenance, type Provenance, SOURCES } from "@sismo/contracts";
import { cached } from "../cache.ts";
import { SourceError } from "../errors.ts";
import { fetchJson, fetchSource } from "../http.ts";
import { nowLimaIso, utcIsoToAceldatDatetime } from "../lima-time.ts";

export const ACELDAT_API_BASE =
  "https://www.igp.gob.pe/servicios/api-acelerometrica";

export interface AceldatReport {
  reportNumber: number;
  timeUtcIso: string;
  magnitude: number;
  reference: string;
}

export interface AceldatStation {
  network: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: "acc" | "sis";
  order: number;
}

export interface AceldatEventDetail {
  reportNumber: number;
  timeUtcIso: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  depthKm: number;
  intensity: string | null;
  reference: string;
  stations: AceldatStation[];
  provenance: Provenance;
}

interface MongoDate {
  $date: { $numberLong: number | string };
}

interface RawReport {
  _id: string;
  numeroReporte: number;
  fechaHora: MongoDate;
  magnitud: number;
  referencia: string;
}

interface RawBreadcrumb {
  _id: number;
  event: {
    num: number;
    fec: string;
    pos: { type: string; coordinates: [number, number] };
    mag: number;
    pro: number;
    int?: string;
    ref: string;
  };
  stats: Array<{
    net: string;
    cod: string;
    nom: string;
    pos: { type: string; coordinates: [number, number] };
    typ: string;
    order: number;
  }>;
}

function mongoDateToIso(value: MongoDate, context: string): string {
  const millis = Number(value?.$date?.$numberLong);
  if (Number.isNaN(millis)) {
    throw new SourceError({
      kind: "schema",
      sourceId: "igp-aceldat",
      message: `fechaHora ilegible en ${context}`,
    });
  }
  return new Date(millis).toISOString();
}

export async function fetchAceldatReports(): Promise<{
  reports: AceldatReport[];
  provenance: Provenance;
}> {
  return cached("aceldat:reportes2", 300_000, async () => {
    const raw = await fetchJson<RawReport[]>(
      `${ACELDAT_API_BASE}/ran/reportes2`,
      {
        sourceId: "igp-aceldat",
        method: "POST",
        body: "{}",
        timeoutMs: 15_000,
      },
    );
    if (!Array.isArray(raw)) {
      throw new SourceError({
        kind: "schema",
        sourceId: "igp-aceldat",
        message: "reportes2 no devolvió un array",
      });
    }
    const reports = raw.map((report) => {
      if (
        typeof report.numeroReporte !== "number" ||
        typeof report.magnitud !== "number"
      ) {
        throw new SourceError({
          kind: "schema",
          sourceId: "igp-aceldat",
          message: `Reporte ACELDAT con campos inesperados: ${JSON.stringify(report).slice(0, 200)}`,
        });
      }
      return {
        reportNumber: report.numeroReporte,
        timeUtcIso: mongoDateToIso(
          report.fechaHora,
          `reporte ${report.numeroReporte}`,
        ),
        magnitude: report.magnitud,
        reference: report.referencia ?? "",
      };
    });
    return {
      reports,
      provenance: officialProvenance(SOURCES["igp-aceldat"], nowLimaIso(), {
        note: "Endpoint no documentado descubierto en la SPA pública de ACELDAT; tratado como contrato inestable.",
      }),
    };
  });
}

export async function fetchAceldatEventDetail(
  timeUtcIso: string,
): Promise<AceldatEventDetail> {
  const datetime = utcIsoToAceldatDatetime(timeUtcIso);
  if (!datetime) {
    throw new SourceError({
      kind: "schema",
      sourceId: "igp-aceldat",
      message: `No se pudo derivar el datetime ACELDAT desde ${timeUtcIso}`,
    });
  }
  return cached(`aceldat:breadcrumb:${datetime}`, 300_000, async () => {
    const raw = await fetchJson<RawBreadcrumb>(
      `${ACELDAT_API_BASE}/ran/breadcrumbstations2`,
      {
        sourceId: "igp-aceldat",
        method: "POST",
        body: JSON.stringify({ datetime }),
        timeoutMs: 15_000,
      },
    );
    const event = raw?.event;
    if (!event || typeof event.num !== "number" || !Array.isArray(raw.stats)) {
      throw new SourceError({
        kind: "schema",
        sourceId: "igp-aceldat",
        message: `breadcrumbstations2 sin event/stats para ${datetime}`,
      });
    }
    const [eventLon, eventLat] = event.pos?.coordinates ?? [null, null];
    if (typeof eventLon !== "number" || typeof eventLat !== "number") {
      throw new SourceError({
        kind: "schema",
        sourceId: "igp-aceldat",
        message: `Coordenadas de evento ilegibles para ${datetime}`,
      });
    }
    const stations: AceldatStation[] = raw.stats.map((station) => {
      const [lon, lat] = station.pos?.coordinates ?? [null, null];
      if (
        typeof lon !== "number" ||
        typeof lat !== "number" ||
        typeof station.cod !== "string"
      ) {
        throw new SourceError({
          kind: "schema",
          sourceId: "igp-aceldat",
          message: `Estación ilegible en ${datetime}: ${JSON.stringify(station).slice(0, 200)}`,
        });
      }
      return {
        network: station.net,
        code: station.cod,
        name: station.nom,
        latitude: lat,
        longitude: lon,
        kind: station.typ === "acc" ? "acc" : "sis",
        order: station.order,
      };
    });
    return {
      reportNumber: event.num,
      timeUtcIso: event.fec,
      latitude: eventLat,
      longitude: eventLon,
      magnitude: event.mag,
      depthKm: event.pro,
      intensity: event.int ?? null,
      reference: event.ref,
      stations,
      provenance: officialProvenance(SOURCES["igp-aceldat"], nowLimaIso(), {
        note: "Endpoint no documentado descubierto en la SPA pública de ACELDAT; tratado como contrato inestable.",
      }),
    };
  });
}

export function buildAceldatFileUrl(
  reportNumber: number,
  timeUtcIso: string,
  stationCode: string,
  network: string,
): string | null {
  const datetime = utcIsoToAceldatDatetime(timeUtcIso);
  if (!datetime) return null;
  return `${ACELDAT_API_BASE}/ran/file/${reportNumber}_${datetime}_${stationCode}_${network}.txt`;
}

export async function fetchAceldatRawFile(url: string): Promise<string> {
  return cached(`aceldat:file:${url}`, 3_600_000, async () => {
    const response = await fetchSource(url, {
      sourceId: "igp-aceldat",
      timeoutMs: 30_000,
    });
    const text = await response.text();
    if (!text.includes("INSTITUTO GEOFISICO DEL PERU")) {
      throw new SourceError({
        kind: "schema",
        sourceId: "igp-aceldat",
        message: `El archivo ${url} no tiene el header ACELDAT esperado`,
      });
    }
    return text;
  });
}
