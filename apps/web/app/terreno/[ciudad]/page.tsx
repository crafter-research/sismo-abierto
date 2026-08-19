import { cityTerrain, coverage } from "@sismo/terrain";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassBadge } from "../../../components/badges";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ciudad: string }>;
}): Promise<Metadata> {
  const { ciudad } = await params;
  const terrain = cityTerrain(ciudad);
  if (!terrain) {
    return { title: "Ciudad sin estudio de zonificación" };
  }
  return {
    title: `Tipo de suelo en ${terrain.city}`,
    description: `Zonificación sísmica publicada por el IGP para ${terrain.city}, ${terrain.department}: ${terrain.zones.length} tipos de suelo con procedencia y limitaciones.`,
    alternates: { canonical: `/terreno/${terrain.slug}` },
  };
}

export default async function CityTerrainPage({
  params,
}: {
  params: Promise<{ ciudad: string }>;
}) {
  const { ciudad } = await params;
  const terrain = cityTerrain(ciudad);
  if (!terrain) notFound();

  const totalCities = coverage().cities.length;

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-800">
        <Link href="/terreno" className="hover:underline">
          Terreno
        </Link>{" "}
        / <span>{terrain.city}</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold">{terrain.city}</h1>
          <span className="text-gray-800">{terrain.department}</span>
          <ClassBadge value="official" />
        </div>
        <p className="mt-2 text-sm text-gray-900" data-testid="scope-notice">
          {terrain.zones.length}{" "}
          {terrain.zones.length === 1
            ? "tipo de suelo publicado"
            : "tipos de suelo publicados"}{" "}
          para esta ciudad. Es una de {totalCities} ciudades con estudio de
          zonificación sísmica del IGP.
        </p>
      </header>

      <section aria-labelledby="zonas-titulo" data-testid="city-zones">
        <h2 id="zonas-titulo" className="mb-3 font-semibold">
          Tipos de suelo
        </h2>
        <div className="space-y-3">
          {terrain.zones.map((zone) => (
            <div
              key={zone.zone}
              className="rounded-lg border border-gray-200 p-3"
            >
              <p className="font-mono text-sm text-official">{zone.zone}</p>
              <p className="mt-1 text-xs text-gray-800">
                {zone.polygonCount}{" "}
                {zone.polygonCount === 1
                  ? "polígono en el estudio"
                  : "polígonos en el estudio"}
                {zone.studyYear ? ` · estudio de ${zone.studyYear}` : ""}
              </p>
              <p className="mt-2 border-l-2 border-gray-300 pl-3 text-sm text-gray-900">
                {terrain.disclaimer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="que-hacer-titulo"
        className="rounded-lg border border-gray-200 p-4"
      >
        <h2 id="que-hacer-titulo" className="font-semibold">
          Si te preocupa tu vivienda
        </h2>
        <p className="mt-2 text-sm text-gray-900">
          Esta capa no evalúa construcciones. Si tu vivienda es antigua, fue
          edificada sin supervisión técnica o está en una zona de suelo
          desfavorable, quien puede responder es un profesional que revise la
          estructura. El CISMID de la Universidad Nacional de Ingeniería cuenta
          con un laboratorio de estructuras que atiende consultas.
        </p>
        <a
          href="https://www.cismid.uni.edu.pe/"
          className="mt-2 inline-block text-sm font-medium text-official underline"
          rel="noreferrer"
        >
          Laboratorio de estructuras del CISMID →
        </a>
      </section>

      <div className="text-xs text-gray-900">
        <p>
          Fuente:{" "}
          <a
            href={terrain.provenance.sourceUrl}
            className="text-official underline"
            rel="noreferrer"
          >
            {terrain.provenance.provider} · Zonificación sísmica (WFS)
          </a>
        </p>
        <p>
          Instantánea tomada:{" "}
          <span className="font-mono">
            {terrain.provenance.capturedAt.slice(0, 10)}
          </span>
        </p>
      </div>
    </div>
  );
}
