import { officialProvenance, type Provenance, SOURCES } from "@sismo/contracts";
import { cached } from "../cache.ts";
import { SourceError } from "../errors.ts";
import { fetchJson } from "../http.ts";
import {
  limaLocalToUtcIso,
  nowLimaIso,
  utcIsoToLimaIso,
} from "../lima-time.ts";

const ARCGIS_URL =
  "https://ide.igp.gob.pe/arcgis/rest/services/monitoreocensis/UltimoSismo/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson";
const WFS_URL =
  "https://ide.igp.gob.pe/geoserver/CTS_ultimosismo/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=CTS_ultimosismo%3Aultimo_sismo&outputFormat=application%2Fjson";

export interface LatestEventRaw {
  fechaLocal: string;
  horaLocal: string;
  magnitud: number;
  profundidad: number;
  latitud: number;
  longitud: number;
  intensidad: string | null;
  referencia: string | null;
  timeUtc: string | null;
  timeLocal: string | null;
  provenance: Provenance;
}

interface GeoJsonFeatureCollection {
  type: string;
  features: Array<{
    geometry: { type: string; coordinates: [number, number] } | null;
    properties: Record<string, unknown>;
  }>;
  timeStamp?: string;
}

export function parseLatestFeatureCollection(
  data: GeoJsonFeatureCollection,
  sourceId: "igp-arcgis-ultimo-sismo" | "igp-wfs-ultimo-sismo",
): LatestEventRaw {
  const feature = data.features?.[0];
  if (!feature) {
    throw new SourceError({
      kind: "empty",
      sourceId,
      message: "La fuente respondió sin features de último sismo",
    });
  }
  const props = feature.properties;
  const fechaLocal =
    typeof props.fecha_local === "string" ? props.fecha_local : null;
  const horaLocal =
    typeof props.hora_local === "string" ? props.hora_local : null;
  const magnitud = typeof props.magnitud === "number" ? props.magnitud : null;
  const profundidad =
    typeof props.profundidad === "number" ? props.profundidad : null;
  const latitud = typeof props.latitud === "number" ? props.latitud : null;
  const longitud = typeof props.longitud === "number" ? props.longitud : null;
  if (
    fechaLocal === null ||
    horaLocal === null ||
    magnitud === null ||
    profundidad === null ||
    latitud === null ||
    longitud === null
  ) {
    throw new SourceError({
      kind: "schema",
      sourceId,
      message: `Campos requeridos ausentes en la respuesta de ${sourceId}`,
    });
  }
  const timeUtc = limaLocalToUtcIso(fechaLocal, horaLocal);
  return {
    fechaLocal,
    horaLocal,
    magnitud,
    profundidad,
    latitud,
    longitud,
    intensidad: typeof props.intensidad === "string" ? props.intensidad : null,
    referencia: typeof props.referencia === "string" ? props.referencia : null,
    timeUtc,
    timeLocal: timeUtc ? utcIsoToLimaIso(timeUtc) : null,
    provenance: officialProvenance(SOURCES[sourceId], nowLimaIso(), {
      sourceUpdatedAt: data.timeStamp ?? null,
      freshness: "FRESHNESS_UNKNOWN",
      note: "La fuente publica un único evento vigente; no expone la hora exacta de su última actualización.",
    }),
  };
}

export async function fetchLatestEventRaw(): Promise<LatestEventRaw> {
  return cached("latest-event", 60_000, async () => {
    try {
      const data = await fetchJson<GeoJsonFeatureCollection>(ARCGIS_URL, {
        sourceId: "igp-arcgis-ultimo-sismo",
        timeoutMs: 10_000,
      });
      return parseLatestFeatureCollection(data, "igp-arcgis-ultimo-sismo");
    } catch (primaryError) {
      const data = await fetchJson<GeoJsonFeatureCollection>(WFS_URL, {
        sourceId: "igp-wfs-ultimo-sismo",
        timeoutMs: 10_000,
      }).catch(() => {
        throw primaryError;
      });
      return parseLatestFeatureCollection(data, "igp-wfs-ultimo-sismo");
    }
  });
}
