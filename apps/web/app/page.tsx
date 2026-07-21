import { getLatestEvent } from "@sismo/data";
import Link from "next/link";
import { ClassBadge, SourceBadge } from "../components/badges";
import { SourceErrorState } from "../components/error-state";
import { PeruMap } from "../components/peru-map";
import { formatLimaDateTime } from "../lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let latest: Awaited<ReturnType<typeof getLatestEvent>> | null = null;
  let loadError: unknown = null;
  try {
    latest = await getLatestEvent();
  } catch (error) {
    loadError = error;
  }

  return (
    <div className="grid flex-1 grid-rows-[auto_minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:grid-rows-1">
      <section
        aria-labelledby="ultimo-sismo-titulo"
        className="flex min-h-0 flex-col justify-center"
      >
        <p
          id="ultimo-sismo-titulo"
          className="font-mono text-[11px] text-gray-700 uppercase tracking-widest"
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
            <h1 className="mt-3 max-w-xl font-semibold text-[22px] text-gray-1000 leading-snug tracking-tight sm:text-[26px]">
              {latest.reference ?? "Sin referencia publicada"}
            </h1>
            <dl className="mt-4 grid max-w-md grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[13px] text-gray-900">
              <div>
                <dt className="text-[11px] text-gray-700 uppercase">
                  Hora local
                </dt>
                <dd>
                  {formatLimaDateTime(latest.timeLocal).replace(
                    " (hora de Lima, UTC-5)",
                    "",
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-700 uppercase">
                  Profundidad
                </dt>
                <dd>{latest.depthKm} km</dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-700 uppercase">
                  Coordenadas
                </dt>
                <dd>
                  {latest.latitude}, {latest.longitude}
                </dd>
              </div>
              {latest.intensity ? (
                <div>
                  <dt className="text-[11px] text-gray-700 uppercase">
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
                Ver Estaciones y Ondas
              </Link>
              <Link
                href="/sismos"
                className="flex h-10 items-center rounded-md border border-gray-400 bg-background-100 px-4 font-medium text-[14px] text-gray-1000 hover:border-gray-500 hover:bg-background-200"
              >
                Explorar Catálogo
              </Link>
              <span className="flex items-center gap-2">
                <ClassBadge value="official" />
              </span>
            </div>
            <div className="mt-5 max-w-xl border-gray-200 border-t pt-3">
              <SourceBadge provenance={latest.provenance} />
            </div>
          </div>
        ) : (
          <div className="mt-4 max-w-xl">
            <SourceErrorState
              error={loadError}
              context="No pudimos obtener el último sismo desde las fuentes públicas del IGP."
            />
            <Link
              href="/sismos"
              className="mt-4 inline-flex h-10 items-center rounded-md border border-gray-400 px-4 font-medium text-[14px] text-gray-1000 hover:bg-background-200"
            >
              Explorar Catálogo
            </Link>
          </div>
        )}
      </section>

      <aside className="flex min-h-0 items-center justify-center">
        <PeruMap
          className="flex h-full max-h-[calc(100vh-10rem)] flex-col items-center [&_svg]:max-h-[calc(100vh-12rem)]"
          title={
            latest
              ? `Epicentro del último sismo: ${latest.reference ?? ""}`
              : "Mapa del Perú sin datos disponibles"
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
