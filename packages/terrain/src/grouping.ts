import { NO_STUDY_LABEL } from "./constants.ts";
import { type TerrainZone, zoneAt } from "./zonification.ts";

export interface StationLike {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface GroupedStation<T extends StationLike> {
  station: T;
  peakPga: number | null;
}

export interface TerrainGroup<T extends StationLike> {
  /** null cuando el punto no tiene estudio de zonificación publicado. */
  zone: TerrainZone | null;
  label: string;
  stations: GroupedStation<T>[];
}

export interface TerrainGrouping<T extends StationLike> {
  groups: TerrainGroup<T>[];
  coveredCount: number;
  uncoveredCount: number;
}

/**
 * Agrupa estaciones por el tipo de suelo donde están instaladas.
 *
 * El grupo sin estudio va siempre último y se cuenta aparte: no es un tipo de
 * suelo más, es ausencia de estudio. Nunca se promedia entre grupos porque el
 * número de estaciones por zona suele ser demasiado chico para sostenerlo.
 */
export function groupStationsByZone<T extends StationLike>(
  stations: T[],
  peakPgaOf: (station: T) => number | null = () => null,
): TerrainGrouping<T> {
  const byLabel = new Map<string, TerrainGroup<T>>();
  let coveredCount = 0;
  let uncoveredCount = 0;

  for (const station of stations) {
    const zone = zoneAt(station.longitude, station.latitude);
    const label = zone ? zone.zone : NO_STUDY_LABEL;
    if (zone) {
      coveredCount += 1;
    } else {
      uncoveredCount += 1;
    }
    const entry = byLabel.get(label);
    const grouped: GroupedStation<T> = {
      station,
      peakPga: peakPgaOf(station),
    };
    if (entry) {
      entry.stations.push(grouped);
      continue;
    }
    byLabel.set(label, { zone, label, stations: [grouped] });
  }

  const groups = [...byLabel.values()].sort((a, b) => {
    if (!a.zone) return 1;
    if (!b.zone) return -1;
    return a.label.localeCompare(b.label, "es");
  });

  return { groups, coveredCount, uncoveredCount };
}
