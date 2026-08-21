import { LimaRiskStore, RISK_LEVELS, romanLevel } from "@sismo/terrain";
import type { Metadata } from "next";
import Link from "next/link";
import { LimaRiskExplorer } from "@/components/lima-risk-explorer";

/**
 * Bajo demanda, no en build: los datos viven en Neon y `DATABASE_URL` no existe
 * durante el build de CI, así que prerenderizar falla. El costo por request se
 * controla del lado del dato (`lima_riesgo_outlines` está precalculada) en vez
 * de con ISR.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riesgo sísmico de Lima: mapa por manzana de los 50 distritos",
  description:
    "Buscá tu distrito y mirá cuánto daño se espera en tu manzana ante un sismo severo. 84,784 manzanas de Lima y Callao del estudio del CISMID-UNI, navegable y con la fuente citada.",
  keywords: [
    "riesgo sísmico Lima",
    "mapa sísmico Lima",
    "microzonificación sísmica Lima",
    "CISMID",
    "sismo Lima distritos",
    "vulnerabilidad sísmica vivienda",
    "zona de riesgo sísmico Callao",
  ],
  alternates: { canonical: "/terreno/lima" },
  openGraph: {
    type: "article",
    title: "Riesgo sísmico de Lima, manzana por manzana",
    description:
      "84,784 manzanas de 50 distritos de Lima y Callao con su nivel estimado de daño ante un sismo severo. Estudio del CISMID-UNI.",
    url: "/terreno/lima",
    locale: "es_PE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Riesgo sísmico de Lima, manzana por manzana",
    description:
      "Buscá tu distrito y mirá el nivel de daño esperado en tu manzana. Estudio del CISMID-UNI, navegable.",
  },
};

const SITE_URL = "https://sismo.crafter.run";

const SOURCE_PDF =
  "https://www.cismid.uni.edu.pe/wp-content/uploads/2026/06/R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  return url;
}

export default async function LimaRiskPage() {
  const store = new LimaRiskStore(requireDatabaseUrl());
  const [totals, districts, outlines] = await Promise.all([
    store.totals(),
    store.districts(),
    store.outlines(),
  ]);

  const highRisk = (totals.byLevel[3] ?? 0) + (totals.byLevel[4] ?? 0);
  const pctHigh = totals.features ? (highRisk / totals.features) * 100 : 0;
  const worst = districts[0];

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Riesgo sísmico de Lima Metropolitana y Callao, por manzana",
    description: `Nivel estimado de daño ante un sismo severo para ${totals.features.toLocaleString("es-PE")} manzanas de ${totals.districts} distritos de Lima y Callao, según los estudios de microzonificación y vulnerabilidad del CISMID-UNI realizados entre ${totals.yearRange[0]} y ${totals.yearRange[1]}.`,
    url: `${SITE_URL}/terreno/lima`,
    license: "https://www.cismid.uni.edu.pe/",
    spatialCoverage: {
      "@type": "Place",
      name: "Lima Metropolitana y Callao, Perú",
      geo: {
        "@type": "GeoShape",
        box: "-12.52 -77.20 -11.55 -76.68",
      },
    },
    temporalCoverage: `${totals.yearRange[0]}/${totals.yearRange[1]}`,
    variableMeasured: RISK_LEVELS.map((spec) => ({
      "@type": "PropertyValue",
      name: `Nivel ${romanLevel(spec.level)}`,
      description: `${spec.damage}. Costo de reparación estimado: ${spec.repairCost} del valor de la vivienda.`,
    })),
    creator: {
      "@type": "ResearchOrganization",
      name: "CISMID, Facultad de Ingeniería Civil, Universidad Nacional de Ingeniería",
      url: "https://www.cismid.uni.edu.pe/",
    },
    publisher: {
      "@type": "Organization",
      name: "Crafter Research",
      url: "https://crafter.run",
    },
    isBasedOn: SOURCE_PDF,
    keywords: [
      "riesgo sísmico",
      "microzonificación sísmica",
      "Lima",
      "Callao",
      "vulnerabilidad de viviendas",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Cómo sé en qué nivel de riesgo sísmico está mi casa en Lima?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Buscá tu distrito en el mapa y tocá tu manzana. El estudio del CISMID-UNI clasifica ${totals.features.toLocaleString("es-PE")} manzanas de ${totals.districts} distritos de Lima y Callao en cinco niveles, del I (sin daño o daño superficial) al V (colapso). Es una estimación por zona y no reemplaza la evaluación técnica de una vivienda concreta.`,
        },
      },
      {
        "@type": "Question",
        name: "¿Qué distrito de Lima tiene mayor riesgo sísmico?",
        acceptedAnswer: {
          "@type": "Answer",
          text: worst
            ? `Según el estudio del CISMID, ${worst.district} tiene la mayor proporción de manzanas con daño severo o colapso esperado: ${worst.pctHigh.toFixed(1)}% de sus ${worst.total.toLocaleString("es-PE")} manzanas evaluadas. En el conjunto de Lima y Callao el ${pctHigh.toFixed(1)}% de las manzanas están en nivel IV o V.`
            : "El estudio del CISMID ordena los distritos por proporción de manzanas con daño severo o colapso esperado.",
        },
      },
      {
        "@type": "Question",
        name: "¿Qué diferencia hay entre microzonificación sísmica y riesgo sísmico?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La microzonificación describe cómo responde el suelo durante un sismo: dónde las ondas se amplifican por las características del terreno. El riesgo sísmico integra eso con la vulnerabilidad de las construcciones para estimar el daño que podrían sufrir las viviendas. Este mapa muestra riesgo sísmico, no solo suelo.",
        },
      },
      {
        "@type": "Question",
        name: "¿De dónde salen estos datos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Del mapa de riesgo sísmico que publica el CISMID de la Universidad Nacional de Ingeniería, con fondos del Ministerio de Vivienda, el Ministerio de Economía y CENEPRED. Los estudios se hicieron distrito por distrito entre ${totals.yearRange[0]} y ${totals.yearRange[1]}, combinando tipo de suelo con datos de campo y ensayos de laboratorio sobre viviendas típicas limeñas.`,
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <script type="application/ld+json">
        {JSON.stringify(datasetSchema)}
      </script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
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
          {totals.features.toLocaleString("es-PE")} manzanas en{" "}
          {totals.districts} distritos de Lima y Callao.
        </p>
      </header>

      <LimaRiskExplorer
        districts={districts}
        outlines={outlines}
        levelTotals={totals.byLevel}
        quakesUrl="/api/v1/sismos-geojson"
      />

      <section aria-labelledby="resumen-titulo" className="mt-12 mb-10">
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
