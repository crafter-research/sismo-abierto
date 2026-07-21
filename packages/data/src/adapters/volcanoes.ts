import {
  officialProvenance,
  type Provenance,
  SOURCES,
  type VolcanoRecord,
} from "@sismo/contracts";
import { cached } from "../cache.ts";
import { SourceError } from "../errors.ts";
import { fetchJson } from "../http.ts";
import { nowLimaIso } from "../lima-time.ts";

const VOLCANO_WFS_URL =
  "https://ide.igp.gob.pe/geoserver/CTS_alertavolcan/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=CTS_alertavolcan%3AActividad_volcanica&outputFormat=application%2Fjson";

interface VolcanoFeatureCollection {
  type: string;
  features: Array<{
    properties: Record<string, unknown>;
  }>;
  timeStamp?: string;
}

export function slugifyVolcano(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface VolcanoCatalog {
  volcanoes: VolcanoRecord[];
  provenance: Provenance;
}

export async function fetchVolcanoes(): Promise<VolcanoCatalog> {
  return cached("volcanoes", 300_000, async () => {
    const data = await fetchJson<VolcanoFeatureCollection>(VOLCANO_WFS_URL, {
      sourceId: "igp-wfs-volcanes",
      timeoutMs: 15_000,
    });
    if (!Array.isArray(data.features) || data.features.length === 0) {
      throw new SourceError({
        kind: "empty",
        sourceId: "igp-wfs-volcanes",
        message: "El WFS volcánico respondió sin features",
      });
    }
    const provenance = officialProvenance(
      SOURCES["igp-wfs-volcanes"],
      nowLimaIso(),
      {
        sourceUpdatedAt: null,
        freshness: "FRESHNESS_UNKNOWN",
        note: "La capa WFS no expone fecha de actualización por registro (verificado vía DescribeFeatureType).",
      },
    );
    const volcanoes = data.features.map((feature) => {
      const props = feature.properties;
      const name = typeof props.volcan === "string" ? props.volcan : null;
      const region = typeof props.region === "string" ? props.region : null;
      const latitude = typeof props.latitud === "number" ? props.latitud : null;
      const longitude =
        typeof props.longitud === "number" ? props.longitud : null;
      const objectId =
        typeof props.objectid === "number" ? props.objectid : null;
      if (
        !name ||
        !region ||
        latitude === null ||
        longitude === null ||
        objectId === null
      ) {
        throw new SourceError({
          kind: "schema",
          sourceId: "igp-wfs-volcanes",
          message: `Feature volcánico ilegible: ${JSON.stringify(props).slice(0, 200)}`,
        });
      }
      return {
        slug: slugifyVolcano(name),
        name,
        region,
        latitude,
        longitude,
        publishedLevel: typeof props.nivel === "string" ? props.nivel : "",
        publishedActivity: typeof props.alerta === "string" ? props.alerta : "",
        publishedReview: typeof props.resena === "string" ? props.resena : "",
        objectId,
        provenance,
      } satisfies VolcanoRecord;
    });
    return { volcanoes, provenance };
  });
}
