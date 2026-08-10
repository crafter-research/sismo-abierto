import type { EventProviderId } from "@sismo/contracts";
import {
  getLatestEvent,
  isSgcProviderEnabled,
  resolveEventProvider,
} from "@sismo/data";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "../components/auto-refresh";
import { ClassBadge, SourceBadge } from "../components/badges";
import { SourceErrorState } from "../components/error-state";
import { PeruMap } from "../components/peru-map";
import { ProviderSwitcher } from "../components/provider-switcher";
import { formatLocalDateTime } from "../lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: isSgcProviderEnabled()
    ? "Últimos sismos en Perú y Colombia"
    : "Últimos sismos en Perú",
  description: isSgcProviderEnabled()
    ? "Consulta los últimos sismos oficiales de Perú y Colombia con datos del IGP y el SGC, mapas, profundidad, magnitud y procedencia."
    : "Consulta los últimos sismos oficiales de Perú con datos del IGP, mapas, profundidad, magnitud y procedencia.",
  alternates: { canonical: "/peru" },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawProvider = Array.isArray(params.provider)
    ? params.provider.at(-1)
    : params.provider;
  let provider: EventProviderId;
  try {
    provider = resolveEventProvider(rawProvider);
  } catch (error) {
    return (
      <SourceErrorState
        error={error}
        context="El país solicitado no corresponde a una fuente disponible."
      />
    );
  }
  return <CountryHomePage provider={provider} />;
}

export async function CountryHomePage({
  provider,
}: {
  provider: EventProviderId;
}) {
  const country = provider === "sgc" ? "Colombia" : "Perú";
  const countrySlug = provider === "sgc" ? "colombia" : "peru";
  const agency = provider === "sgc" ? "SGC" : "IGP";
  let latest: Awaited<ReturnType<typeof getLatestEvent>> | null = null;
  let loadError: unknown = null;
  try {
    latest = await getLatestEvent(provider);
  } catch (error) {
    loadError = error;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Sismos oficiales de ${country}`,
    description: `Eventos sísmicos publicados por el ${agency}, normalizados con magnitud, profundidad, coordenadas y procedencia.`,
    url: `https://sismo.crafter.run/${countrySlug}`,
    spatialCoverage: country,
    temporalCoverage: "PRESENT",
    creator: {
      "@type": "Organization",
      name: "Crafter Research",
      url: "https://crafter.run",
    },
    isBasedOn:
      provider === "sgc"
        ? "https://www.sgc.gov.co/sismos"
        : "https://ultimosismo.igp.gob.pe/",
  };

  return (
    <div className="grid flex-1 grid-rows-[auto_minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:grid-rows-1">
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <section
        aria-labelledby="ultimo-sismo-titulo"
        className="flex min-h-0 flex-col justify-center"
      >
        <ProviderSwitcher
          active={provider}
          sgcEnabled={isSgcProviderEnabled()}
        />
        <h1 className="mt-5 font-semibold text-lg tracking-tight">
          Últimos sismos en {country}
        </h1>
        <p
          id="ultimo-sismo-titulo"
          className="mt-1 font-mono text-[11px] text-gray-800 uppercase tracking-widest"
        >
          Último sismo oficial
        </p>
        {latest ? (
          <div className="mt-3" data-testid="latest-event">
            <Link
              href={`/sismos/${latest.id}`}
              className="block font-semibold text-[64px] text-gray-1000 leading-none tracking-[-0.06em] hover:text-gray-900 sm:text-[88px]"
              data-testid="latest-event-link"
            >
              M {latest.magnitude.toFixed(1)}
            </Link>
            <h2 className="mt-3 max-w-xl font-semibold text-[22px] text-gray-1000 leading-snug tracking-tight sm:text-[26px]">
              {latest.reference ?? "Sin referencia publicada"}
            </h2>
            <dl className="mt-4 grid max-w-md grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[13px] text-gray-900">
              <div>
                <dt className="text-[11px] text-gray-800 uppercase">
                  Hora local
                </dt>
                <dd>
                  {formatLocalDateTime(
                    latest.timeLocal,
                    latest.provenance.timezone,
                  ).replace(
                    provider === "sgc"
                      ? " (hora de Bogotá, UTC-5)"
                      : " (hora de Lima, UTC-5)",
                    "",
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-800 uppercase">
                  Profundidad
                </dt>
                <dd>{latest.depthKm} km</dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-800 uppercase">
                  Coordenadas
                </dt>
                <dd>
                  {latest.latitude}, {latest.longitude}
                </dd>
              </div>
              {latest.intensity ? (
                <div>
                  <dt className="text-[11px] text-gray-800 uppercase">
                    Intensidad
                  </dt>
                  <dd>{latest.intensity}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/sismos/${latest.id}`}
                className="flex h-10 items-center rounded-md bg-gray-1000 px-4 font-medium text-[14px] text-background-100 hover:bg-gray-900"
              >
                {provider === "igp" ? "Ver Estaciones y Ondas" : "Ver Detalle"}
              </Link>
              <Link
                href={`/${countrySlug}/sismos`}
                className="flex h-10 items-center rounded-md border border-gray-400 bg-background-100 px-4 font-medium text-[14px] text-gray-1000 hover:border-gray-500 hover:bg-background-200"
              >
                Ver actividad del año
              </Link>
              <span className="flex items-center gap-2">
                <ClassBadge value="official" />
              </span>
            </div>
            <div className="mt-5 max-w-xl border-gray-200 border-t pt-3">
              <SourceBadge provenance={latest.provenance} />
              <div className="mt-2">
                <AutoRefresh />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 max-w-xl">
            <SourceErrorState
              error={loadError}
              context={`No pudimos obtener el último sismo desde la fuente oficial de ${provider === "sgc" ? "Colombia" : "Perú"}.`}
            />
            <Link
              href={`/${countrySlug}/sismos`}
              className="mt-4 inline-flex h-10 items-center rounded-md border border-gray-400 px-4 font-medium text-[14px] text-gray-1000 hover:bg-background-200"
            >
              Ver actividad del año
            </Link>
          </div>
        )}
      </section>

      <aside className="flex min-h-0 items-center justify-center">
        <PeruMap
          country={provider === "sgc" ? "colombia" : "peru"}
          className="flex h-full max-h-[calc(100vh-10rem)] flex-col items-center [&_svg]:max-h-[calc(100vh-12rem)]"
          title={
            latest
              ? `Epicentro del último sismo: ${latest.reference ?? ""}`
              : `Mapa de ${provider === "sgc" ? "Colombia" : "Perú"} sin datos disponibles`
          }
          markers={
            latest
              ? [
                  {
                    longitude: latest.longitude,
                    latitude: latest.latitude,
                    label: `Epicentro M ${latest.magnitude.toFixed(1)} · ${latest.reference ?? ""}`,
                    kind: "epicenter",
                    magnitude: latest.magnitude,
                    href: `/sismos/${latest.id}`,
                  },
                ]
              : []
          }
        />
      </aside>
    </div>
  );
}
