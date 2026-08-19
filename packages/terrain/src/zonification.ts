import { pointInFeature } from "@sismo/geo";
import capturedAt from "../data/captured-at.json";
import snapshot from "../data/zonificacion-sismica.json";
import { NO_STUDY_LABEL, TERRAIN_DISCLAIMER } from "./constants.ts";

interface ZonificacionProperties {
  ciudad: string | null;
  departamento: string | null;
  zona: string | null;
  fecha: string | number | null;
}

interface ZonificacionFeature {
  type: "Feature";
  geometry: { type: string; coordinates: unknown } | null;
  properties: ZonificacionProperties;
}

const features = (snapshot as { features: ZonificacionFeature[] }).features;

export interface TerrainProvenance {
  capturedAt: string;
  sourceUrl: string;
  provider: string;
  license: string;
  featureCount: number;
}

export const TERRAIN_PROVENANCE: TerrainProvenance = {
  capturedAt: capturedAt.capturedAt,
  sourceUrl: capturedAt.sourceUrl,
  provider: capturedAt.provider,
  license: capturedAt.license,
  featureCount: capturedAt.featureCount,
};

export interface TerrainZone {
  city: string;
  department: string;
  zone: string;
  studyYear: string | null;
  disclaimer: string;
  provenance: TerrainProvenance;
}

/**
 * Tipo de suelo publicado para un punto. `null` cuando no hay estudio de
 * zonificación que lo cubra: ausencia de estudio no es un tipo de suelo.
 */
export function zoneAt(
  longitude: number,
  latitude: number,
): TerrainZone | null {
  for (const feature of features) {
    if (!feature.geometry) continue;
    if (!pointInFeature(feature as never, longitude, latitude)) continue;
    const { ciudad, departamento, zona, fecha } = feature.properties;
    if (!zona) continue;
    return {
      city: ciudad ?? "",
      department: departamento ?? "",
      zone: zona,
      studyYear: fecha == null ? null : String(fecha),
      disclaimer: TERRAIN_DISCLAIMER,
      provenance: TERRAIN_PROVENANCE,
    };
  }
  return null;
}

export interface CoverageCity {
  city: string;
  slug: string;
  department: string;
  zoneCount: number;
}

export interface TerrainCoverage {
  cities: CoverageCity[];
  departments: string[];
  featureCount: number;
  provenance: TerrainProvenance;
}

/** Qué ciudades tienen estudio publicado. Lo que no está acá, no está estudiado. */
export function coverage(): TerrainCoverage {
  const byCity = new Map<string, CoverageCity>();
  const departments = new Set<string>();

  for (const feature of features) {
    const { ciudad, departamento } = feature.properties;
    if (!ciudad) continue;
    const department = departamento ?? "";
    if (department) departments.add(department);
    const key = `${department}::${ciudad}`;
    const entry = byCity.get(key);
    if (entry) {
      entry.zoneCount += 1;
      continue;
    }
    byCity.set(key, {
      city: ciudad,
      slug: citySlug(ciudad),
      department,
      zoneCount: 1,
    });
  }

  return {
    cities: [...byCity.values()].sort((a, b) =>
      a.city.localeCompare(b.city, "es"),
    ),
    departments: [...departments].sort((a, b) => a.localeCompare(b, "es")),
    featureCount: features.length,
    provenance: TERRAIN_PROVENANCE,
  };
}

/** Slug estable para rutas de ciudad: "Cañete" → "canete", "Alto Alianza" → "alto-alianza". */
export function citySlug(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface CityTerrain {
  city: string;
  slug: string;
  department: string;
  /** Centro aproximado de los polígonos de la ciudad, para encuadrar el mapa. */
  center: [number, number];
  zones: { zone: string; studyYear: string | null; polygonCount: number }[];
  provenance: TerrainProvenance;
  disclaimer: string;
}

/** Zonas publicadas para una ciudad, por slug. `null` si no hay estudio. */
export function cityTerrain(slug: string): CityTerrain | null {
  const zones = new Map<
    string,
    { zone: string; studyYear: string | null; polygonCount: number }
  >();
  let city = "";
  let department = "";
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  const trackPoint = (coordinates: unknown): void => {
    if (Array.isArray(coordinates) && typeof coordinates[0] === "number") {
      const [lon, lat] = coordinates as [number, number];
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      return;
    }
    for (const item of (coordinates ?? []) as unknown[]) trackPoint(item);
  };

  for (const feature of features) {
    const props = feature.properties;
    if (!props.ciudad || citySlug(props.ciudad) !== slug) continue;
    city = props.ciudad;
    department = props.departamento ?? "";
    if (feature.geometry) trackPoint(feature.geometry.coordinates);
    if (!props.zona) continue;
    const entry = zones.get(props.zona);
    if (entry) {
      entry.polygonCount += 1;
      continue;
    }
    zones.set(props.zona, {
      zone: props.zona,
      studyYear: props.fecha == null ? null : String(props.fecha),
      polygonCount: 1,
    });
  }

  if (!city) return null;

  return {
    city,
    slug,
    department,
    center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2],
    zones: [...zones.values()].sort((a, b) =>
      a.zone.localeCompare(b.zone, "es"),
    ),
    provenance: TERRAIN_PROVENANCE,
    disclaimer: TERRAIN_DISCLAIMER,
  };
}

export { NO_STUDY_LABEL, TERRAIN_DISCLAIMER };
