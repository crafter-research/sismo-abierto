import { buildEventListResponse } from "@sismo/data";
import Link from "next/link";
import { ClassBadge, SourceBadge } from "../../components/badges";
import { CopyLinkButton } from "../../components/copy-link-button";
import { SourceErrorState } from "../../components/error-state";
import { PeruMap } from "../../components/peru-map";
import { formatLimaDateTime, formatMagnitude } from "../../lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Catálogo sísmico" };

interface CatalogSearchParams {
  since?: string;
  until?: string;
  minMagnitude?: string;
  maxMagnitude?: string;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const filters = {
    since: params.since || undefined,
    until: params.until || undefined,
    minMagnitude: params.minMagnitude ? Number(params.minMagnitude) : undefined,
    maxMagnitude: params.maxMagnitude ? Number(params.maxMagnitude) : undefined,
  };

  let result: Awaited<ReturnType<typeof buildEventListResponse>> | null = null;
  let loadError: unknown = null;
  try {
    result = await buildEventListResponse(filters);
  } catch (error) {
    loadError = error;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Catálogo sísmico</h1>
          <p className="text-sm text-gray-900">
            Consulta reproducible del catálogo CENSIS. Los filtros viven en la
            URL: compártela y cualquiera verá la misma consulta.
          </p>
        </div>
        <CopyLinkButton />
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-900">Desde</span>
          <input
            type="date"
            name="since"
            defaultValue={params.since ?? ""}
            className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-900">Hasta</span>
          <input
            type="date"
            name="until"
            defaultValue={params.until ?? ""}
            className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-900">Magnitud mínima</span>
          <input
            type="number"
            step="0.1"
            min="1"
            max="9"
            name="minMagnitude"
            defaultValue={params.minMagnitude ?? ""}
            className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-900">Magnitud máxima</span>
          <input
            type="number"
            step="0.1"
            min="1"
            max="9"
            name="maxMagnitude"
            defaultValue={params.maxMagnitude ?? ""}
            className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-official px-3 py-2 text-sm font-medium text-background-100 hover:bg-gray-900"
          >
            Filtrar
          </button>
        </div>
      </form>

      {result ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-label="Resultados">
            <p
              className="mb-2 text-sm text-gray-900"
              data-testid="result-count"
            >
              {result.events.length} eventos · <ClassBadge value="official" />
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="catalog-table">
                <caption className="sr-only">
                  Eventos del catálogo CENSIS con filtros aplicados
                </caption>
                <thead>
                  <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
                    <th scope="col" className="py-1.5 pr-2">
                      Fecha y hora (Lima)
                    </th>
                    <th scope="col" className="py-1.5 pr-2">
                      Magnitud
                    </th>
                    <th scope="col" className="py-1.5 pr-2">
                      Profundidad
                    </th>
                    <th scope="col" className="py-1.5 pr-2">
                      Coordenadas
                    </th>
                    <th scope="col" className="py-1.5">
                      Detalle
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.events.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100">
                      <td className="py-1.5 pr-2 font-mono text-xs">
                        {formatLimaDateTime(event.timeLocal)}
                      </td>
                      <td className="py-1.5 pr-2 font-mono">
                        {formatMagnitude(event.magnitude)}
                      </td>
                      <td className="py-1.5 pr-2 font-mono">
                        {event.depthKm} km
                      </td>
                      <td className="py-1.5 pr-2 font-mono text-xs">
                        {event.latitude}, {event.longitude}
                      </td>
                      <td className="py-1.5">
                        <Link
                          href={`/sismos/${event.id}`}
                          className="text-official underline"
                        >
                          Abrir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <SourceBadge provenance={result.provenance} />
            </div>
          </section>
          <aside>
            <PeruMap
              title={`Mapa de ${result.events.length} eventos filtrados`}
              markers={result.events.slice(0, 120).map((event) => ({
                longitude: event.longitude,
                latitude: event.latitude,
                label: `${formatMagnitude(event.magnitude)} · ${event.timeLocal ?? ""}`,
                kind: "epicenter" as const,
                magnitude: event.magnitude,
                href: `/sismos/${event.id}`,
              }))}
            />
          </aside>
        </div>
      ) : (
        <SourceErrorState
          error={loadError}
          context="No pudimos consultar el catálogo CENSIS con estos filtros."
        />
      )}
    </div>
  );
}
