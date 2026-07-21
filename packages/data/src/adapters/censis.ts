import { officialProvenance, type Provenance, SOURCES } from "@sismo/contracts";
import { cached } from "../cache.ts";
import { SourceError } from "../errors.ts";
import { fetchSource } from "../http.ts";
import { nowLimaIso, utcIsoToLimaIso } from "../lima-time.ts";
import { parseXlsxRows } from "../xlsx.ts";

const CENSIS_BASE =
  "https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos";

export interface CensisRow {
  dateUtc: string;
  timeUtc: string;
  timeUtcIso: string;
  timeLocalIso: string | null;
  latitude: number;
  longitude: number;
  depthKm: number;
  magnitude: number;
}

export interface CensisCatalog {
  rows: CensisRow[];
  provenance: Provenance;
  queryUrl: string;
}

export interface CensisQuery {
  startDate: string;
  endDate: string;
  minMagnitude?: number;
  maxMagnitude?: number;
  catalogType?: "Instrumental" | "Historico";
}

export function buildCensisUrl(query: CensisQuery): string {
  const params = new URLSearchParams({
    tipoCatalogo: query.catalogType ?? "Instrumental",
    fechaInicio: query.startDate,
    fechaFin: query.endDate,
    minimaMagnitud: String(query.minMagnitude ?? 1.0),
    maximaMagnitud: String(query.maxMagnitude ?? 9.0),
    minimaProfundidad: "0",
    maximaProfundidad: "900",
    latitudNorte: "-1.396",
    latitudSur: "-25.701",
    longitudEste: "-65.624",
    longitudOeste: "-87.382",
  });
  return `${CENSIS_BASE}?${params.toString()}`;
}

export function parseCensisRows(rows: string[][]): CensisRow[] {
  const header = rows[0];
  if (!header || !(header[0] ?? "").toLowerCase().includes("fecha")) {
    throw new SourceError({
      kind: "schema",
      sourceId: "igp-censis-catalogo",
      message: `Header inesperado en XLSX de CENSIS: ${JSON.stringify(header)}`,
    });
  }
  const parsed: CensisRow[] = [];
  for (const row of rows.slice(1)) {
    const [dateUtc, timeUtc, lat, lon, depth, mag] = row;
    if (!dateUtc || !timeUtc) continue;
    const latitude = Number(lat);
    const longitude = Number(lon);
    const depthKm = Number(depth);
    const magnitude = Number(mag);
    if (
      [latitude, longitude, depthKm, magnitude].some((value) =>
        Number.isNaN(value),
      )
    ) {
      throw new SourceError({
        kind: "schema",
        sourceId: "igp-censis-catalogo",
        message: `Fila no numérica en XLSX de CENSIS: ${JSON.stringify(row)}`,
      });
    }
    const timeUtcIso = `${dateUtc}T${timeUtc}Z`;
    if (Number.isNaN(Date.parse(timeUtcIso))) continue;
    parsed.push({
      dateUtc,
      timeUtc,
      timeUtcIso,
      timeLocalIso: utcIsoToLimaIso(timeUtcIso),
      latitude,
      longitude,
      depthKm,
      magnitude,
    });
  }
  return parsed;
}

export async function fetchCensisCatalog(
  query: CensisQuery,
): Promise<CensisCatalog> {
  const url = buildCensisUrl(query);
  return cached(`censis:${url}`, 3_600_000, async () => {
    const response = await fetchSource(url, {
      sourceId: "igp-censis-catalogo",
      timeoutMs: 30_000,
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    let rows: string[][];
    try {
      rows = parseXlsxRows(bytes);
    } catch (error) {
      throw new SourceError({
        kind: "schema",
        sourceId: "igp-censis-catalogo",
        message: "CENSIS no devolvió un XLSX legible",
        cause: error,
      });
    }
    return {
      rows: parseCensisRows(rows),
      queryUrl: url,
      provenance: officialProvenance(
        SOURCES["igp-censis-catalogo"],
        nowLimaIso(),
        {
          note: "Consulta en origen del catálogo CENSIS; el XLSX no se redistribuye como dataset propio.",
        },
      ),
    };
  });
}
