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
    byCity.set(key, { city: ciudad, department, zoneCount: 1 });
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

export { NO_STUDY_LABEL, TERRAIN_DISCLAIMER };
