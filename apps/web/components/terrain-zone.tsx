import { NO_STUDY_LABEL, type TerrainZone } from "@sismo/terrain";
import { ClassBadge } from "./badges";

export function TerrainZoneCard({
  zone,
  cityFallback,
}: {
  zone: TerrainZone | null;
  cityFallback?: string;
}) {
  if (!zone) {
    return (
      <div
        className="rounded-lg border border-gray-200 p-4"
        data-testid="terrain-zone"
      >
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="font-semibold">Tipo de suelo</h2>
          <ClassBadge value="unavailable" />
        </div>
        <p className="mt-2 text-sm text-gray-900">
          {`${NO_STUDY_LABEL}${cityFallback ? ` para ${cityFallback}` : ""}.`}{" "}
          La zonificación sísmica del IGP cubre 57 ciudades; este punto queda
          fuera de esa cobertura.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-gray-200 p-4"
      data-testid="terrain-zone"
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="font-semibold">Tipo de suelo</h2>
        <ClassBadge value="official" />
      </div>
      <p className="mt-2 font-mono text-sm text-official">{zone.zone}</p>
      <dl className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-gray-800">Ciudad estudiada:</dt>
          <dd>{zone.city}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-800">Departamento:</dt>
          <dd>{zone.department}</dd>
        </div>
        {zone.studyYear ? (
          <div className="flex gap-2">
            <dt className="text-gray-800">Año del estudio:</dt>
            <dd className="font-mono">{zone.studyYear}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 border-l-2 border-gray-300 pl-3 text-sm text-gray-900">
        {zone.disclaimer}
      </p>
      <div className="mt-3 text-xs text-gray-900">
        <p>
          Fuente:{" "}
          <a
            href={zone.provenance.sourceUrl}
            className="text-official underline"
            rel="noreferrer"
          >
            {zone.provenance.provider} · Zonificación sísmica (WFS)
          </a>
        </p>
        <p>
          Instantánea tomada:{" "}
          <span className="font-mono">
            {zone.provenance.capturedAt.slice(0, 10)}
          </span>
        </p>
      </div>
    </div>
  );
}
