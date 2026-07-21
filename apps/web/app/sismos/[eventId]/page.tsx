import type { EventStation } from "@sismo/contracts";
import { getEvent, isSourceError, listEventStations } from "@sismo/data";
import Link from "next/link";
import { ClassBadge, SourceBadge } from "../../../components/badges";
import { CopyLinkButton } from "../../../components/copy-link-button";
import { SourceErrorState } from "../../../components/error-state";
import { type MapMarker, PeruMap } from "../../../components/peru-map";
import { formatLimaDateTime, formatMagnitude } from "../../../lib/format";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  let event: Awaited<ReturnType<typeof getEvent>> | null = null;
  let eventError: unknown = null;
  try {
    event = await getEvent(eventId);
  } catch (error) {
    eventError = error;
  }

  if (!event) {
    const notFound =
      isSourceError(eventError) && eventError.kind === "not_found";
    return (
      <SourceErrorState
        error={eventError}
        context={
          notFound
            ? `No encontramos el evento ${eventId} en las fuentes oficiales.`
            : "No pudimos cargar este evento desde las fuentes oficiales."
        }
      />
    );
  }

  let stations: EventStation[] = [];
  let stationsError: unknown = null;
  try {
    const result = await listEventStations(eventId);
    stations = result.stations;
  } catch (error) {
    stationsError = error;
  }
  const accStations = stations.filter((station) => station.kind === "acc");

  const markers: MapMarker[] = [
    {
      longitude: event.longitude,
      latitude: event.latitude,
      label: `Epicentro ${formatMagnitude(event.magnitude)}`,
      kind: "epicenter",
      magnitude: event.magnitude,
    },
    ...stations.map((station) => ({
      longitude: station.longitude,
      latitude: station.latitude,
      label: `${station.code} · ${station.name}`,
      kind:
        station.kind === "acc"
          ? ("station-acc" as const)
          : ("station-sis" as const),
      ...(station.hasWaveform
        ? { href: `/sismos/${event.id}/estaciones/${station.code}` }
        : {}),
    })),
  ];

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-500">
        <Link href="/" className="hover:underline">
          Sismos
        </Link>{" "}
        / <span className="font-mono">{event.id}</span>
      </nav>

      <header
        className="rounded-lg border border-gray-200 p-4"
        data-testid="event-header"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="text-2xl font-bold text-official">
              {formatMagnitude(event.magnitude)}
            </h1>
            <span className="text-lg">
              {event.reference ?? "Sin referencia publicada"}
            </span>
            <ClassBadge value="official" />
          </div>
          <CopyLinkButton />
        </div>
        <dl className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-gray-500">Hora de origen:</dt>
            <dd className="font-mono">{formatLimaDateTime(event.timeLocal)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500">Profundidad:</dt>
            <dd className="font-mono">{event.depthKm} km</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500">Coordenadas:</dt>
            <dd className="font-mono">
              {event.latitude}, {event.longitude}
            </dd>
          </div>
          {event.intensity ? (
            <div className="flex gap-2">
              <dt className="text-gray-500">Intensidad:</dt>
              <dd className="font-mono">{event.intensity}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-3">
          <SourceBadge provenance={event.provenance} />
        </div>
      </header>

      <section
        className="grid gap-6 md:grid-cols-2"
        aria-labelledby="estaciones-titulo"
      >
        <div>
          <h2 id="estaciones-titulo" className="mb-2 font-semibold">
            Mapa de estaciones
          </h2>
          <PeruMap
            showProvinces
            title={`Epicentro y estaciones del evento ${event.id}`}
            markers={markers}
          />
        </div>
        <div>
          <h2 className="mb-2 font-semibold">
            Estaciones que registraron este evento
          </h2>
          {stations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="station-table">
                <caption className="sr-only">
                  Estaciones del evento con distancia epicentral y
                  disponibilidad de ondas
                </caption>
                <thead>
                  <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-500">
                    <th scope="col" className="py-1.5 pr-2">
                      Código
                    </th>
                    <th scope="col" className="py-1.5 pr-2">
                      Nombre
                    </th>
                    <th scope="col" className="py-1.5 pr-2">
                      Distancia <ClassBadge value="derived" />
                    </th>
                    <th scope="col" className="py-1.5">
                      Ondas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station) => (
                    <tr key={station.code} className="border-b border-gray-100">
                      <td className="py-1.5 pr-2 font-mono">{station.code}</td>
                      <td className="py-1.5 pr-2">{station.name}</td>
                      <td className="py-1.5 pr-2 font-mono">
                        {station.epicentralDistanceKm !== null
                          ? `${station.epicentralDistanceKm} km`
                          : "—"}
                      </td>
                      <td className="py-1.5">
                        {station.hasWaveform ? (
                          <Link
                            href={`/sismos/${event.id}/estaciones/${station.code}`}
                            className="font-medium text-official underline"
                          >
                            Ver Z, N y E →
                          </Link>
                        ) : (
                          <span className="text-xs text-missing">
                            Sin archivo acelerométrico publicado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-gray-500">
                {accStations.length} estaciones acelerométricas con archivo
                descargable · {stations.length - accStations.length} estaciones
                sísmicas de contexto.
              </p>
            </div>
          ) : stationsError ? (
            isSourceError(stationsError) &&
            stationsError.kind === "not_found" ? (
              <div
                className="rounded-lg border border-gray-200 bg-missing-soft p-4 text-sm text-gray-700"
                data-testid="no-stations"
              >
                <p className="flex items-center gap-2">
                  <ClassBadge value="unavailable" />
                  ACELDAT no publica un reporte acelerométrico para este evento.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  ACELDAT-PERÚ publica reportes para sismos de magnitud
                  aproximadamente 4.5 o superior. Este evento no tiene
                  estaciones con archivo público.
                </p>
              </div>
            ) : (
              <SourceErrorState
                error={stationsError}
                context="No pudimos consultar las estaciones de ACELDAT-PERÚ."
              />
            )
          ) : null}
        </div>
      </section>
    </div>
  );
}
