import { coverage } from "@sismo/terrain";
import type { Metadata } from "next";
import Link from "next/link";
import { ClassBadge } from "../../components/badges";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tipo de suelo por ciudad",
  description:
    "Zonificación sísmica publicada por el IGP para las ciudades del Perú que cuentan con estudio, con procedencia y limitaciones explícitas.",
  alternates: { canonical: "/terreno" },
};

export default function TerrainIndexPage() {
  const { cities, departments, featureCount, provenance } = coverage();

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

      <Link
        href="/terreno/mapa"
        className="block rounded-lg border border-gray-200 p-4 hover:border-gray-600"
        data-testid="map-entry"
      >
        <span className="font-semibold text-official underline">
          Abrir el mapa interactivo →
        </span>
        <span className="mt-1 block text-sm text-gray-900">
          Zoom hasta tu zona, con los sismos recientes encima y las capas
          filtrables.
        </span>
      </Link>

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
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {list.map((city) => (
                  <li key={`${department}-${city.slug}`}>
                    <Link
                      href={`/terreno/${city.slug}`}
                      className="font-medium text-official underline"
                    >
                      {city.city}
                    </Link>{" "}
                    <span className="text-xs text-gray-800">
                      {city.zoneCount}{" "}
                      {city.zoneCount === 1 ? "polígono" : "polígonos"}
                    </span>
                  </li>
                ))}
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
