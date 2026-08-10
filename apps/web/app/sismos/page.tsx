import type { EventProviderId } from "@sismo/contracts";
import {
  buildEventListResponse,
  eventProviderLocalDate,
  isSgcProviderEnabled,
  resolveEventProvider,
  summarizeEventActivity,
} from "@sismo/data";
import type { Metadata } from "next";
import Link from "next/link";
import { ActivitySummary } from "../../components/activity-summary";
import { AutoRefresh } from "../../components/auto-refresh";
import { ClassBadge } from "../../components/badges";
import { CopyLinkButton } from "../../components/copy-link-button";
import { SourceErrorState } from "../../components/error-state";
import { GlassRange } from "../../components/glass-range";
import { GlassSwitch } from "../../components/glass-switch";
import { GlassToggleGroup } from "../../components/glass-toggle-group";
import { PeruMap } from "../../components/peru-map";
import { ProviderSwitcher } from "../../components/provider-switcher";
import { formatLocalDateTime, formatMagnitude } from "../../lib/format";

export const metadata: Metadata = {
  title: isSgcProviderEnabled()
    ? "Catálogo de sismos en Perú y Colombia"
    : "Catálogo de sismos en Perú",
  description: isSgcProviderEnabled()
    ? "Filtra la actividad sísmica oficial de Perú y Colombia por fecha y magnitud con datos trazables del IGP y el SGC."
    : "Filtra la actividad sísmica oficial de Perú por fecha y magnitud con datos trazables del IGP.",
  alternates: { canonical: "/peru/sismos" },
};

type ParamValue = string | string[] | undefined;

interface CatalogSearchParams {
  provider?: ParamValue;
  range?: ParamValue;
  since?: ParamValue;
  until?: ParamValue;
  minMagnitude?: ParamValue;
  maxMagnitude?: ParamValue;
  ondas?: ParamValue;
}

