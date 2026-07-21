import { officialProvenance, type Provenance, SOURCES } from "@sismo/contracts";
import { cached } from "../cache.ts";
import { SourceError } from "../errors.ts";
import { fetchJson } from "../http.ts";
import { nowLimaIso } from "../lima-time.ts";

const USGS_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query";

export interface UsgsEvent {
  id: string;
  timeUtcIso: string;
  magnitude: number;
  latitude: number;
  longitude: number;
  depthKm: number;
  place: string;
}

export interface UsgsQuery {
  startTime: string;
  endTime: string;
  minMagnitude?: number;
  maxMagnitude?: number;
  minLatitude?: number;
  maxLatitude?: number;
  minLongitude?: number;
  maxLongitude?: number;
}

interface UsgsFeatureCollection {
  features: Array<{
    id: string;
    properties: {
      mag: number | null;
      place: string | null;
      time: number;
      type: string;
    };
    geometry: { coordinates: [number, number, number] };
  }>;
}

export async function fetchUsgsEvents(
  query: UsgsQuery,
): Promise<{ events: UsgsEvent[]; provenance: Provenance; queryUrl: string }> {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: query.startTime,
    endtime: query.endTime,
    orderby: "time",
  });
  if (query.minMagnitude !== undefined)
    params.set("minmagnitude", String(query.minMagnitude));
  if (query.maxMagnitude !== undefined)
    params.set("maxmagnitude", String(query.maxMagnitude));
  if (query.minLatitude !== undefined)
    params.set("minlatitude", String(query.minLatitude));
  if (query.maxLatitude !== undefined)
    params.set("maxlatitude", String(query.maxLatitude));
  if (query.minLongitude !== undefined)
    params.set("minlongitude", String(query.minLongitude));
  if (query.maxLongitude !== undefined)
    params.set("maxlongitude", String(query.maxLongitude));
  const url = `${USGS_BASE}?${params.toString()}`;

  return cached(`usgs:${url}`, 600_000, async () => {
    const data = await fetchJson<UsgsFeatureCollection>(url, {
      sourceId: "usgs-fdsn",
      timeoutMs: 20_000,
    });
    if (!Array.isArray(data.features)) {
      throw new SourceError({
        kind: "schema",
        sourceId: "usgs-fdsn",
        message: "USGS FDSN no devolvió features",
      });
    }
    const events = data.features
      .filter((feature) => feature.properties.type === "earthquake")
      .map((feature) => ({
        id: feature.id,
        timeUtcIso: new Date(feature.properties.time).toISOString(),
        magnitude: feature.properties.mag ?? Number.NaN,
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        depthKm: feature.geometry.coordinates[2],
        place: feature.properties.place ?? "",
      }))
      .filter((event) => !Number.isNaN(event.magnitude));
    return {
      events,
      queryUrl: url,
      provenance: officialProvenance(SOURCES["usgs-fdsn"], nowLimaIso()),
    };
  });
}
