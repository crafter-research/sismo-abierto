import {
  getDefaultStore,
  getSourceHistory,
  isPublicSourcesPageEnabled,
} from "@sismo/source-health";
import Link from "next/link";
import { statusChip } from "../../../lib/status-ui";

export const dynamic = "force-dynamic";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  if (!isPublicSourcesPageEnabled()) {
    return (
      <p className="text-sm text-gray-600">
        Esta vista pública todavía no está activada.{" "}
        <Link href="/" className="text-official underline">
          Volver al inicio
        </Link>
      </p>
    );
  }

  const history = await getSourceHistory(sourceId, getDefaultStore());
  if (!history) {
    return (
      <p className="text-sm text-gray-600">
        Fuente desconocida.{" "}
        <Link href="/fuentes" className="text-official underline">
          Ver todas las fuentes
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-500">
        <Link href="/fuentes" className="hover:underline">
          Estado de Fuentes
        </Link>{" "}
        / <span className="font-mono">{sourceId}</span>
      </nav>

      <header className="rounded-lg border border-gray-200 p-4">
        <h1 className="text-xl font-bold">{history.source.source.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Estado observado:</span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-xs ${statusChip(history.source.status)}`}
          >
            {history.source.status}
          </span>
          {history.source.latencyMs !== null ? (
            <span className="font-mono text-xs text-gray-600">
              {history.source.latencyMs} ms
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Fuente oficial:{" "}
          <a
            href={history.source.source.url}
            className="text-official underline"
            rel="noreferrer"
          >
            {history.source.source.url}
          </a>
        </p>
        <p
          className="mt-2 font-mono text-xs text-gray-600"
          data-testid="cli-example"
        >
          sismo source {sourceId} --evidence
        </p>
      </header>

      <section aria-labelledby="chequeos">
        <h2 id="chequeos" className="mb-2 font-semibold">
          Chequeos recientes
        </h2>
        {history.recentChecks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="check-history">
              <caption className="sr-only">
                Chequeos recientes con evidencia
              </caption>
              <thead>
                <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-500">
                  <th scope="col" className="py-1.5 pr-2">
                    Hora
                  </th>
                  <th scope="col" className="py-1.5 pr-2">
                    Estado
                  </th>
                  <th scope="col" className="py-1.5 pr-2">
                    HTTP
                  </th>
                  <th scope="col" className="py-1.5 pr-2">
                    Duración
                  </th>
                  <th scope="col" className="py-1.5">
                    Evidencia
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.recentChecks.map((check) => (
                  <tr
                    key={check.checkedAt}
                    className="border-b border-gray-100"
                  >
                    <td className="py-1.5 pr-2 font-mono text-xs">
                      {check.checkedAt}
                    </td>
                    <td className="py-1.5 pr-2 font-mono text-xs">
                      {check.status}
                    </td>
                    <td className="py-1.5 pr-2 font-mono text-xs">
                      {check.httpStatus ?? "—"}
                    </td>
                    <td className="py-1.5 pr-2 font-mono text-xs">
                      {check.durationMs} ms
                    </td>
                    <td className="py-1.5 text-xs">{check.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Aún no hay chequeos registrados para esta fuente en este entorno.
          </p>
        )}
      </section>

      <section aria-labelledby="cambios">
        <h2 id="cambios" className="mb-2 font-semibold">
          Cambios observados
        </h2>
        {history.changes.length > 0 ? (
          <ul className="space-y-2 text-sm" data-testid="incident-list">
            {history.changes.map((change) => (
              <li
                key={change.id}
                className="rounded border border-gray-200 p-3"
              >
                <p className="font-mono text-xs">
                  {change.openedAt} · {change.fromStatus} → {change.toStatus}
                  {change.closedAt
                    ? ` · cerrado ${change.closedAt}`
                    : " · abierto"}
                </p>
                <p className="mt-1 text-xs text-gray-600">{change.reason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">
            Sin cambios de estado observados.
          </p>
        )}
      </section>

      <p className="text-xs text-gray-500">{history.disclaimer}</p>
    </div>
  );
}
