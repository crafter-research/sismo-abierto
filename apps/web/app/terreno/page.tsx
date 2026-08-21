import {
  bearingCapacityCoverage,
  citySoilBreakdown,
  coverage,
} from "@sismo/terrain";
import type { Metadata } from "next";
import Link from "next/link";
import { ClassBadge } from "../../components/badges";
import { SoilBreakdownBar } from "../../components/soil-breakdown-bar";
import { TerrainPreviewMap } from "../../components/terrain-preview-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tipo de suelo por ciudad",
  description:
    "Zonificación sísmica publicada por el IGP para las ciudades del Perú que cuentan con estudio, con procedencia y limitaciones explícitas.",
  alternates: { canonical: "/terreno" },
};

export default async function TerrainIndexPage() {
  const { cities, departments, featureCount, provenance } = coverage();
  const withBearing = await bearingCapacityCoverage();
  const soilBreakdown = citySoilBreakdown();

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
          El tipo de suelo describe cómo responde el terreno, no si una
          construcción resiste. El IGP publica estudios de zonificación sísmica
          para {cities.length} ciudades en {departments.length} departamentos:
          el resto del país no está cubierto por esta capa.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/terreno/mapa"
          className="block rounded-lg border border-gray-200 p-3 hover:border-gray-600"
          data-testid="map-entry"
        >
          <TerrainPreviewMap kind="igp" />
          <span className="mt-3 block font-semibold text-official underline">
            Abrir el mapa interactivo →
          </span>
          <span className="mt-1 block text-sm text-gray-900">
            Zoom hasta tu zona, con los sismos recientes encima y las capas
            filtrables. {cities.length} ciudades, escala urbana.
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
          Las dos capas no compiten: donde el IGP tiene estudio urbano, es la
          fuente más precisa. Donde no lo tiene —incluida toda Lima
          Metropolitana— la geomorfología de INGEMMET es la única capa
          disponible.
        </p>
      </section>

      <section aria-labelledby="ciudades-titulo">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 id="ciudades-titulo" className="font-semibold">
            Ciudades con estudio publicado
          </h2>
          <ClassBadge value="official" />
        </div>

        <div className="space-y-4" data-testid="city-index">
          {[...byDepartment.entries()].map(([department, list]) => (
            <div key={department}>
              <h3 className="text-xs uppercase tracking-wide text-gray-800">
                {department}
              </h3>
              <ul className="mt-1 space-y-1 text-sm">
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
                      {withBearing.has(city.slug) ? (
                        <span
                          className="text-xs text-official"
                          title="Con capacidad portante publicada"
                        >
                          · kg/cm²
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="lima-titulo"
        className="rounded-lg border border-gray-200 p-4"
        data-testid="lima-notice"
      >
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 id="lima-titulo" className="font-semibold">
            Lima Metropolitana no está en esta capa
          </h2>
          <ClassBadge value="unavailable" />
        </div>
        <p className="mt-2 text-sm text-gray-900">
          En el departamento de Lima esta capa cubre Barranca, Huacho, Chancay,
          Chosica, Huaycán, Chaclacayo, Cañete y otras ciudades, pero ningún
          distrito de Lima Metropolitana. El estudio que sí cubre Lima manzana
          por manzana lo publica el CISMID de la Universidad Nacional de
          Ingeniería, por ahora solo como plano descargable.
        </p>
        <a
          href="https://www.cismid.uni.edu.pe/mapa-de-riesgo-sismico-de-lima-cuan-vulnerables-son-nuestras-viviendas/"
          className="mt-2 inline-block text-sm font-medium text-official underline"
          rel="noreferrer"
        >
          Mapa de microzonificación de Lima en el CISMID →
        </a>
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
