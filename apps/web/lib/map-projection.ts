export interface Bounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

export const MAP_WIDTH = 640;

export function projectWith(
  bounds: Bounds,
  height: number,
  lon: number,
  lat: number,
): [number, number] {
  const x =
    ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * MAP_WIDTH;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

export interface MapProjection {
  bounds: Bounds;
  height: number;
  width: number;
}