const RANGE_PRESETS = [
  { value: "ytd", label: "Este año" },
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

function scopeLabel({
  since,
  until,
  year,
}: {
  since: string;
  until?: string;
  year: number;
}) {
  if (since === "ytd") return `${year} hasta hoy`;
  const duration = since.match(/^(\d+)d$/)?.[1];
  if (duration) return `Últimos ${duration} días`;
  return `Del ${since} al ${until ?? "día de hoy"}`;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CountryCatalogPage searchParams={searchParams} />;
}

export async function CountryCatalogPage({
  searchParams,
  providerOverride,
}: {
  searchParams: Promise<CatalogSearchParams>;
  providerOverride?: EventProviderId;
}) {
  const params = await searchParams;
  let provider: EventProviderId;
  try {
    provider =
      providerOverride ?? resolveEventProvider(lastNonEmpty(params.provider));
  } catch (error) {
    return (
      <SourceErrorState
        error={error}
        context="El país solicitado no corresponde a una fuente disponible."
      />
    );
  }
  const providerToday = eventProviderLocalDate(provider);
  const year = Number(providerToday.slice(0, 4));
  const rangeParam = lastNonEmpty(params.range);
  const sinceParam = lastNonEmpty(params.since);
  const legacyRange = RANGE_PRESETS.some(
    (preset) => preset.value === sinceParam,
  )
    ? sinceParam
    : undefined;
  const selectedRange =
    rangeParam ?? legacyRange ?? (sinceParam ? undefined : "ytd");
  const exactSince = legacyRange ? undefined : sinceParam;
  const since = selectedRange ?? exactSince ?? "ytd";
  const until = lastNonEmpty(params.until);
  const minMagnitudeParam = lastNonEmpty(params.minMagnitude);
  const maxMagnitudeParam = lastNonEmpty(params.maxMagnitude);
  const soloOndas = provider === "igp" && lastNonEmpty(params.ondas) === "1";
  const defaultMinMagnitude = provider === "sgc" ? 3 : 1;
  const minMagnitudeValue = minMagnitudeParam
    ? Number(minMagnitudeParam)
    : defaultMinMagnitude;
  const effectiveSince =
    selectedRange === "ytd"
      ? `${year}-01-01`
      : (selectedRange ?? exactSince ?? `${year}-01-01`);
  const filters = {
    provider,
    since: effectiveSince,
    until,
    minMagnitude: soloOndas
      ? Math.max(4.5, minMagnitudeValue)
      : minMagnitudeParam
        ? minMagnitudeValue
        : provider === "sgc"
          ? defaultMinMagnitude
          : undefined,
    maxMagnitude: maxMagnitudeParam ? Number(maxMagnitudeParam) : undefined,
  };
  const presetValue = selectedRange ?? "";

  let result: Awaited<ReturnType<typeof buildEventListResponse>> | null = null;
  let loadError: unknown = null;
  try {
    result = await buildEventListResponse(filters);
  } catch (error) {
    loadError = error;
  }
  const summary = result
    ? summarizeEventActivity(result.events, {
        start: effectiveSince,
        end: until ?? providerToday,
      })
    : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Actividad sísmica</h1>
          <p className="text-sm text-gray-900">
            Consulta reproducible del catálogo oficial del{" "}
            {provider === "sgc"
              ? "Servicio Geológico Colombiano"
              : "IGP/CENSIS"}
            . Los filtros viven en la URL.
          </p>
        </div>
        <CopyLinkButton />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProviderSwitcher
          active={provider}
          surface="catalog"
          sgcEnabled={isSgcProviderEnabled()}
        />
        <AutoRefresh />
      </div>

      <form
        method="get"
        className="grid gap-x-4 gap-y-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(320px,auto)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
      >
        <input type="hidden" name="provider" value={provider} />
        <div className="flex w-full flex-col gap-1 text-sm">
          <span className="text-gray-900">Rango</span>
          <GlassToggleGroup
            name="range"
            legend="Rango de fechas del catálogo"
            options={RANGE_PRESETS}
            defaultValue={presetValue}
            clearInputNames={["since", "until"]}
          />
        </div>
        <GlassRange
          name="minMagnitude"
          label="Magnitud mínima"
          min={1}
          max={9}
          step={0.1}
          defaultValue={minMagnitudeValue}
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
        {provider === "igp" ? (
          <div className="flex flex-col justify-end gap-2 pb-1">
            <GlassSwitch
              name="ondas"
              label="Solo con ondas"
              defaultChecked={soloOndas}
            />
          </div>
        ) : (
          <div className="flex items-end pb-1 text-gray-800 text-xs">
            Catálogo y detalle, sin formas de onda en esta fase.
          </div>
        )}
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-official px-3 py-2 font-medium text-background-100 text-sm hover:bg-gray-900"
          >
            Filtrar
          </button>
        </div>
        <details className="col-span-full">
          <summary className="w-fit cursor-pointer rounded text-gray-800 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-1000 focus-visible:ring-offset-2">
            Fechas exactas
          </summary>
          <div className="mt-2 flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-900">Desde</span>
              <input
                type="date"
                name="since"
                defaultValue={exactSince ?? ""}
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
      </form>

      {result && summary ? (
        <>
          <ActivitySummary
            summary={summary}
            scopeLabel={scopeLabel({ since, until, year })}
            provenance={result.provenance}
          />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section aria-label="Resultados" className="min-w-0">
              <p
                className="mb-2 text-sm text-gray-900"
                data-testid="result-count"
              >
                {result.events.length} eventos · <ClassBadge value="official" />
              </p>
              <div className="overflow-x-auto">
                <table
                  className="w-full min-w-[680px] text-sm"
                  data-testid="catalog-table"
                >
                  <caption className="sr-only">
                    Eventos del catálogo oficial con filtros aplicados
                  </caption>
                  <thead>
                    <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
                      <th scope="col" className="py-1.5 pr-2">
                        Fecha y hora ({provider === "sgc" ? "Bogotá" : "Lima"})
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
                          {formatLocalDateTime(
                            event.timeLocal,
                            event.provenance.timezone,
                          )}
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
            </section>
            <aside>
              <PeruMap
                country={provider === "sgc" ? "colombia" : "peru"}
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
        </>
      ) : (
        <SourceErrorState
          error={loadError}
          context={`No pudimos consultar el catálogo oficial de ${provider === "sgc" ? "Colombia" : "Perú"} con estos filtros.`}
        />
      )}
    </div>
  );
}
