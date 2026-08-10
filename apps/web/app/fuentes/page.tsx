import {
  getDefaultStore,
  getSourceOverview,
  isPublicSourcesPageEnabled,
  runSourceChecks,
} from "@sismo/source-health";
import type { Metadata } from "next";
import Link from "next/link";
import { statusChip } from "../../lib/status-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estado de fuentes sísmicas",
  description:
    "Estado observado, latencia, contrato y evidencia de las fuentes sísmicas públicas del IGP, SGC y USGS.",
  alternates: { canonical: "/fuentes" },
};

export default async function SourcesPage() {
  if (!isPublicSourcesPageEnabled()) {
    return (
      <div className="rounded-lg border border-gray-200 bg-missing-soft p-6 text-sm text-gray-800">
        <h1 className="text-lg font-bold text-gray-900">Estado de Fuentes</h1>
        <p className="mt-2">
          Esta vista pública todavía no está activada. El monitor opera
          internamente para proteger al resto del ecosistema; su publicación
          requiere revisión institucional del lenguaje con las fuentes.
        </p>
      </div>
    );
  }

  const store = getDefaultStore();
  let overview = await getSourceOverview(store);
  if (overview.sources.every((source) => source.lastCheckAt === null)) {
    await runSourceChecks(store);
    overview = await getSourceOverview(store);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Estado de Fuentes</h1>
        <p className="text-sm text-gray-900" data-testid="scope-disclaimer">
          Lo observado por el consumidor de este proyecto sobre las fuentes
          públicas que usa. No representa el estado interno ni una alerta del
          IGP.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="source-grid">
          <caption className="sr-only">
            Estado observado por fuente pública
          </caption>
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
              <th scope="col" className="py-1.5 pr-2">
                Fuente
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Estado observado
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Latencia
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Último chequeo
              </th>
              <th scope="col" className="py-1.5">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody>
            {overview.sources.map((source) => (
              <tr key={source.sourceId} className="border-b border-gray-100">
                <td className="py-1.5 pr-2">{source.source.name}</td>
                <td className="py-1.5 pr-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-xs ${statusChip(source.status)}`}
                  >
                    {source.status}
                  </span>
                </td>
                <td className="py-1.5 pr-2 font-mono text-xs">
                  {source.latencyMs !== null ? `${source.latencyMs} ms` : "—"}
                </td>
                <td className="py-1.5 pr-2 font-mono text-xs">
                  {source.lastCheckAt ?? "sin chequeos"}
                </td>
                <td className="py-1.5">
                  <Link
                    href={`/fuentes/${source.sourceId}`}
                    className="text-official underline"
                  >
                    Historial →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section
        className="rounded-lg border border-gray-200 p-4 text-xs text-gray-900"
        data-testid="status-legend"
      >
        <h2 className="text-sm font-semibold text-gray-900">
          Qué significa cada estado
        </h2>
        <ul className="mt-2 space-y-1">
          <li>
            <span className="font-mono">OPERATIONAL</span>: nuestro probe
            recibió y validó la respuesta esperada.
          </li>
          <li>
            <span className="font-mono">DEGRADED</span>: respondió, pero con
            latencia o datos anómalos.
          </li>
          <li>
            <span className="font-mono">UNAVAILABLE</span>: nuestro probe no
            obtuvo una respuesta utilizable.
          </li>
          <li>
            <span className="font-mono">SCHEMA_CHANGED</span>: la respuesta
            llegó pero rompió el contrato conocido.
          </li>
          <li>
            <span className="font-mono">FRESHNESS_UNKNOWN</span>: la fuente no
            ofrece señal autoritativa de actualización.
          </li>
        </ul>
        <p className="mt-2">
          Ningún estado describe salud interna del IGP, validez científica ni
          peligro público.
        </p>
      </section>
    </div>
  );
}
