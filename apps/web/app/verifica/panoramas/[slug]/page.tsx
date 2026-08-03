import {
  GEOGRAPHY_METHOD_NOTE,
  getPanoramaReport,
  loadHistoricalReportAuditResults,
  loadPanoramaReportRegistry,
  loadPredictionAuditResults,
  windowHasClosed,
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = await getPanoramaReport(slug);
  return { title: `${report?.title ?? "Panorama"} · Verifica Sismos` };
}

function formatLima(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  })
    .format(new Date(value))
    .replaceAll(".", "");
}

export default async function PanoramaReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [report, panoramas, historicalResults, currentResults] =
    await Promise.all([
      getPanoramaReport(slug),
      loadPanoramaReportRegistry(),
      loadHistoricalReportAuditResults(),
      loadPredictionAuditResults(),
    ]);
  if (!report) {
    return (
      <p className="text-sm text-gray-900">
        No existe el panorama {slug}.{" "}
        <Link href="/verifica" className="underline">
          Volver a Verifica
        </Link>
      </p>
    );
  }

  const audits = report.points.map(
    (point) =>
      currentResults.audits.find(
        (audit) => audit.predictionId === point.predictionId,
      ) ?? null,
  );
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
      items: historicalResults.reports.toReversed().map(({ report: item }) => ({
        href: `/verifica/informes/${item.reportNumber}`,
        label: `Informe ${item.reportNumber}`,
      })),
    },
  ];

  return (
    <div
      className="w-[min(78rem,calc(100vw-2rem))] self-center space-y-6"
      data-testid="panorama-report"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="text-xs text-gray-800">
          <Link href="/verifica" className="hover:underline">
            Verifica
          </Link>{" "}
          / {report.title}
        </nav>
        <ReportSwitcher
          currentHref={`/verifica/panoramas/${report.slug}`}
          groups={switchGroups}
        />
      </div>

      <header className="border-gray-200 border-b pb-5">
        <h1 className="text-2xl font-bold tracking-tight">{report.title}</h1>
        <p className="mt-1 text-sm text-gray-900">
          {report.points.length} predicciones publicadas entre el{" "}
          {report.periodStart} y el {report.periodEnd}.
        </p>
        <p className="mt-2 text-xs leading-5 text-gray-800">
          Fuente: {report.sourceEvidence}. Publicado el{" "}
          {formatLima(report.sourcePublishedAtLima)}.{" "}
          {report.registrationMode === "PROSPECTIVE"
            ? `El registro se congeló el ${report.backfilledAt} antes del cierre de sus ventanas, preservando la fecha pública del Reel.`
            : `El registro se incorporó retrospectivamente el ${report.backfilledAt}, conservando la fecha pública del Reel como referencia temporal.`}{" "}
          <a
            href={report.sourceUrl}
            className="text-gray-1000 underline"
            rel="noreferrer"
          >
            Abrir Reel original
          </a>
        </p>
      </header>

      <section aria-labelledby="panorama-points-title">
        <div className="border-gray-300 border-b pb-2">
          <h2 id="panorama-points-title" className="font-semibold">
            Evaluación por predicción
          </h2>
          <p className="mt-1 text-xs text-gray-800">
            Cada fila conserva origen, magnitud, destinos y plazo declarados en
            el Reel. La tasa base mide coincidencias esperables sin predicción.
          </p>
        </div>
        <PredictionReportTable
          rows={report.points.map((point, index) => ({
            prediction: point,
            audit: audits[index] ?? null,
            outcome: audits[index]?.interpretation.matchOutcome ?? null,
            statusLabel: windowHasClosed(point, Date.now())
              ? "Auditoría pendiente"
              : "Ventana abierta",
            pointLabel: `P${point.pointNumber}`,
            href: `/verifica/${point.predictionId}`,
          }))}
        />
      </section>

      <p className="text-xs leading-5 text-gray-800">
        {GEOGRAPHY_METHOD_NOTE} Esto evalúa coincidencias literales, no valida
        la hipótesis de “migración” sísmica ni convierte un caso aislado en
        capacidad predictiva.
      </p>
    </div>
  );
}
