import { buildEventListResponse } from "@sismo/data";
import Link from "next/link";
import { ClassBadge, SourceBadge } from "../../components/badges";
import { CopyLinkButton } from "../../components/copy-link-button";
import { SourceErrorState } from "../../components/error-state";
import { GlassRange } from "../../components/glass-range";
import { GlassSwitch } from "../../components/glass-switch";
import { GlassToggleGroup } from "../../components/glass-toggle-group";
import { PeruMap } from "../../components/peru-map";
import { formatLimaDateTime, formatMagnitude } from "../../lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Catálogo sísmico" };

type ParamValue = string | string[] | undefined;

interface CatalogSearchParams {
  since?: ParamValue;
  until?: ParamValue;
  minMagnitude?: ParamValue;
  maxMagnitude?: ParamValue;
  ondas?: ParamValue;
}

const RANGE_PRESETS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
];

function lastNonEmpty(value: ParamValue): string | undefined {
  const values = Array.isArray(value) ? value : [value];
  return (
    values.find((entry) => entry !== undefined && entry !== "") || undefined
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const since = lastNonEmpty(params.since);
  const until = lastNonEmpty(params.until);
  const minMagnitudeParam = lastNonEmpty(params.minMagnitude);
  const maxMagnitudeParam = lastNonEmpty(params.maxMagnitude);
  const soloOndas = lastNonEmpty(params.ondas) === "1";
  const minMagnitudeValue = minMagnitudeParam ? Number(minMagnitudeParam) : 1;
  const filters = {
    since,
    until,
    minMagnitude: soloOndas
      ? Math.max(4.5, minMagnitudeValue)
      : minMagnitudeParam
        ? minMagnitudeValue
        : undefined,
    maxMagnitude: maxMagnitudeParam ? Number(maxMagnitudeParam) : undefined,
  };
  const presetValue = RANGE_PRESETS.some((preset) => preset.value === since)
    ? (since as string)
    : "30d";

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
        className="grid gap-x-4 gap-y-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
      >
        <div className="flex w-[248px] flex-col gap-1 text-sm">
          <span className="text-gray-900">Rango</span>
          <GlassToggleGroup
            name="since"
            legend="Rango de fechas del catálogo"
            options={RANGE_PRESETS}
            defaultValue={presetValue}
          />
          <details className="mt-1">
            <summary className="cursor-pointer text-gray-800 text-xs">
              Fechas exactas
            </summary>
            <div className="mt-2 flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-gray-900">Desde</span>
                <input
                  type="date"
                  name="since"
                  defaultValue={presetValue === since ? "" : (since ?? "")}
                  className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-gray-900">Hasta</span>
                <input
                  type="date"
                  name="until"
                  defaultValue={until ?? ""}
                  className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
                />
              </label>
            </div>
          </details>
        </div>
        <GlassRange
          name="minMagnitude"
          label="Magnitud mínima"
          min={1}
          max={9}
          step={0.1}
          defaultValue={minMagnitudeParam ? Number(minMagnitudeParam) : 1}
          prefix="M ≥ "
        />
        <GlassRange
          name="maxMagnitude"
          label="Magnitud máxima"
          min={1}
          max={9}
          step={0.1}
          defaultValue={maxMagnitudeParam ? Number(maxMagnitudeParam) : 9}
          prefix="M ≤ "
        />
        <div className="flex flex-col justify-end gap-2 pb-1">
          <GlassSwitch
            name="ondas"
            label="Solo con ondas"
            defaultChecked={soloOndas}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-official px-3 py-2 font-medium text-background-100 text-sm hover:bg-gray-900"
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
