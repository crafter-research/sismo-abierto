import {
  evaluatePrediction,
  GEOGRAPHY_METHOD_NOTE,
  getPrediction,
} from "@sismo/audit";
import Link from "next/link";
import { ClassBadge } from "../../../components/badges";
import { SourceErrorState } from "../../../components/error-state";
import { VerdictBadge } from "../../../components/verdict-badge";

export const dynamic = "force-dynamic";

export default async function ClaimAuditPage({
  params,
}: {
  params: Promise<{ predictionId: string }>;
}) {
  const { predictionId } = await params;
  const prediction = await getPrediction(predictionId);
  if (!prediction) {
    return (
      <p className="text-sm text-gray-900">
        No existe la afirmación {predictionId}.{" "}
        <Link href="/verifica" className="text-official underline">
          Volver al registro
        </Link>
      </p>
    );
  }

  let audit: Awaited<ReturnType<typeof evaluatePrediction>> | null = null;
  let auditError: unknown = null;
  try {
    audit = await evaluatePrediction(prediction, Date.now());
  } catch (error) {
    auditError = error;
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-800">
        <Link href="/verifica" className="hover:underline">
          Verifica
        </Link>{" "}
        / <span className="font-mono">{prediction.predictionId}</span>
      </nav>

      <header
        className="rounded-lg border border-gray-200 p-4"
        data-testid="frozen-claim"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">
            {prediction.predictionId} · Afirmación congelada
          </h1>
          {audit ? <VerdictBadge verdict={audit.verdict} /> : null}
        </div>
        <p className="mt-2 text-sm text-gray-800">
          El Reel proyecta que el evento de <strong>{prediction.origin}</strong>{" "}
          (M
          {prediction.originMagnitude.toFixed(1)}) "migra" hacia:{" "}
          <strong>{prediction.targetRegions.join("; ")}</strong>, con magnitud{" "}
          <span className="font-mono">
            {prediction.predictedMagnitudeMin}–
            {prediction.predictedMagnitudeMax}
          </span>{" "}
          en un máximo de {prediction.maxDays} días.
        </p>
        <p className="mt-1 text-xs text-gray-800">
          Congelada el 2026-07-20 antes de conocer resultados (archivo
          `data/predictions/predictions.csv`, verificable en git). Fuente
          original: Reel DbAK4jKpyxP de sismos.en.peru.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold">Criterios publicados</h2>
          <dl className="mt-2 space-y-1.5 text-sm" data-testid="criteria-table">
            <div className="flex gap-2">
              <dt className="text-gray-800">Ventana:</dt>
              <dd className="font-mono text-xs">
                {prediction.startDate} 00:00 → {prediction.deadlineEndLima}{" "}
                (Lima)
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-800">Magnitud:</dt>
              <dd className="font-mono">
                [{prediction.predictedMagnitudeMin},{" "}
                {prediction.predictedMagnitudeMax}] inclusivo
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-gray-800">
                Destinos con límites inequívocos:
              </dt>
              <dd>
                {audit && audit.unambiguousRegions.length > 0 ? (
                  <ul className="list-inside list-disc text-xs">
                    {audit.unambiguousRegions.map((region) => (
                      <li key={region}>{region}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-missing">Ninguno</span>
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-gray-800">
                Destinos vagos (sin frontera inventada):
              </dt>
              <dd>
                {audit && audit.ambiguousRegions.length > 0 ? (
                  <ul
                    className="list-inside list-disc text-xs"
                    data-testid="ambiguity-panel"
                  >
                    {audit.ambiguousRegions.map((region) => (
                      <li key={region}>{region}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-gray-800">Ninguno</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold">Resultado</h2>
          {audit ? (
            <div className="mt-2 space-y-3 text-sm" data-testid="verdict">
              <p className="flex items-center gap-2">
                Estado: <VerdictBadge verdict={audit.verdict} />
              </p>
              {audit.verdict === "PENDING" ? (
                <p className="text-gray-900">
                  La ventana sigue abierta. El protocolo congelado no busca
                  coincidencias ni declara resultados hasta el deadline.
                </p>
              ) : (
                <div data-testid="matching-events">
                  <p className="text-gray-900">
                    Eventos candidatos:{" "}
                    <span className="font-mono">{audit.candidates.length}</span>
                  </p>
                  {audit.candidates.length > 0 ? (
                    <ul className="mt-1 space-y-1 text-xs">
                      {audit.candidates.map((candidateEvent) => (
                        <li
                          key={`${candidateEvent.eventTimeUtc}-${candidateEvent.matchedRegion}`}
                          className="rounded border border-gray-200 p-2 font-mono"
                        >
                          {candidateEvent.eventTimeUtc} · M
                          {candidateEvent.magnitude} · {candidateEvent.place} ·{" "}
                          {candidateEvent.matchedRegion}
                          {candidateEvent.regionIsAmbiguous
                            ? " · FRONTERA"
                            : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
              {audit.baseline ? (
                <div
                  className="rounded bg-derived-soft p-3"
                  data-testid="baseline-chart"
                >
                  <p className="flex items-center gap-2 text-xs font-semibold text-derived">
                    <ClassBadge value="derived" /> Control contra azar
                  </p>
                  <p className="mt-1 text-xs text-gray-800">
                    En los {audit.baseline.lookbackDays} días previos a la
                    ventana hubo{" "}
                    <span className="font-mono">
                      {audit.baseline.matchingEventCount}
                    </span>{" "}
                    eventos con esta magnitud en los destinos inequívocos (
                    <span className="font-mono">
                      {audit.baseline.eventsPerDay}
                    </span>{" "}
                    por día). La probabilidad de al menos una coincidencia por
                    azar en los{" "}
                    <span className="font-mono">
                      {audit.baseline.windowDays}
                    </span>{" "}
                    días de la ventana es{" "}
                    <span className="font-mono font-bold">
                      {(audit.baseline.probabilityAtLeastOne * 100).toFixed(1)}%
                    </span>
                    .
                  </p>
                  <p className="mt-1 text-[11px] text-gray-800">
                    Un acierto observado con probabilidad base alta no es
                    evidencia de capacidad predictiva.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-missing">
                  Sin destinos inequívocos no se puede calcular una tasa base
                  honesta.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <SourceErrorState
                error={auditError}
                context="No pudimos evaluar esta afirmación contra los catálogos oficiales."
              />
            </div>
          )}
        </div>
      </section>

      {audit ? (
        <section
          className="rounded-lg border border-gray-200 p-4"
          data-testid="evidence-links"
        >
          <h2 className="font-semibold">Evidencia de esta evaluación</h2>
          <ul className="mt-2 space-y-1.5 text-xs">
            {audit.evidence.map((entry) => (
              <li
                key={`${entry.at}-${entry.action}-${entry.url}`}
                className="text-gray-900"
              >
                <span className="font-mono">{entry.at}</span> · {entry.action} ·{" "}
                {entry.detail}
                {entry.url ? (
                  <>
                    {" "}
                    <a
                      href={entry.url}
                      className="text-official underline"
                      rel="noreferrer"
                    >
                      consulta
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-xs text-gray-800">
        {GEOGRAPHY_METHOD_NOTE}{" "}
        <Link href="/verifica/metodologia" className="text-official underline">
          Ver metodología completa
        </Link>
        . Esto evalúa una afirmación, no valida ni refuta una teoría general.
      </p>
    </div>
  );
}
