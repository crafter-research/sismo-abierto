import {
  BASELINE_BAND_LABELS,
  evaluatePrediction,
  loadHistoricalReportAuditResults,
  loadPredictionRegistry,
  windowHasClosed,
} from "@sismo/audit";
import Link from "next/link";
import { OutcomeLabel } from "../../components/verdict-badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verifica Sismos" };

function formatDeadlineLima(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  })
    .format(new Date(value))
    .replaceAll(".", "");
}

function splitTargets(targets: string[]): {
  visible: string[];
  hidden: string[];
} {
  if (targets.length < 2) return { visible: targets, hidden: [] };

  const firstTwo = targets.slice(0, 2);
  const visible =
    firstTwo.join(" · ").length <= 60 ? firstTwo : targets.slice(0, 1);

  return { visible, hidden: targets.slice(visible.length) };
}

export default async function VerificaPage() {
  const [registry, historicalResults] = await Promise.all([
    loadPredictionRegistry(),
    loadHistoricalReportAuditResults(),
  ]);
  const now = Date.now();
  const audits = [];

  for (const prediction of registry) {
    let audit: Awaited<ReturnType<typeof evaluatePrediction>> | null = null;
    if (windowHasClosed(prediction, now)) {
      audit = await evaluatePrediction(prediction, now).catch(() => null);
    }
    audits.push({
      prediction,
      audit,
      outcome: audit?.interpretation.matchOutcome ?? "PENDING",
    });
  }

  return (
    <div className="w-[min(88rem,calc(100vw-2rem))] self-center">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Verifica Sismos</h1>
        <div
          className="space-y-1.5 text-[13px] text-gray-900"
          data-testid="prediction-interpretation-note"
        >
          <p>
            <strong className="text-gray-1000">
              Coincidencia no equivale a predicción.
            </strong>{" "}
            Coincidir con tiempo, magnitud y geografía no equivale a predecir.
            La tasa base estima qué tan probable era obtener al menos una
            coincidencia aun sin un método predictivo.
          </p>
          <p>
            <strong className="text-gray-1000">
              Capacidad predictiva no establecida.
            </strong>{" "}
            Ninguna coincidencia aislada establece capacidad predictiva.
          </p>
        </div>
        <p className="text-xs text-gray-800">
          Estas afirmaciones no fueron emitidas por el IGP. Provienen del Reel
          de Instagram DbAK4jKpyxP de sismos.en.peru, congelado el 20 de julio
          de 2026. IGP/CENSIS y USGS se usan para comprobar los resultados.{" "}
          <Link href="/verifica/metodologia" className="underline">
            Metodología completa
          </Link>
        </p>
      </header>

      <section className="mt-6" aria-labelledby="historical-reports-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="historical-reports-title"
              className="text-base font-semibold"
            >
              Informes históricos
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-gray-800">
              Backfill retrospectivo de nueve informes aportados como capturas.
              Cada punto conserva su porcentaje declarado, ventana y resultado;
              no equivale a un registro preinscrito.
            </p>
          </div>
          <span className="font-mono text-[11px] text-gray-800">
            Auditoría {historicalResults.runAt.slice(0, 10)}
          </span>
        </div>
        <div
          className="mt-3 divide-y divide-gray-200 border-gray-200 border-y"
          data-testid="historical-report-list"
        >
          {historicalResults.reports.map(({ report, points }) => {
            const strict = points.filter(
              ({ audit }) =>
                audit.interpretation.matchOutcome === "STRICT_MATCH",
            ).length;
            const pending = points.filter(
              ({ audit }) => audit.interpretation.matchOutcome === "PENDING",
            ).length;
            const ambiguous = points.filter(
              ({ audit }) =>
                audit.interpretation.matchOutcome === "AMBIGUOUS_GEOGRAPHY",
            ).length;
            const noMatch = points.filter(
              ({ audit }) => audit.interpretation.matchOutcome === "NO_MATCH",
            ).length;
            return (
              <Link
                key={report.reportNumber}
                href={`/verifica/informes/${report.reportNumber}`}
                className="grid gap-1 py-3 text-sm hover:bg-background-200 sm:grid-cols-[7.5rem_minmax(0,1fr)_minmax(14rem,auto)] sm:items-center sm:gap-4 sm:px-2"
                data-testid="historical-report-row"
              >
                <span className="font-mono font-semibold underline underline-offset-2">
                  Informe {report.reportNumber}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{report.origin}</span>
                  <span className="block text-xs text-gray-800">
                    M{report.predictedMagnitudeMin.toFixed(1)}–
                    {report.predictedMagnitudeMax.toFixed(1)} · vence{" "}
                    {formatDeadlineLima(report.deadlineEndLima)}
                  </span>
                </span>
                <span className="text-xs text-gray-900 sm:text-right">
                  {pending > 0
                    ? `${pending} puntos pendientes`
                    : `${strict} coincidencia${strict === 1 ? "" : "s"} · ${ambiguous} ambiguos · ${noMatch} sin coincidencia`}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-6 overflow-x-auto">
        <table
          className="w-full min-w-[70rem] table-fixed text-sm"
          data-testid="claim-ledger"
        >
          <caption className="sr-only">
            Afirmaciones congeladas con su resultado y tasa base
          </caption>
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[9%]" />
            <col className="w-[29%]" />
            <col className="w-[12%]" />
            <col className="w-[35%]" />
          </colgroup>
          <thead>
            <tr className="border-gray-300 border-b text-left text-xs text-gray-900">
              <th scope="col" className="pb-2 pr-5 font-semibold">
                ID y origen
              </th>
              <th scope="col" className="pb-2 pr-5 font-semibold">
                Magnitud
              </th>
              <th scope="col" className="pb-2 pr-5 font-semibold">
                Destinos (resumen)
              </th>
              <th scope="col" className="pb-2 pr-5 font-semibold">
                Deadline (Lima)
              </th>
              <th scope="col" className="pb-2 font-semibold">
                Resultado y tasa base
              </th>
            </tr>
          </thead>
          <tbody>
            {audits.map(({ prediction, audit, outcome }) => {
              const { visible, hidden } = splitTargets(
                prediction.targetRegions,
              );
              const probability = audit?.interpretation.baselineProbability;
              const percentage =
                probability === null || probability === undefined
                  ? null
                  : Number((probability * 100).toFixed(1));
              const baselineLabel = audit
                ? BASELINE_BAND_LABELS[audit.interpretation.baselineBand]
                : "Tasa base no disponible";

              return (
                <tr
                  key={prediction.predictionId}
                  className="border-gray-200 border-b align-middle"
                  data-testid="claim-row"
                >
                  <td className="py-3.5 pr-5">
                    <div className="flex items-start gap-3">
                      <Link
                        href={`/verifica/${prediction.predictionId}`}
                        className="shrink-0 font-mono font-semibold underline underline-offset-2"
                      >
                        {prediction.predictionId}
                      </Link>
                      <span className="leading-5">{prediction.origin}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-5 font-mono text-[13px] tabular-nums">
                    {prediction.predictedMagnitudeMin.toFixed(1)}–
                    {prediction.predictedMagnitudeMax.toFixed(1)}
                  </td>
                  <td className="py-3.5 pr-5">
                    <p className="leading-5">{visible.join(" · ")}</p>
                    {hidden.length > 0 ? (
                      <details className="mt-1.5 text-xs">
                        <summary className="w-fit cursor-pointer rounded border border-gray-300 bg-background-100 px-2 py-1 text-gray-900 hover:border-gray-600">
                          +{hidden.length}{" "}
                          {hidden.length === 1 ? "destino" : "destinos"}
                        </summary>
                        <ul className="mt-2 space-y-1 border-gray-300 border-l pl-3 text-gray-900">
                          {hidden.map((target) => (
                            <li key={target}>{target}</li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </td>
                  <td className="py-3.5 pr-5">
                    <time
                      dateTime={prediction.deadlineEndLima}
                      className="font-mono text-[13px] tabular-nums"
                    >
                      {formatDeadlineLima(prediction.deadlineEndLima)}
                    </time>
                    <span className="mt-1 block text-xs text-gray-800">
                      Lima
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="grid grid-cols-[minmax(8.5rem,0.9fr)_minmax(8rem,1.15fr)_minmax(8.5rem,0.95fr)] items-center gap-4">
                      <div>
                        <OutcomeLabel outcome={outcome} />
                        <p className="mt-1 font-mono text-2xl font-bold tabular-nums leading-none">
                          {percentage === null
                            ? "—"
                            : `${percentage.toFixed(1)}%`}
                        </p>
                      </div>
                      <div
                        aria-label={
                          percentage === null
                            ? "Tasa base no disponible"
                            : `Tasa base ${percentage.toFixed(1)}%`
                        }
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={percentage ?? undefined}
                        className="h-1 overflow-hidden rounded-full bg-gray-200"
                        role="progressbar"
                      >
                        {percentage !== null ? (
                          <div
                            className="h-full rounded-full bg-gray-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        ) : null}
                      </div>
                      <p className="text-xs leading-5 text-gray-900">
                        {baselineLabel}
                      </p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 border-gray-200 border-t pt-4 text-sm text-gray-800">
        <h2 className="font-semibold text-gray-900">
          ¿Quieres registrar una afirmación?
        </h2>
        <p className="mt-1">
          Una nueva afirmación entra por Pull Request o Issue con evidencia
          temporal. Las modificaciones quedan auditadas en git.{" "}
          <a
            href="https://github.com/crafter-research/sismo-abierto/issues/new"
            className="text-gray-1000 underline"
            rel="noreferrer"
          >
            Abrir plantilla de issue
          </a>
        </p>
      </div>
    </div>
  );
}
