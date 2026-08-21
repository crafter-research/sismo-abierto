import type { Metadata } from "next";
import Link from "next/link";
import { ClassBadge } from "../../../components/badges";
import { TerrainNationalMap } from "../../../components/terrain-national-map";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Mapa nacional de geomorfología",
  description:
    "Geomorfología de todo el Perú (INGEMMET/GEOCATMIN), agrupada en categorías legibles. A diferencia del mapa de suelos del IGP, cubre el país entero, no solo 57 ciudades.",
  alternates: { canonical: "/terreno/geomorfologia" },
};

export default function TerrainGeomorphologyPage() {
  return (
    <div className="space-y-5">
      <nav className="text-xs text-gray-800">
        <Link href="/terreno" className="hover:underline">
          Terreno
        </Link>{" "}
        / <span>Geomorfología</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold">Mapa nacional de geomorfología</h1>
          <ClassBadge value="official" />
        </div>
        <p className="mt-1 text-sm text-gray-900">
          62,109 polígonos de geomorfología de INGEMMET, cobertura nacional
          continua. A diferencia del{" "}
          <Link href="/terreno/mapa" className="text-official underline">
            mapa de suelos del IGP
          </Link>
          , que solo cubre 57 ciudades con estudio publicado, esta capa cubre el
          país entero.
        </p>
      </header>

      <TerrainNationalMap />
    </div>
  );
}
