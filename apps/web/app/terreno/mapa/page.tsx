import { queryEventCatalog } from "@sismo/data";
import { coverage } from "@sismo/terrain";
import type { Metadata } from "next";
import Link from "next/link";
import { ClassBadge } from "../../../components/badges";
import { TerrainMap } from "../../../components/terrain-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa de suelos y sismos",
  description:
    "Mapa interactivo de la zonificación sísmica del IGP con los sismos recientes encima. Buscá tu zona con zoom y filtrá capas.",
  alternates: { canonical: "/terreno/mapa" },
};

export default async function TerrainMapPage() {
  const { cities, departments, provenance } = coverage();

  let quakeCount = 0;
  try {
    const since = new Date(Date.now() - 30 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const result = await queryEventCatalog({ provider: "igp", since });
    quakeCount = result.events.length;
  } catch {
    quakeCount = 0;
  }

  return (
    <div className="space-y-5">
      <nav className="text-xs text-gray-800">
        <Link href="/terreno" className="hover:underline">
          Terreno
        </Link>{" "}
        / <span>Mapa</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold">Mapa de suelos y sismos</h1>
          <ClassBadge value="official" />
        </div>
        <p className="mt-1 text-sm text-gray-900" data-testid="scope-notice">
          Hacé zoom para encontrar tu zona. La capa de suelo cubre{" "}
          {cities.length} ciudades en {departments.length} departamentos, así
          que el mapa se ve vacío donde el IGP no publicó estudio: eso es falta
          de estudio, no ausencia de riesgo.
        </p>
      </header>

      <TerrainMap
        quakesUrl="/api/v1/sismos-geojson"
        quakeCount={quakeCount}
        capturedAt={provenance.capturedAt}
      />

      {quakeCount === 0 ? (
        <p className="text-xs text-missing">
          No pudimos cargar los sismos recientes en este momento; la capa de
          suelo se muestra igual.
        </p>
      ) : null}

      <p className="text-xs text-gray-900">
        ¿Buscás una ciudad puntual? El{" "}
        <Link href="/terreno" className="text-official underline">
          índice de terreno
        </Link>{" "}
        lista las {cities.length} ciudades con estudio publicado y el detalle de
        cada tipo de suelo.
      </p>
    </div>
  );
}
