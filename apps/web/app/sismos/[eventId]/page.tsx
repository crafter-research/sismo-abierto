import type { EventStation } from "@sismo/contracts";
import {
  eventProviderFromId,
  eventProviderHasStations,
  getEvent,
  isSourceError,
  listEventStations,
} from "@sismo/data";
import type { Metadata } from "next";
import Link from "next/link";
import { ClassBadge, SourceBadge } from "../../../components/badges";
import { CopyLinkButton } from "../../../components/copy-link-button";
import { SourceErrorState } from "../../../components/error-state";
import { GlassQr } from "../../../components/glass-qr";
import { type MapMarker, PeruMap } from "../../../components/peru-map";
import { formatLocalDateTime, formatMagnitude } from "../../../lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const event = await getEvent(eventId);
    const country = eventId.startsWith("sgc-") ? "Colombia" : "Perú";
    const location = event.reference ?? country;
    const title = `Sismo M ${event.magnitude.toFixed(1)} en ${location}`;
    const description = `Detalle del sismo de magnitud ${event.magnitude.toFixed(1)} en ${location}: profundidad ${event.depthKm} km, coordenadas, hora oficial y procedencia.`;
    return {
      title,
      description,
      alternates: { canonical: `/sismos/${eventId}` },
      openGraph: { title, description, url: `/sismos/${eventId}` },
    };
  } catch {
    return {
      title: "Detalle de sismo",
      robots: { index: false, follow: true },
    };
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const provider = eventProviderFromId(eventId);

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
  if (eventProviderHasStations(provider)) {
    try {
      const result = await listEventStations(eventId);
      stations = result.stations;
    } catch (error) {
      stationsError = error;
    }
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
      <nav className="text-xs text-gray-800">
        <Link href={`/?provider=${provider}`} className="hover:underline">
          Sismos
        </Link>{" "}
        / <span className="font-mono">{event.id}</span>
      </nav>

      <header
        className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-gray-200 p-4"
        data-testid="event-header"
      >
        <div className="min-w-0 flex-1">
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
              <dt className="text-gray-800">Hora de origen:</dt>
              <dd className="font-mono">
                {formatLocalDateTime(
                  event.timeLocal,
                  event.provenance.timezone,
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-800">Profundidad:</dt>
              <dd className="font-mono">{event.depthKm} km</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-800">Coordenadas:</dt>
              <dd className="font-mono">
                {event.latitude}, {event.longitude}
              </dd>
            </div>
            {event.intensity ? (
              <div className="flex gap-2">
                <dt className="text-gray-800">Intensidad:</dt>
                <dd className="font-mono">{event.intensity}</dd>
              </div>
            ) : null}
            {event.reviewStatus ? (
              <div className="flex gap-2">
                <dt className="text-gray-800">Estado del evento:</dt>
                <dd className="font-mono">{event.reviewStatus}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-3">
            <SourceBadge provenance={event.provenance} />
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">
          <GlassQr
            value={`https://sismo.crafter.run/sismos/${event.id}`}
            size={124}
            label={`Código QR del enlace permanente del evento ${event.id}`}
          />
        </div>
      </header>

      <section
        className={
          stations.length > 0
            ? "grid gap-6 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)]"
            : "grid gap-6 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]"
        }
        aria-labelledby="estaciones-titulo"
      >
        <div>
          <h2 id="estaciones-titulo" className="mb-2 font-semibold">
            {stations.length > 0 ? "Mapa de estaciones" : "Epicentro"}
          </h2>
          <PeruMap
            country={provider === "sgc" ? "colombia" : "peru"}
            showProvinces={stations.length > 0}
            className="max-w-[440px]"
            title={`Epicentro y estaciones del evento ${event.id}`}
            markers={markers}
          />
        </div>
        <div>
          <h2 className="mb-2 font-semibold">
            {provider === "sgc"
              ? "Cobertura de esta integración"
              : "Estaciones que registraron este evento"}
          </h2>
          {provider === "sgc" ? (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-background-200 p-4 text-gray-900 text-sm">
              <p>
                Esta primera integración conserva catálogo, detalle, estado de
                revisión y procedencia del SGC. Las estaciones y formas de onda
                no están integradas todavía.
              </p>
              {event.sourceEventId ? (
                <a
                  href={`https://www.sgc.gov.co/detallesismo/${event.sourceEventId}/resumen`}
                  className="font-medium text-official underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir detalle oficial en el SGC →
                </a>
              ) : null}
            </div>
          ) : stations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="station-table">
                <caption className="sr-only">
                  Estaciones del evento con distancia epicentral y
                  disponibilidad de ondas
                </caption>
                <thead>
                  <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
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
              <p className="mt-2 text-xs text-gray-800">
                {accStations.length} estaciones acelerométricas con archivo
                descargable · {stations.length - accStations.length} estaciones
                sísmicas de contexto.
              </p>
            </div>
          ) : stationsError ? (
            isSourceError(stationsError) &&
            stationsError.kind === "not_found" ? (
              <div className="space-y-4">
                <div
                  className="rounded-lg border border-gray-200 bg-background-200 p-4 text-gray-900 text-sm"
                  data-testid="no-stations"
                >
                  <p className="flex items-center gap-2 font-medium text-gray-1000">
                    <ClassBadge value="unavailable" />
                    Sin registros acelerométricos para este evento
                  </p>
                  <p className="mt-2">
                    ACELDAT-PERÚ publica reportes por estación para sismos de
                    magnitud aproximadamente 4.5 o superior. Este evento (M{" "}
                    {event.magnitude.toFixed(1)}) quedó por debajo de ese
                    umbral, así que solo existe el registro del catálogo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/sismos?minMagnitude=4.5"
                    className="flex h-9 items-center rounded-md bg-gray-1000 px-3 font-medium text-[13px] text-background-100 hover:bg-gray-900"
                  >
                    Ver Eventos con Ondas
                  </Link>
                  <Link
                    href="/sismos"
                    className="flex h-9 items-center rounded-md border border-gray-400 px-3 font-medium text-[13px] text-gray-1000 hover:bg-background-200"
                  >
                    Explorar Catálogo
                  </Link>
                </div>
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
