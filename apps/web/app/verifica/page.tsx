import {
  loadHistoricalReportAuditResults,
  loadPanoramaReportRegistry,
} from "@sismo/audit";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verifica Sismos" };

function formatLima(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  })
    .format(new Date(value))
    .replaceAll(".", "");
}

export default async function VerificaPage() {
  const [panoramas, historicalResults] = await Promise.all([
    loadPanoramaReportRegistry(),
    loadHistoricalReportAuditResults(),
  ]);

  return (
    <div className="w-[min(72rem,calc(100vw-2rem))] self-center">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Verifica Sismos</h1>
        <p className="max-w-3xl text-sm leading-6 text-gray-900">
          Elige un panorama o informe para revisar sus predicciones. La tabla y
          la evidencia aparecen dentro de cada reporte, no en este índice.
        </p>
        <div
          className="space-y-1 text-xs leading-5 text-gray-800"
          data-testid="prediction-interpretation-note"
        >
          <p>
            <strong className="text-gray-1000">
              Coincidencia no equivale a predicción.
            </strong>{" "}
            La tasa base estima qué tan probable era encontrar al menos una
            coincidencia aun sin un método predictivo. Ninguna coincidencia
            aislada establece capacidad predictiva.
          </p>
          <p>
            Estas afirmaciones provienen de sismos.en.peru, no del IGP. CENSIS y
            USGS se usan para comprobar resultados.{" "}
            <Link href="/verifica/metodologia" className="underline">
              Metodología completa
            </Link>
          </p>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="panoramas-title">
        <div className="flex flex-wrap items-end justify-between gap-2 border-gray-300 border-b pb-2">
          <div>
            <h2 id="panoramas-title" className="text-base font-semibold">
              Panoramas semanales
            </h2>
            <p className="mt-1 text-xs text-gray-800">
              Cinco Reels publicados entre el 29 de junio y el 27 de julio.
            </p>
          </div>
          <span className="font-mono text-[11px] text-gray-800">
            {panoramas.reduce(
              (total, report) => total + report.points.length,
              0,
            )}{" "}
            predicciones
          </span>
        </div>
        <div
          className="divide-y divide-gray-200"
          data-testid="panorama-report-list"
        >
          {panoramas.toReversed().map((report) => {
            const deadline = report.points.reduce(
              (latest, point) =>
                point.deadlineEndLima > latest ? point.deadlineEndLima : latest,
              report.points[0]?.deadlineEndLima ?? report.periodEnd,
            );
            return (
              <Link
                key={report.slug}
                href={`/verifica/panoramas/${report.slug}`}
                className="grid gap-1 py-4 text-sm hover:bg-background-200 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:px-2"
                data-testid="panorama-report-row"
              >
                <span className="font-semibold underline underline-offset-2">
                  {report.title}
                </span>
                <span className="min-w-0">
                  <span className="block text-gray-900">
                    Reel{" "}
                    {new URL(report.sourceUrl).pathname
                      .split("/")
                      .filter(Boolean)
                      .at(-1)}
                  </span>
                  <span className="block text-xs text-gray-800">
                    Publicado {formatLima(report.sourcePublishedAtLima)}
                  </span>
                </span>
                <span className="text-xs text-gray-900 sm:text-right">
                  {report.points.length} predicciones · hasta{" "}
                  {formatLima(deadline)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="historical-reports-title">
        <div className="flex flex-wrap items-end justify-between gap-2 border-gray-300 border-b pb-2">
          <div>
            <h2
              id="historical-reports-title"
              className="text-base font-semibold"
            >
              Informes numerados
            </h2>
            <p className="mt-1 text-xs text-gray-800">
              Backfill retrospectivo de los informes 244 al 254 aportados como
              capturas.
            </p>
          </div>
          <span className="font-mono text-[11px] text-gray-800">
            Auditoría {historicalResults.runAt.slice(0, 10)}
          </span>
        </div>
        <div
          className="divide-y divide-gray-200"
          data-testid="historical-report-list"
        >
          {historicalResults.reports.toReversed().map(({ report, points }) => {
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
                className="grid gap-1 py-4 text-sm hover:bg-background-200 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(14rem,auto)] sm:items-center sm:gap-5 sm:px-2"
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
                    {formatLima(report.deadlineEndLima)}
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

      <div className="mt-8 border-gray-200 border-t pt-4 text-sm text-gray-800">
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
