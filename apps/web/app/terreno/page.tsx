import {
  bearingCapacityCoverage,
  citySoilBreakdown,
  coverage,
  LimaRiskStore,
} from "@sismo/terrain";
import type { Metadata } from "next";
import Link from "next/link";
import { ClassBadge } from "../../components/badges";
import { SoilBreakdownBar } from "../../components/soil-breakdown-bar";
import { TerrainPreviewMap } from "../../components/terrain-preview-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tipo de suelo por ciudad: zonificación sísmica del Perú",
  description:
    "Zonificación sísmica publicada por el IGP para las ciudades del Perú que cuentan con estudio, con procedencia y limitaciones explícitas.",
  alternates: { canonical: "/terreno" },
};

/**
 * Los totales de Lima salen de la base, no de una constante: si se reingiere
 * el PDF del CISMID el número cambia y la página no debe quedar mintiendo.
 * Falla en silencio porque esta fila es un complemento del índice del IGP, no
 * la razón por la que existe la página.
 */
async function limaTotals() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return await new LimaRiskStore(url).totals();
  } catch {
    return null;
  }
}

export default async function TerrainIndexPage() {
  const lima = await limaTotals();
  const { cities, departments, featureCount, provenance } = coverage();
  const withBearing = await bearingCapacityCoverage();
  const soilBreakdown = citySoilBreakdown();
  const citiesWithBearing = cities.filter((city) =>
    withBearing.has(city.slug),
  ).length;

  const byDepartment = new Map<string, typeof cities>();
  for (const city of cities) {
    const list = byDepartment.get(city.department) ?? [];
    list.push(city);
    byDepartment.set(city.department, list);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Terreno</h1>
        <p className="text-sm text-gray-900" data-testid="scope-notice">
          El tipo de suelo describe cómo se mueve el terreno en un sismo, que es
          distinto de cuánto resiste una construcción encima. El IGP publica
          estudios de zonificación para {cities.length} ciudades en{" "}
          {departments.length} departamentos. El resto del país no está cubierto
          por esta capa.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/terreno/lima"
          className="block rounded-lg border border-gray-200 p-3 hover:border-gray-600"
          data-testid="map-entry"
        >
          <TerrainPreviewMap kind="lima" />
          <span className="mt-3 block font-semibold text-official underline">
            Cuánto daño se espera en tu manzana →
          </span>
          <span className="mt-1 block text-gray-900 text-sm">
            Buscá tu dirección y mirá el nivel estimado de daño ante un sismo
            severo.{" "}
            {lima
              ? `${lima.features.toLocaleString("es-PE")} manzanas de ${lima.districts} distritos de Lima y Callao`
              : "Lima y Callao, manzana por manzana"}
            , con el suelo del IGP y los sismos recientes como capas.
          </span>
        </Link>

        <Link
          href="/terreno/geomorfologia"
          className="block rounded-lg border border-gray-200 p-3 hover:border-gray-600"
          data-testid="geomorphology-entry"
        >
          <TerrainPreviewMap kind="geomorfologia" />
          <span className="mt-3 block font-semibold text-official underline">
            Ver geomorfología nacional →
          </span>
          <span className="mt-1 block text-sm text-gray-900">
            62,109 polígonos de INGEMMET. Cobertura de todo el país a escala
            1:100&nbsp;000, incluida Lima.
          </span>
        </Link>
      </div>

      <section
        aria-labelledby="contraste-titulo"
        className="rounded-lg border border-gray-200 p-4"
        data-testid="coverage-contrast"
      >
        <h2 id="contraste-titulo" className="sr-only">
          Contraste entre las dos capas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-2xl font-bold text-gray-1000">
              {cities.length}
              <span className="ml-1 text-sm font-normal text-gray-800">
                ciudades
              </span>
            </p>
            <p className="text-xs text-gray-800">
              IGP · zonificación urbana detallada, {featureCount} polígonos
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-1000">
              1
              <span className="ml-1 text-sm font-normal text-gray-800">
                país entero
              </span>
            </p>
            <p className="text-xs text-gray-800">
              INGEMMET · geomorfología a escala 1:100&nbsp;000, 62,109 polígonos
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-900">
          Cada capa mide algo distinto. El IGP describe el suelo. El CISMID
          estima el daño esperado a la vivienda construida sobre ese suelo.
          INGEMMET cubre el país entero a escala regional. En el este de Lima
          las tres se superponen y podés compararlas en el mismo mapa. Donde no
          hay estudio urbano, INGEMMET es la única disponible.
        </p>
      </section>

      <section aria-labelledby="ciudades-titulo">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 id="ciudades-titulo" className="font-semibold">
            Ciudades con estudio publicado
          </h2>
          <ClassBadge value="official" />
        </div>

        {/*
          `bearingCapacityCoverage()` devuelve mas slugs que ciudades (63 contra
          57) porque incluye alias, asi que el conteo sale de las ciudades que
          realmente se listan.
        */}
        {citiesWithBearing > 0 ? (
          <p className="mt-1 text-xs text-gray-800">
            {citiesWithBearing === cities.length
              ? "Las 57 tienen capacidad portante publicada en kg/cm²."
              : `${citiesWithBearing} de ${cities.length} tienen capacidad portante publicada en kg/cm².`}{" "}
            La barra muestra la proporción de cada tipo de suelo.
          </p>
        ) : null}

        <div className="mt-3 space-y-4" data-testid="city-index">
          {[...byDepartment.entries()].map(([department, list]) => (
            <div key={department}>
              <h3 className="text-xs uppercase tracking-wide text-gray-800">
                {department}
              </h3>
              <ul className="mt-1 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {list.map((city) => {
                  const breakdown = soilBreakdown.get(city.slug);
                  return (
                    <li
                      key={`${department}-${city.slug}`}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1"
                    >
                      {breakdown ? (
                        <SoilBreakdownBar breakdown={breakdown} />
                      ) : null}
                      <Link
                        href={`/terreno/${city.slug}`}
                        className="font-medium text-official underline"
                      >
                        {city.city}
                      </Link>
                      <span className="text-xs text-gray-800">
                        {city.zoneCount}{" "}
                        {city.zoneCount === 1 ? "polígono" : "polígonos"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="cobertura-titulo"
        className="rounded-lg border border-gray-200 p-4"
      >
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 id="cobertura-titulo" className="font-semibold">
            Lo que esta capa no cubre
          </h2>
          <ClassBadge value="unavailable" />
        </div>
        <p className="mt-2 text-sm text-gray-900">
          Una ciudad ausente de esta lista no es una ciudad segura ni una ciudad
          peligrosa: es una ciudad sin estudio publicado en esta fuente. La capa
          reúne {featureCount} polígonos y no cubre zonas rurales ni ciudades
          fuera del programa de zonificación del IGP.
        </p>
      </section>

      <div className="text-xs text-gray-900">
        <p>
          Fuente:{" "}
          <a
            href={provenance.sourceUrl}
            className="text-official underline"
            rel="noreferrer"
          >
            {provenance.provider} · Zonificación sísmica (WFS)
          </a>
        </p>
        <p>
          Instantánea tomada:{" "}
          <span className="font-mono">
            {provenance.capturedAt.slice(0, 10)}
          </span>{" "}
          · {provenance.license}
        </p>
      </div>
    </div>
  );
}
