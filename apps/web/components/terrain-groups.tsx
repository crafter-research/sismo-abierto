import type { EventStation } from "@sismo/contracts";
import type { TerrainGrouping } from "@sismo/terrain";
import Link from "next/link";
import { ClassBadge } from "./badges";

export function TerrainGroups({
  grouping,
  eventId,
}: {
  grouping: TerrainGrouping<EventStation>;
  eventId: string;
}) {
  if (grouping.groups.length === 0) return null;

  return (
    <div data-testid="terrain-groups">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">Aceleración por tipo de suelo</h2>
        <ClassBadge value="official" />
      </div>
      <p className="mb-3 text-sm text-gray-900">
        Las mismas ondas del mismo sismo, ordenadas por el terreno donde se
        registraron. El tipo de suelo lo publica el IGP; la aceleración pico la
        reporta cada archivo acelerométrico oficial.
      </p>

      <div className="space-y-3">
        {grouping.groups.map((group) => (
          <div
            key={group.label}
            className="rounded-lg border border-gray-200 p-3"
          >
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h3
                className={
                  group.zone
                    ? "font-mono text-sm text-official"
                    : "text-sm text-missing"
                }
              >
                {group.label}
              </h3>
              <span className="text-xs text-gray-800">
                {group.stations.length}{" "}
                {group.stations.length === 1 ? "estación" : "estaciones"}
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {group.stations.map(({ station, peakPga }) => (
                <li key={station.code} className="flex flex-wrap gap-x-3">
                  {station.hasWaveform ? (
                    <Link
                      href={`/sismos/${eventId}/estaciones/${station.code}`}
                      className="font-mono font-medium text-official underline"
                    >
                      {station.code}
                    </Link>
                  ) : (
                    <span className="font-mono">{station.code}</span>
                  )}
                  <span className="text-gray-800">{station.name}</span>
                  <span className="font-mono">
                    {peakPga !== null
                      ? `PGA ${peakPga.toFixed(4)} cm/s²`
                      : "sin archivo acelerométrico"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-800" data-testid="terrain-sample">
        {grouping.coveredCount} de{" "}
        {grouping.coveredCount + grouping.uncoveredCount} estaciones caen dentro
        de una ciudad con estudio de zonificación publicado. Con muestras de
        este tamaño los valores no se promedian entre zonas: la aceleración
        también depende de la distancia al epicentro y de la profundidad del
        sismo, no solo del suelo.
      </p>
    </div>
  );
}
