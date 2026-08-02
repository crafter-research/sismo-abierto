import {
  evaluatePrediction,
  loadPredictionRegistry,
  MATCH_OUTCOME_LABELS,
  windowHasClosed,
} from "@sismo/audit";
import type { PredictionMatchOutcome } from "@sismo/contracts";
import Link from "next/link";
import {
  BaselineBadge,
  OUTCOME_STYLES,
  OutcomeBadge,
} from "../../components/verdict-badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verifica Sismos" };

const OUTCOMES: PredictionMatchOutcome[] = [
  "PENDING",
  "STRICT_MATCH",
  "NO_MATCH",
  "AMBIGUOUS_GEOGRAPHY",
  "SOURCE_DISAGREEMENT",
];

export default async function VerificaPage() {
  const registry = await loadPredictionRegistry();
  const now = Date.now();

  const counts: Record<PredictionMatchOutcome, number> = {
    PENDING: 0,
    STRICT_MATCH: 0,
    NO_MATCH: 0,
    AMBIGUOUS_GEOGRAPHY: 0,
    SOURCE_DISAGREEMENT: 0,
  };
  const audits = [];
  for (const prediction of registry) {
    let audit: Awaited<ReturnType<typeof evaluatePrediction>> | null = null;
    if (windowHasClosed(prediction, now)) {
      audit = await evaluatePrediction(prediction, now).catch(() => null);
    }
    const outcome = audit?.interpretation.matchOutcome ?? "PENDING";
    counts[outcome] += 1;
    audits.push({ prediction, audit, outcome });
  }

  const strictMatches = audits.filter(
    ({ outcome }) => outcome === "STRICT_MATCH",
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Verifica Sismos</h1>
        <p className="text-sm text-gray-900">
          Afirmaciones guardadas antes de conocer el resultado. Este registro
          evalúa afirmaciones concretas contra catálogos oficiales; no ataca
          personas ni valida teorías generales.
        </p>
        <p className="mt-1 text-xs text-gray-800">
          <strong>Estas afirmaciones no fueron emitidas por el IGP.</strong>{" "}
          Provienen del Reel de Instagram DbAK4jKpyxP de sismos.en.peru,
          congelado el 20 de julio de 2026. IGP/CENSIS y USGS se usan como
          fuentes para comprobar los resultados.{" "}
          <Link
            href="/verifica/metodologia"
            className="text-official underline"
          >
            Metodología completa
          </Link>
        </p>
      </header>

      <div className="flex flex-wrap gap-3 text-sm" data-testid="audit-summary">
        {OUTCOMES.map((outcome) => (
          <span
            key={outcome}
            className={`rounded px-2 py-1 text-xs font-semibold ${OUTCOME_STYLES[outcome]}`}
          >
            {MATCH_OUTCOME_LABELS[outcome]} {counts[outcome]}
          </span>
        ))}
      </div>

      <section
        className="rounded-lg border border-gray-300 bg-background-200 p-4"
        data-testid="strict-match-context"
      >
        <h2 className="font-semibold text-gray-1000">
          Cómo leer las {strictMatches.length} coincidencias estrictas
        </h2>
        <p className="mt-1 text-sm text-gray-900">
          Coincidir con tiempo, magnitud y geografía no equivale a predecir. La
          tasa base estima qué tan probable era obtener al menos una
          coincidencia aun sin un método predictivo.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {strictMatches.map(({ prediction, audit }) => (
            <Link
              key={prediction.predictionId}
              href={`/verifica/${prediction.predictionId}`}
              className="rounded border border-gray-300 bg-background-100 p-3 hover:border-gray-600"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold">
                  {prediction.predictionId}
                </span>
                {audit ? (
                  <BaselineBadge band={audit.interpretation.baselineBand} />
                ) : null}
              </div>
              <p className="mt-2 font-mono text-2xl font-bold">
                {audit?.interpretation.baselineProbability === null ||
                audit?.interpretation.baselineProbability === undefined
                  ? "Sin tasa"
                  : `${(audit.interpretation.baselineProbability * 100).toFixed(1)}%`}
              </p>
              <p className="text-xs text-gray-800">probabilidad base</p>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-gray-900">
          Ninguna coincidencia aislada establece capacidad predictiva.
        </p>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="claim-list">
          <caption className="sr-only">
            Afirmaciones congeladas con su estado actual
          </caption>
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
              <th scope="col" className="py-1.5 pr-2">
                ID
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Origen declarado
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Magnitud
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Destinos
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Deadline (Lima)
              </th>
              <th scope="col" className="py-1.5">
                Estado
              </th>
              <th scope="col" className="py-1.5 pl-2">
                Tasa base
              </th>
            </tr>
          </thead>
          <tbody>
            {audits.map(({ prediction, audit, outcome }) => (
              <tr
                key={prediction.predictionId}
                className="border-b border-gray-100"
              >
                <td className="py-1.5 pr-2">
                  <Link
                    href={`/verifica/${prediction.predictionId}`}
                    className="font-mono font-semibold text-official underline"
                  >
                    {prediction.predictionId}
                  </Link>
                </td>
                <td className="py-1.5 pr-2">{prediction.origin}</td>
                <td className="py-1.5 pr-2 font-mono">
                  {prediction.predictedMagnitudeMin}–
                  {prediction.predictedMagnitudeMax}
                </td>
                <td className="py-1.5 pr-2 text-xs">
                  {prediction.targetRegions.join(" · ")}
                </td>
                <td className="py-1.5 pr-2 font-mono text-xs">
                  {prediction.deadlineEndLima}
                </td>
                <td className="py-1.5">
                  <OutcomeBadge outcome={outcome} />
                </td>
                <td className="py-1.5 pl-2">
                  {audit?.interpretation.baselineProbability === null ||
                  audit?.interpretation.baselineProbability === undefined ? (
                    <span className="text-xs text-gray-800">No disponible</span>
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-mono text-xs font-bold">
                        {(
                          audit.interpretation.baselineProbability * 100
                        ).toFixed(1)}
                        %
                      </span>
                      <BaselineBadge band={audit.interpretation.baselineBand} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-800">
        <h2 className="font-semibold text-gray-900">
          ¿Quieres registrar una afirmación?
        </h2>
        <p className="mt-1">
          Una nueva afirmación entra por Pull Request o Issue con evidencia
          temporal (captura y fecha anteriores al resultado). Las modificaciones
          quedan auditadas en git.
        </p>
        <a
          href="https://github.com/crafter-research/sismo-abierto/issues/new"
          className="mt-2 inline-block text-official underline"
          rel="noreferrer"
        >
          Abrir plantilla de issue →
        </a>
      </div>
    </div>
  );
}
