import {
  GEOGRAPHY_METHOD_NOTE,
  loadHistoricalReportAuditResults,
} from "@sismo/audit";
import type { PredictionAudit } from "@sismo/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { ReportNavigation } from "../../../../components/report-navigation";
import {
  BaselineBadge,
  OutcomeBadge,
} from "../../../../components/verdict-badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reportNumber: string }>;
}): Promise<Metadata> {
  const { reportNumber } = await params;
  return { title: `Informe ${reportNumber} · Verifica Sismos` };
}

function formatLima(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "America/Lima",
  })
    .format(new Date(value))
    .replaceAll(".", "");
}

function pointReading(audit: PredictionAudit): string {
  if (audit.interpretation.matchOutcome === "PENDING") {
    return "La ventana sigue abierta. No se declara resultado antes del deadline.";
  }
  if (audit.interpretation.matchOutcome === "STRICT_MATCH") {
    return "Hubo al menos una coincidencia literal de tiempo, magnitud y geografía explícita. Esto no establece capacidad predictiva.";
  }
  if (audit.interpretation.matchOutcome === "NO_MATCH") {
    return "No apareció una coincidencia en los destinos explícitos dentro de la ventana publicada.";
  }
  if (audit.interpretation.matchOutcome === "SOURCE_DISAGREEMENT") {
    return "Las fuentes no permiten clasificar este punto de forma única.";
  }
  return "La redacción incluye territorios sin límites verificables. No es honesto convertir este punto en acierto o fallo definitivo.";
}

