import {
  funderLabel,
  LimaRiskStore,
  RISK_LEVELS,
  romanLevel,
} from "@sismo/terrain";
import type { Metadata } from "next";
import Link from "next/link";
import { DistrictRanking } from "@/components/lima-district-ranking";
import { LimaRiskMap } from "@/components/lima-risk-map";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Riesgo sísmico de Lima, manzana por manzana",
  description:
    "El mapa de riesgo sísmico del CISMID-UNI, navegable. 86,792 manzanas de 50 distritos de Lima y Callao con su nivel estimado de daño ante un sismo severo.",
};

const SOURCE_PDF =
  "https://www.cismid.uni.edu.pe/wp-content/uploads/2026/06/R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  return url;
}

export default async function LimaRiskPage() {
  const store = new LimaRiskStore(requireDatabaseUrl());
  const [totals, districts] = await Promise.all([
    store.totals(),
    store.districts(),
  ]);

  const highRisk = (totals.byLevel[3] ?? 0) + (totals.byLevel[4] ?? 0);
  const pctHigh = totals.features ? (highRisk / totals.features) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <p className="mb-2 font-medium text-gray-800 text-xs uppercase tracking-wide">
          CISMID · Universidad Nacional de Ingeniería
        </p>
        <h1 className="font-semibold text-2xl text-gray-1000 tracking-tight sm:text-3xl">
          Riesgo sísmico de Lima, manzana por manzana
        </h1>
        <p className="mt-3 max-w-2xl text-gray-900 leading-relaxed">
          Cuánto daño se espera que sufra una vivienda típica ante un sismo
          severo, según el suelo donde está y cómo están construidas las casas
          de esa zona. El estudio cubre{" "}
          <strong className="font-semibold text-gray-1000">
            {totals.features.toLocaleString("es-PE")} manzanas
          </strong>{" "}
          en {totals.districts} distritos de Lima y Callao.
        </p>
      </header>

      <section aria-labelledby="mapa-titulo" className="mb-10">
        <h2 id="mapa-titulo" className="sr-only">
          Mapa interactivo
        </h2>
        <LimaRiskMap />
      </section>

      <section aria-labelledby="resumen-titulo" className="mb-10">
        <h2
          id="resumen-titulo"
          className="mb-3 font-semibold text-gray-1000 text-lg"
        >
          Qué dice el estudio en total
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-300">
          <div className="flex h-8 w-full">
            {RISK_LEVELS.map((spec, index) => {
              const count = totals.byLevel[index] ?? 0;
              const pct = totals.features ? (count / totals.features) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={spec.level}
                  className="flex items-center justify-center"
                  style={{ width: `${pct}%`, backgroundColor: spec.ui }}
                  title={`Nivel ${romanLevel(spec.level)}: ${count.toLocaleString("es-PE")} manzanas`}
                >
                  {pct > 8 ? (
                    <span className="font-medium text-[11px] text-white">
                      {pct.toFixed(0)}%
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <dl className="grid grid-cols-2 divide-x divide-gray-300 border-gray-300 border-t sm:grid-cols-4">
            <div className="p-3">
              <dt className="text-gray-800 text-xs">Manzanas evaluadas</dt>
              <dd className="font-semibold text-gray-1000 text-lg">
                {totals.features.toLocaleString("es-PE")}
              </dd>
            </div>
            <div className="p-3">
              <dt className="text-gray-800 text-xs">Daño severo o colapso</dt>
              <dd className="font-semibold text-glyph-rojo text-lg">
                {pctHigh.toFixed(1)}%
              </dd>
            </div>
            <div className="p-3">
              <dt className="text-gray-800 text-xs">Distritos</dt>
              <dd className="font-semibold text-gray-1000 text-lg">
                {totals.districts}
              </dd>
            </div>
            <div className="p-3">
              <dt className="text-gray-800 text-xs">Años de estudio</dt>
              <dd className="font-semibold text-gray-1000 text-lg">
                {totals.yearRange[0]}–{totals.yearRange[1]}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="distritos-titulo" className="mb-10">
        <h2
          id="distritos-titulo"
          className="mb-1 font-semibold text-gray-1000 text-lg"
        >
          Distrito por distrito
        </h2>
        <p className="mb-4 text-gray-800 text-sm">
          Ordenados por porcentaje de manzanas con daño severo o colapso
          esperado. Buscá el tuyo.
        </p>
        <DistrictRanking districts={districts} />
      </section>

      <section
        aria-labelledby="leyenda-titulo"
        className="mb-10 rounded-lg border border-gray-300 p-4"
      >
        <h2
          id="leyenda-titulo"
          className="mb-3 font-semibold text-gray-1000 text-base"
        >
          Los cinco niveles
        </h2>
        <ul className="space-y-2">
          {RISK_LEVELS.map((spec) => (
            <li key={spec.level} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-1 size-3 shrink-0 rounded-[3px]"
                style={{ backgroundColor: spec.ui }}
              />
              <div className="min-w-0">
                <p className="font-medium text-gray-1000 text-sm">
                  Nivel {romanLevel(spec.level)} · {spec.damage}
                </p>
                <p className="text-gray-800 text-xs">
                  Costo de reparación estimado: {spec.repairCost} del valor de
                  la vivienda · Riesgo {spec.risk.toLowerCase()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="fuente-titulo"
        className="rounded-lg border border-gray-300 bg-gray-100 p-4"
      >
        <h2
          id="fuente-titulo"
          className="mb-2 font-semibold text-gray-1000 text-base"
        >
          De dónde sale este dato
        </h2>
        <div className="space-y-2 text-gray-900 text-sm leading-relaxed">
          <p>
            Del{" "}
            <a
              href={SOURCE_PDF}
              className="underline underline-offset-2 hover:text-gray-1000"
              target="_blank"
              rel="noreferrer"
            >
              mapa de riesgo sísmico que publica el CISMID
            </a>
            , el centro de investigaciones sísmicas de la UNI. Es un PDF
            vectorial georreferenciado: cada manzana viaja adentro con
            coordenadas reales y su nivel de daño en el color. Acá está el mismo
            dato, navegable.
          </p>
          <p>
            Los estudios se hicieron entre {totals.yearRange[0]} y{" "}
            {totals.yearRange[1]}, distrito por distrito, con financiamiento del
            Ministerio de Vivienda, el Ministerio de Economía y CENEPRED. Cada
            ficha de distrito dice cuál lo financió y en qué año se hizo.
          </p>
          <p className="text-gray-800 text-xs">
            El CISMID combinó el tipo de suelo con datos de campo (una vivienda
            representativa por manzana) y ensayos de laboratorio sobre viviendas
            típicas limeñas. Es una estimación por zona: no reemplaza la
            evaluación técnica de una vivienda concreta.
          </p>
          <p className="text-xs">
            <Link
              href="/terreno"
              className="underline underline-offset-2 hover:text-gray-1000"
            >
              Ver las otras capas de terreno
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
