import type { NormalizedEvent } from "@sismo/contracts";
import Link from "next/link";
import { emergencyHref } from "../lib/emergency";

export function MajorEarthquakeBanner({
  event,
  country,
}: {
  event: NormalizedEvent;
  country: string;
}) {
  return (
    <aside
      aria-labelledby="major-earthquake-title"
      className="border-2 border-sem-red bg-gray-1000 p-4 text-background-100 sm:p-5"
      data-testid="major-earthquake-banner"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] text-sem-red uppercase tracking-[0.16em]">
            Emergencia en actualización
          </p>
          <h2
            id="major-earthquake-title"
            className="mt-1 font-semibold text-2xl tracking-tight sm:text-3xl"
          >
            Sismo mayor M {event.magnitude.toFixed(1)} en {country}
          </h2>
          <p className="mt-2 max-w-2xl text-background-100/75 text-sm">
            {event.reference ?? "Ubicación pendiente de publicación"}. Evento
            confirmado por {event.agency ?? event.provenance.source.name}. Los
            parámetros y la situación de afectación pueden cambiar.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={emergencyHref(event)}
            className="inline-flex h-10 items-center bg-background-100 px-4 font-medium text-[14px] text-gray-1000 hover:bg-background-200"
          >
            Información y ayuda
          </Link>
          <Link
            href={`/sismos/${event.id}`}
            className="inline-flex h-10 items-center border border-background-100/35 px-4 font-medium text-[14px] text-background-100 hover:border-background-100"
          >
            Ver evento oficial
          </Link>
        </div>
      </div>
    </aside>
  );
}
