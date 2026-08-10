import { feature as topologyFeature } from "topojson-client";
import countriesTopoJson from "world-atlas/countries-50m.json";
import departamentosJson from "../data/peru-departamentos.json";
import provinciasJson from "../data/peru-provincias.json";

export interface GeoFeature {
  properties: { name: string };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoCollection {
  features: GeoFeature[];
}

interface CountryGeoFeature extends GeoFeature {
  id?: string;
}

export const departamentos = departamentosJson as GeoCollection;
export const provincias = provinciasJson as GeoCollection;
const countries = topologyFeature(
  countriesTopoJson as never,
  countriesTopoJson.objects.countries as never,
) as unknown as { features: CountryGeoFeature[] };

function featureRings(feature: GeoFeature): number[][][] {
  const { type, coordinates } = feature.geometry;
  if (type === "Polygon") {
    return coordinates as number[][][];
  }
  if (type === "MultiPolygon") {
    return (coordinates as number[][][][]).map((polygon) => polygon[0] ?? []);
  }
  return [];
}

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  let j = ring.length - 1;
  for (let i = 0; i < ring.length; i++) {
    const xi = ring[i]?.[0] ?? 0;
    const yi = ring[i]?.[1] ?? 0;
    const xj = ring[j]?.[0] ?? 0;
    const yj = ring[j]?.[1] ?? 0;
    if (
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
}

export function pointInFeature(
  feature: GeoFeature,
  lon: number,
  lat: number,
): boolean {
  return featureRings(feature).some((ring) => pointInRing(lon, lat, ring));
}

function segmentDistanceDeg(
  lon: number,
  lat: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lonScale: number,
): number {
  const px = (lon - x1) * lonScale;
  const py = lat - y1;
  const dx = (x2 - x1) * lonScale;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq > 0 ? Math.max(0, Math.min(1, (px * dx + py * dy) / lengthSq)) : 0;
  const cx = px - t * dx;
  const cy = py - t * dy;
  return Math.sqrt(cx * cx + cy * cy);
}

export function distanceToBoundaryDeg(
  feature: GeoFeature,
  lon: number,
  lat: number,
): number {
  const lonScale = Math.cos((lat * Math.PI) / 180);
  let min = Number.POSITIVE_INFINITY;
  for (const ring of featureRings(feature)) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (!a || !b) continue;
      const distance = segmentDistanceDeg(
        lon,
        lat,
        a[0] ?? 0,
        a[1] ?? 0,
        b[0] ?? 0,
        b[1] ?? 0,
        lonScale,
      );
      if (distance < min) min = distance;
    }
  }
  return min;
}

const departmentByName = new Map(
  departamentos.features.map((feature) => [feature.properties.name, feature]),
);
const countryById = new Map(
  countries.features
    .filter((country) => typeof country.id === "string")
    .map((country) => [country.id?.padStart(3, "0") ?? "", country]),
);

export function getDepartment(name: string): GeoFeature | null {
  return departmentByName.get(name) ?? null;
}

export function getCountry(id: string): GeoFeature | null {
  return countryById.get(id.padStart(3, "0")) ?? null;
}

export type PointClassification = "inside" | "boundary" | "outside";

export function classifyDepartmentPoint(
  departmentNames: string[],
  lon: number,
  lat: number,
  boundaryMarginDeg: number,
): PointClassification {
  let insideNearBoundary = false;
  let nearCount = 0;
  for (const name of departmentNames) {
    const feature = departmentByName.get(name);
    if (!feature) continue;
    const inside = pointInFeature(feature, lon, lat);
    const distance = distanceToBoundaryDeg(feature, lon, lat);
    if (inside && distance >= boundaryMarginDeg) return "inside";
    if (distance < boundaryMarginDeg) {
      nearCount += 1;
      if (inside) insideNearBoundary = true;
    }
  }
  if (insideNearBoundary && nearCount >= 2) return "inside";
  if (nearCount > 0) return "boundary";
  return "outside";
}

export function classifyCountryPoint(
  countryIds: string[],
  lon: number,
  lat: number,
  boundaryMarginDeg: number,
): PointClassification {
  let insideNearBoundary = false;
  let nearCount = 0;
  for (const id of countryIds) {
    const country = countryById.get(id.padStart(3, "0"));
    if (!country) continue;
    const inside = pointInFeature(country, lon, lat);
    const distance = distanceToBoundaryDeg(country, lon, lat);
    if (inside && distance >= boundaryMarginDeg) return "inside";
    if (distance < boundaryMarginDeg) {
      nearCount += 1;
      if (inside) insideNearBoundary = true;
    }
  }
  if (insideNearBoundary && nearCount >= 2) return "inside";
  if (nearCount > 0) return "boundary";
  return "outside";
}