export default async function HistoricalReportPage({
  params,
}: {
  params: Promise<{ reportNumber: string }>;
}) {
  const { reportNumber: rawReportNumber } = await params;
  const reportNumber = Number(rawReportNumber);
  const results = await loadHistoricalReportAuditResults();
  const index = results.reports.findIndex(
    ({ report }) => report.reportNumber === reportNumber,
  );
  const entry = results.reports[index];
  if (!entry) {
    return (
      <p className="text-sm text-gray-900">
        No existe el informe {rawReportNumber}.{" "}
        <Link href="/verifica" className="underline">
          Volver a Verifica
        </Link>
      </p>
    );
  }

  const previous = results.reports[index - 1]?.report.reportNumber ?? null;
  const next = results.reports[index + 1]?.report.reportNumber ?? null;
  const { report, points } = entry;
  const strictCount = points.filter(
    ({ audit }) => audit.interpretation.matchOutcome === "STRICT_MATCH",
  ).length;
  const pendingCount = points.filter(
    ({ audit }) => audit.interpretation.matchOutcome === "PENDING",
  ).length;

  return (
    <div className="space-y-6" data-testid="historical-report">
      <nav className="text-xs text-gray-800">
        <Link href="/verifica" className="hover:underline">
          Verifica
        </Link>{" "}
        / Informe {report.reportNumber}
      </nav>

      <ReportNavigation previous={previous} next={next} />

      <header className="border-gray-200 border-b pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Informe {report.reportNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-900">
              Movimiento declarado en <strong>{report.origin}</strong>, M
              {report.originMagnitude.toFixed(1)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold">
              M{report.predictedMagnitudeMin.toFixed(1)}–
              {report.predictedMagnitudeMax.toFixed(1)}
            </p>
            <p className="text-xs text-gray-800">
              {pendingCount > 0
                ? "4 puntos pendientes"
                : `${strictCount} de 4 con coincidencia literal`}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-gray-800">Inicio declarado</dt>
            <dd className="mt-0.5 font-mono">{report.startDate}</dd>
          </div>
          <div>
            <dt className="text-gray-800">Deadline Lima</dt>
            <dd className="mt-0.5 font-mono">
              {formatLima(report.deadlineEndLima)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-800">Plazo publicado</dt>
            <dd className="mt-0.5">{report.deadlineSourceText}</dd>
          </div>
        </dl>
      </header>

      <section className="border border-gray-300 bg-background-200 p-4 text-sm">
        <h2 className="font-semibold">Backfill retrospectivo</h2>
        <p className="mt-1 text-gray-900">
          Incorporado el {report.backfilledAt} desde una captura aportada por el
          usuario, después de que algunas ventanas ya habían cerrado. No tiene
          el mismo valor probatorio que una afirmación registrada antes del
          resultado.
        </p>
        <p className="mt-2 text-xs text-gray-800">
          Evidencia fuente: captura aportada por el usuario.
          {report.sourcePostDate
            ? ` · La captura muestra publicación del ${report.sourcePostDate}.`
            : " · Fecha pública de publicación no verificada independientemente."}
        </p>
      </section>

      <section aria-labelledby="report-points-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="report-points-title" className="font-semibold">
              Evaluación por punto
            </h2>
            <p className="mt-1 text-xs text-gray-800">
              Los porcentajes son los declarados en la captura. No se asumen
              como probabilidades calibradas.
            </p>
          </div>
          <span className="font-mono text-[11px] text-gray-800">
            Corrida {results.runAt.slice(0, 10)}
          </span>
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {points.map(({ point, audit }) => {
            const probability = audit.interpretation.baselineProbability;
            return (
              <article
                key={point.pointNumber}
                className="flex flex-col border border-gray-300 p-4"
                data-testid="report-point"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Punto {point.pointNumber}</h3>
                    <p className="mt-0.5 font-mono text-xs text-gray-800">
                      {point.claimedProbability}% declarado
                    </p>
                  </div>
                  <OutcomeBadge outcome={audit.interpretation.matchOutcome} />
                </div>

                <p className="mt-3 text-sm leading-5">{point.sourceText}</p>
                <p className="mt-3 text-xs leading-5 text-gray-900">
                  {pointReading(audit)}
                </p>

                <div className="mt-4 border-gray-200 border-t pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-gray-800">Tasa base</span>
                    {probability === null ? (
                      <span className="text-xs text-gray-800">
                        No disponible
                      </span>
                    ) : (
                      <span className="font-mono text-lg font-bold">
                        {(probability * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {audit.baseline ? (
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <BaselineBadge band={audit.interpretation.baselineBand} />
                      <span className="text-[11px] text-gray-800">
                        {audit.baseline.matchingEventCount} eventos / 365 días ·
                        USGS
                      </span>
                    </div>
                  ) : null}
                </div>

                {audit.candidates.length > 0 ? (
                  <div className="mt-4" data-testid="historical-candidates">
                    <p className="text-xs font-semibold">
                      Coincidencias literales ({audit.candidates.length})
                    </p>
                    <ul className="mt-2 space-y-2">
                      {audit.candidates.map((candidate) => (
                        <li
                          key={`${candidate.eventTimeUtc}-${candidate.latitude}-${candidate.longitude}`}
                          className="border-gray-200 border-l-2 pl-2 text-xs leading-5"
                        >
                          <time className="font-mono">
                            {candidate.eventTimeUtc.slice(0, 10)}
                          </time>{" "}
                          · M{candidate.magnitude} · {candidate.place}
                          <span className="block text-gray-800">
                            {candidate.matchedRegion} · {candidate.sourceId}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {audit.ambiguousRegions.length > 0 ? (
                  <details className="mt-4 text-xs">
                    <summary className="cursor-pointer text-gray-900 underline underline-offset-2">
                      Ver geografía no verificable
                    </summary>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-gray-800">
                      {audit.ambiguousRegions.map((region) => (
                        <li key={region}>{region}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                <details className="mt-auto pt-4 text-xs">
                  <summary className="cursor-pointer text-gray-900 underline underline-offset-2">
                    Ver consultas de evidencia ({audit.evidence.length})
                  </summary>
                  <ul className="mt-2 space-y-2 text-gray-800">
                    {audit.evidence.map((evidence) => (
                      <li
                        key={`${evidence.action}-${evidence.url}-${evidence.detail}`}
                      >
                        {evidence.action}: {evidence.detail}
                        {evidence.url ? (
                          <a
                            href={evidence.url}
                            className="ml-1 text-gray-1000 underline"
                            rel="noreferrer"
                          >
                            consulta
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            );
          })}
        </div>
      </section>

      <p className="text-xs leading-5 text-gray-800">
        {GEOGRAPHY_METHOD_NOTE} Esto evalúa coincidencias literales de estos
        informes, no valida la hipótesis de “migración” sísmica.
      </p>

      <ReportNavigation previous={previous} next={next} />
    </div>
  );
}
