import { buildVolcanoListResponse } from "@sismo/data";
import Link from "next/link";
import { SourceBadge } from "../../components/badges";
import { SourceErrorState } from "../../components/error-state";
import { PeruMap } from "../../components/peru-map";
import { levelChip } from "../../lib/volcano-ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Volcanes Abiertos" };

export default async function VolcanoesPage() {
  let result: Awaited<ReturnType<typeof buildVolcanoListResponse>> | null =
    null;
  let loadError: unknown = null;
  try {
    result = await buildVolcanoListResponse();
  } catch (error) {
    loadError = error;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Volcanes Abiertos</h1>
        <p className="text-sm text-gray-600" data-testid="scope-notice">
          Datos publicados por la IDE del IGP. La fuente no publica fecha de
          actualización por registro, así que la vigencia del nivel no está
          confirmada. Esto no es un canal de alertas.
        </p>
      </header>

      {result ? (
        <div className="grid gap-6 md:grid-cols-[340px_minmax(0,1fr)]">
          <PeruMap
            title={`Mapa de los ${result.volcanoes.length} volcanes publicados`}
            markers={result.volcanoes.map((volcano) => ({
              longitude: volcano.longitude,
              latitude: volcano.latitude,
              label: `${volcano.name} · nivel publicado: ${volcano.publishedLevel}`,
              kind: "volcano" as const,
              level: volcano.publishedLevel,
              href: `/volcanes/${volcano.slug}`,
            }))}
          />
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="volcano-list">
                <caption className="sr-only">
                  Volcanes publicados por la IDE del IGP con su nivel publicado
                </caption>
                <thead>
                  <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-500">
                    <th scope="col" className="py-1.5 pr-2">
                      Volcán
                    </th>
                    <th scope="col" className="py-1.5 pr-2">
                      Región
                    </th>
                    <th scope="col" className="py-1.5 pr-2">
                      Nivel publicado
                    </th>
                    <th scope="col" className="py-1.5">
                      Vigencia
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.volcanoes.map((volcano) => (
                    <tr key={volcano.slug} className="border-b border-gray-100">
                      <td className="py-1.5 pr-2">
                        <Link
                          href={`/volcanes/${volcano.slug}`}
                          className="font-medium text-official underline"
                        >
                          {volcano.name}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-2">{volcano.region}</td>
                      <td className="py-1.5 pr-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold ${levelChip(volcano.publishedLevel)}`}
                        >
                          {volcano.publishedLevel || "Sin nivel publicado"}
                        </span>
                      </td>
                      <td className="py-1.5 font-mono text-[10px] text-missing">
                        FRESHNESS_UNKNOWN
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <SourceBadge provenance={result.provenance} />
            </div>
          </div>
        </div>
      ) : (
        <SourceErrorState
          error={loadError}
          context="No pudimos consultar la capa volcánica publicada por la IDE del IGP."
        />
      )}
    </div>
  );
}
