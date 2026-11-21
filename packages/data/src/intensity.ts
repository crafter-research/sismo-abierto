import { haversineKm } from "./geo.ts";

// Allen, Wald y Worden (2012), "Intensity attenuation in active crustal
// regions", J. Seismology 16: 409-433. Variante con distancia hipocentral,
// coeficientes tomados de openquake/hazardlib/gsim/allen_2012_ipe.py.
const C = {
  c0: 2.085,
  c1: 1.428,
  c2: -1.402,
  c4: 0.078,
  m1: -0.209,
  m2: 2.042,
} as const;

// Velocidad media de la onda S en la corteza, para una llegada aproximada.
const S_WAVE_KM_PER_S = 3.5;

export function estimateMmi(magnitude: number, hypocentralKm: number): number {
  const rm = C.m1 + C.m2 * Math.exp(magnitude - 5);
  let distanceTerm = C.c2 * Math.log(Math.sqrt(hypocentralKm ** 2 + rm ** 2));
  if (hypocentralKm > 50) distanceTerm += C.c4 * Math.log(hypocentralKm / 50);
  return C.c0 + C.c1 * magnitude + distanceTerm;
}

export function hypocentralKm(epicentralKm: number, depthKm: number): number {
  return Math.sqrt(epicentralKm ** 2 + depthKm ** 2);
}

/**
 * Epicentral radius (km) where the estimated intensity drops to `mmi`.
 * Returns null when the intensity is already below `mmi` right above the
 * hypocenter, so there is no ring to draw.
 */
export function radiusForMmi(
  magnitude: number,
  depthKm: number,
  mmi: number,
): number | null {
  const atEpicenter = estimateMmi(magnitude, hypocentralKm(0, depthKm));
  if (atEpicenter < mmi) return null;
  let low = 0;
  let high = 5000;
  if (estimateMmi(magnitude, hypocentralKm(high, depthKm)) >= mmi) return high;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (estimateMmi(magnitude, hypocentralKm(mid, depthKm)) >= mmi) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function mmiRoman(mmi: number): string {
  const level = Math.min(12, Math.max(1, Math.round(mmi)));
  return (
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][
      level - 1
    ] ?? "I"
  );
}

export function mmiLabel(mmi: number): string {
  const level = Math.round(mmi);
  if (level <= 1) return "no se siente";
  if (level === 2) return "apenas perceptible";
  if (level === 3) return "débil";
  if (level === 4) return "leve";
  if (level === 5) return "moderado";
  if (level === 6) return "fuerte";
  if (level === 7) return "muy fuerte";
  if (level === 8) return "severo";
  return "violento";
}

export interface DistanceFromEvent {
  epicentralKm: number;
  hypocentralKm: number;
  estimatedMmi: number;
  sWaveSeconds: number;
}

export function distanceFromEvent(
  event: {
    latitude: number;
    longitude: number;
    depthKm: number;
    magnitude: number;
  },
  latitude: number,
  longitude: number,
): DistanceFromEvent {
  const epicentral = haversineKm(
    event.latitude,
    event.longitude,
    latitude,
    longitude,
  );
  const hypocentral = hypocentralKm(epicentral, event.depthKm);
  return {
    epicentralKm: epicentral,
    hypocentralKm: hypocentral,
    estimatedMmi: estimateMmi(event.magnitude, hypocentral),
    sWaveSeconds: hypocentral / S_WAVE_KM_PER_S,
  };
}

/** Point at `distanceKm` from (lat, lon) along `bearingDeg`, on a sphere. */
export function destinationPoint(
  latitude: number,
  longitude: number,
  bearingDeg: number,
  distanceKm: number,
): [number, number] {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const d = distanceKm / R;
  const b = toRad(bearingDeg);
  const lat1 = toRad(latitude);
  const lon1 = toRad(longitude);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [toDeg(lon2), toDeg(lat2)];
}
