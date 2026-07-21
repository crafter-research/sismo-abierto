import { officialProvenance, type Provenance, SOURCES } from "@sismo/contracts";
import { cached } from "../cache.ts";
import { SourceError } from "../errors.ts";
import { fetchJson } from "../http.ts";
import { nowLimaIso } from "../lima-time.ts";

const INSTRUMENTAL_WFS_URL =
  "https://ide.igp.gob.pe/geoserver/CTS_sismoinstrumental/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=CTS_sismoinstrumental%3Acatalogo_instrumental&outputFormat=application%2Fjson";

export interface InstrumentalEvent {
  dateUtc: string;
  timeUtc: string;
  magnitude: number;
  depthKm: number;
  latitude: number;
  longitude: number;
  epicenter: string;
  classification: string;
  year: number;
}

interface InstrumentalFeatureCollection {
  features: Array<{ properties: Record<string, unknown> }>;
  totalFeatures?: number;
}

export async function fetchInstrumentalSample(count = 100): Promise<{
  events: InstrumentalEvent[];
  totalFeatures: number | null;
  maxYear: number | null;
  provenance: Provenance;
}> {
  const url = `${INSTRUMENTAL_WFS_URL}&count=${count}&sortBy=fecha_utc+D`;
  return cached(`instrumental:${count}`, 3_600_000, async () => {
    const data = await fetchJson<InstrumentalFeatureCollection>(url, {
      sourceId: "igp-wfs-instrumental",
      timeoutMs: 20_000,
    });
    if (!Array.isArray(data.features)) {
      throw new SourceError({
        kind: "schema",
        sourceId: "igp-wfs-instrumental",
        message: "El WFS instrumental no devolvió features",
      });
    }
    const events = data.features.map((feature) => {
      const props = feature.properties;
      return {
        dateUtc: String(props.fecha_utc ?? ""),
        timeUtc: String(props.hora_utc ?? ""),
        magnitude: Number(props.magnitud ?? Number.NaN),
        depthKm: Number(props.profundidad ?? Number.NaN),
        latitude: Number(props.latitud ?? Number.NaN),
        longitude: Number(props.longitud ?? Number.NaN),
        epicenter: String(props.epicentro ?? ""),
        classification: String(props.clasificacion ?? ""),
        year: Number(props.year ?? Number.NaN),
      };
    });
    const maxYear = events.length
      ? Math.max(
          ...events
            .map((event) => event.year)
            .filter((year) => !Number.isNaN(year)),
        )
      : null;
    return {
      events,
      totalFeatures: data.totalFeatures ?? null,
      maxYear,
      provenance: officialProvenance(
        SOURCES["igp-wfs-instrumental"],
        nowLimaIso(),
        {
          note: "Fuente explícitamente histórica: el catálogo instrumental WFS se detiene en 2024. Para datos recientes se usa CENSIS.",
          freshness: "STALE",
        },
      ),
    };
  });
}
