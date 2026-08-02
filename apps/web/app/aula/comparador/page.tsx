import { compareEvents } from "@sismo/aula-content";
import type { NormalizedEvent } from "@sismo/contracts";
import { fetchAceldatReports, getEvent } from "@sismo/data";
import Link from "next/link";
import { ClassBadge, SourceBadge } from "../../../components/badges";
import { CopyLinkButton } from "../../../components/copy-link-button";
import { SourceErrorState } from "../../../components/error-state";
import { PeruMap } from "../../../components/peru-map";
import { formatLimaDateTime, formatMagnitude } from "../../../lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Comparador de eventos" };

function eventName(event: NormalizedEvent, firstId: string, secondId: string) {
  return event.id === firstId
    ? "Evento A"
    : event.id === secondId
      ? "Evento B"
      : "Evento";
}

export default async function EventComparatorPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  let reports: Awaited<ReturnType<typeof fetchAceldatReports>> | null = null;
  let loadError: unknown = null;

  try {
    reports = await fetchAceldatReports();
  } catch (error) {
    loadError = error;
  }

  const available = reports?.reports.slice(0, 40) ?? [];
  const availableIds = new Set(
    available.map((report) => `ran-${report.reportNumber}`),
  );
  const firstId = params.a && availableIds.has(params.a) ? params.a : null;
  const secondId = params.b && availableIds.has(params.b) ? params.b : null;

  let first: NormalizedEvent | null = null;
  let second: NormalizedEvent | null = null;
  let compareError: unknown = null;
  if (firstId && secondId && firstId !== secondId) {
    try {
      [first, second] = await Promise.all([
        getEvent(firstId),
        getEvent(secondId),
      ]);
    } catch (error) {
      compareError = error;
    }
  }

  const comparison = first && second ? compareEvents(first, second) : null;
  const events = first && second ? [first, second] : [];
  const higherMagnitude = events.find(
    (event) => event.id === comparison?.higherMagnitudeId,
  );
  const shallower = events.find(
    (event) => event.id === comparison?.shallowerId,
  );

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-800">
        <Link href="/aula" className="hover:underline">
          Aula
        </Link>{" "}
        / Comparador de eventos
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Compara dos eventos</h1>
          <p className="text-sm text-gray-900">
            Contrasta lugar, magnitud y profundidad de reportes reales de
            ACELDAT-PERÚ. La selección vive en la URL.
          </p>
        </div>
        <CopyLinkButton />
      </header>

      {loadError ? (
        <SourceErrorState
          error={loadError}
          context="No pudimos cargar los reportes de ACELDAT-PERÚ."
        />
      ) : (
        <form
          method="get"
          className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-3"
        >
          {[
            { name: "a", label: "Evento A", value: firstId },
            { name: "b", label: "Evento B", value: secondId },
          ].map((field) => (
            <label key={field.name} className="flex flex-col gap-1 text-sm">
              <span className="text-gray-900">{field.label}</span>
              <select
                name={field.name}
                defaultValue={field.value ?? ""}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">Elegir…</option>
                {available.map((report) => (
                  <option
                    key={report.reportNumber}
                    value={`ran-${report.reportNumber}`}
                  >
                    M {report.magnitude.toFixed(1)} · {report.reference}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded bg-official px-3 py-2 text-sm font-medium text-background-100 hover:bg-gray-900"
            >
              Comparar
            </button>
          </div>
        </form>
      )}

      {compareError ? (
        <SourceErrorState
          error={compareError}
          context="No pudimos cargar el detalle de uno de los eventos."
        />
      ) : null}

      {first && second && comparison ? (
        <section className="space-y-5" data-testid="event-comparison">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">
                Lugar, magnitud y profundidad de los dos eventos comparados
              </caption>
              <thead>
                <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
                  <th scope="col" className="py-1.5 pr-3">
                    Dato
                  </th>
                  <th scope="col" className="py-1.5 pr-3">
                    Evento A
                  </th>
                  <th scope="col" className="py-1.5">
                    Evento B
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="py-2 pr-3 text-left">
                    Lugar
                  </th>
                  <td className="py-2 pr-3">{first.reference}</td>
                  <td className="py-2">{second.reference}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="py-2 pr-3 text-left">
                    Magnitud
                  </th>
                  <td className="py-2 pr-3 font-mono">
                    {formatMagnitude(first.magnitude)}
                  </td>
                  <td className="py-2 font-mono">
                    {formatMagnitude(second.magnitude)}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="py-2 pr-3 text-left">
                    Profundidad
                  </th>
                  <td className="py-2 pr-3 font-mono">{first.depthKm} km</td>
                  <td className="py-2 font-mono">{second.depthKm} km</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="py-2 pr-3 text-left">
                    Fecha y hora
                  </th>
                  <td className="py-2 pr-3 font-mono text-xs">
                    {formatLimaDateTime(first.timeLocal)}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    {formatLimaDateTime(second.timeLocal)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 text-left">
                    Detalle
                  </th>
                  <td className="py-2 pr-3">
                    <Link
                      href={`/sismos/${first.id}`}
                      className="text-official underline"
                    >
                      Abrir evento A →
                    </Link>
                  </td>
                  <td className="py-2">
                    <Link
                      href={`/sismos/${second.id}`}
                      className="text-official underline"
                    >
                      Abrir evento B →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div
              className="rounded-lg border border-explanation bg-explanation-soft p-4 text-sm"
              data-testid="event-comparison-explanation"
            >
              <p className="flex items-center gap-2 font-semibold text-explanation">
                <ClassBadge value="explanation" /> Qué cambia
              </p>
              <ul className="mt-2 list-inside list-disc space-y-2 text-gray-800">
                <li>
                  {higherMagnitude
                    ? `${eventName(higherMagnitude, first.id, second.id)} tiene la mayor magnitud, con una diferencia de ${comparison.magnitudeDelta.toFixed(1)}.`
                    : "Ambos eventos tienen la misma magnitud publicada."}
                </li>
                <li>
                  {shallower
                    ? `${eventName(shallower, first.id, second.id)} es más superficial, con una diferencia de ${comparison.depthDeltaKm.toFixed(1)} km.`
                    : "Ambos eventos tienen la misma profundidad publicada."}
                </li>
                <li>
                  La referencia ubica cada epicentro respecto de una localidad.
                  No describe por sí sola cómo se sintió el sismo en otros
                  lugares.
                </li>
              </ul>
              <p className="mt-3 text-xs text-gray-900">
                Comparación educativa. La magnitud, la profundidad y el lugar no
                bastan por sí solos para estimar peligro o daño.
              </p>
            </div>
            <PeruMap
              title="Epicentros de los dos eventos comparados"
              markers={events.map((event) => ({
                longitude: event.longitude,
                latitude: event.latitude,
                label: `${eventName(event, first.id, second.id)} · ${formatMagnitude(event.magnitude)} · ${event.reference ?? "sin referencia"}`,
                kind: "epicenter" as const,
                magnitude: event.magnitude,
                href: `/sismos/${event.id}`,
              }))}
            />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 border-gray-200 border-t pt-3">
            <p className="flex items-center gap-2 text-xs text-gray-900">
              <ClassBadge value="official" /> Valores publicados por la fuente
            </p>
            {reports ? <SourceBadge provenance={reports.provenance} /> : null}
          </div>
        </section>
      ) : !loadError ? (
        <p
          className="text-sm text-gray-900"
          data-testid="event-comparison-empty"
        >
          Elige dos eventos distintos para compararlos.
        </p>
      ) : null}
    </div>
  );
}
