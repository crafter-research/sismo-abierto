import {
  GEOGRAPHY_METHOD_NOTE,
  loadHistoricalReportAuditResults,
  loadPanoramaReportRegistry,
} from "@sismo/audit";
import type { Metadata } from "next";
import Link from "next/link";
import { PredictionReportTable } from "../../../../components/prediction-report-table";
import {
  ReportSwitcher,
  type ReportSwitchGroup,
} from "../../../../components/report-switcher";

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

export default async function HistoricalReportPage({
  params,
}: {
  params: Promise<{ reportNumber: string }>;
}) {
  const { reportNumber: rawReportNumber } = await params;
  const reportNumber = Number(rawReportNumber);
  const [results, panoramas] = await Promise.all([
    loadHistoricalReportAuditResults(),
    loadPanoramaReportRegistry(),
  ]);
  const entry = results.reports.find(
    ({ report }) => report.reportNumber === reportNumber,
  );
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

  const { report, points } = entry;
  const strictCount = points.filter(
    ({ audit }) => audit.interpretation.matchOutcome === "STRICT_MATCH",
  ).length;
  const pendingCount = points.filter(
    ({ audit }) => audit.interpretation.matchOutcome === "PENDING",
  ).length;
  const switchGroups: ReportSwitchGroup[] = [
    {
      label: "Panoramas semanales",
      items: panoramas.toReversed().map((panorama) => ({
        href: `/verifica/panoramas/${panorama.slug}`,
        label: panorama.title,
      })),
    },
    {
      label: "Informes numerados",
      items: results.reports.toReversed().map(({ report: item }) => ({
        href: `/verifica/informes/${item.reportNumber}`,
        label: `Informe ${item.reportNumber}`,
      })),
    },
  ];

  return (
    <div
      className="w-[min(78rem,calc(100vw-2rem))] self-center space-y-6"
      data-testid="historical-report"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="text-xs text-gray-800">
          <Link href="/verifica" className="hover:underline">
            Verifica
          </Link>{" "}
          / Informe {report.reportNumber}
        </nav>
        <ReportSwitcher
          currentHref={`/verifica/informes/${report.reportNumber}`}
          groups={switchGroups}
        />
      </div>

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
          <div className="text-left sm:text-right">
            <p className="font-mono text-sm font-semibold">
              M{report.predictedMagnitudeMin.toFixed(1)}–
              {report.predictedMagnitudeMax.toFixed(1)}
            </p>
            <p className="text-xs text-gray-800">
              {pendingCount > 0
                ? `${pendingCount} puntos pendientes`
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
            ? ` La captura muestra publicación del ${report.sourcePostDate}.`
            : " Fecha pública de publicación no verificada independientemente."}
        </p>
      </section>

      <section aria-labelledby="report-points-title">
        <div className="flex flex-wrap items-end justify-between gap-2 border-gray-300 border-b pb-2">
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

        <PredictionReportTable
          rows={points.map(({ point, prediction, audit }) => ({
            prediction,
            audit,
            outcome: audit.interpretation.matchOutcome,
            pointLabel: `P${point.pointNumber}`,
            claimedProbability: point.claimedProbability,
          }))}
        />
      </section>

      <p className="text-xs leading-5 text-gray-800">
        {GEOGRAPHY_METHOD_NOTE} Esto evalúa coincidencias literales de estos
        informes, no valida la hipótesis de “migración” sísmica.
      </p>
    </div>
  );
}
