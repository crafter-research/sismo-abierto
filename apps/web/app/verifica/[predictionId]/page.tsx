import {
  evaluatePrediction,
  findClaimedValidation,
  findPanoramaByPredictionId,
  GEOGRAPHY_METHOD_NOTE,
  getPrediction,
} from "@sismo/audit";
import type {
  BaselineProbabilityBand,
  ClaimedValidation,
  PredictionMatchOutcome,
} from "@sismo/contracts";
import Link from "next/link";
import { ClassBadge } from "../../../components/badges";
import { SourceErrorState } from "../../../components/error-state";
import { BaselineBadge, OutcomeBadge } from "../../../components/verdict-badge";

export const dynamic = "force-dynamic";

function interpretationMessage(
  outcome: PredictionMatchOutcome,
  band: BaselineProbabilityBand,
): string {
  if (outcome !== "STRICT_MATCH") {
    return "La tasa base contextualiza el resultado, pero no transforma esta evaluación en evidencia de capacidad predictiva.";
  }
  if (band === "VERY_HIGH") {
    return "La coincidencia era muy probable aun sin un método predictivo. No aporta evidencia de capacidad predictiva.";
  }
  if (band === "HIGH") {
    return "La coincidencia era probable aun sin un método predictivo. No establece capacidad predictiva.";
  }
  if (band === "MODERATE") {
    return "La tasa base no es baja. Este resultado aislado no establece capacidad predictiva.";
  }
  if (band === "LOW") {
    return "Es menos esperable según el histórico, pero un resultado aislado requiere repetición independiente.";
  }
  return "Sin una tasa base honesta no se puede interpretar la coincidencia contra el azar.";
}

const CLAIM_BADGES: Record<ClaimedValidation["assessment"], string> = {
  OUTSIDE_FROZEN_MAGNITUDE: "No cumple el rango congelado",
  OUTSIDE_FROZEN_GEOGRAPHY: "No cumple la geografía congelada",
  UNVERIFIABLE_IN_OFFICIAL_SOURCES: "Sin registro en fuentes oficiales",
  SOURCE_DISAGREEMENT_ON_MAGNITUDE: "Las fuentes oficiales discrepan",
  MATCHES_FROZEN_CLAIM: "Coincide con lo congelado",
};

const CLAIM_EXPLANATIONS: Record<ClaimedValidation["assessment"], string> = {
  OUTSIDE_FROZEN_MAGNITUDE:
    "Las fuentes oficiales confirman el evento, pero su magnitud queda fuera del rango que la propia cuenta publicó.",
  OUTSIDE_FROZEN_GEOGRAPHY:
    "Las fuentes oficiales confirman el evento, pero su epicentro cae fuera del destino que la propia cuenta publicó.",
  UNVERIFIABLE_IN_OFFICIAL_SOURCES:
    "El evento no aparece en los catálogos oficiales consultados para esa fecha, magnitud y área.",
  SOURCE_DISAGREEMENT_ON_MAGNITUDE:
    "Las fuentes oficiales confirman el evento pero no coinciden en su magnitud: con una queda dentro del rango publicado y con la otra queda fuera. El protocolo no resuelve el caso a favor de ninguna.",
  MATCHES_FROZEN_CLAIM:
    "Las fuentes oficiales confirman el evento y coincide con lo que la cuenta publicó. Una coincidencia no establece por sí sola capacidad predictiva: la tasa base de la afirmación se reporta abajo.",
};

export default async function ClaimAuditPage({
  params,
}: {
  params: Promise<{ predictionId: string }>;
}) {
  const { predictionId } = await params;
  const [prediction, panorama, claimedValidation] = await Promise.all([
    getPrediction(predictionId),
    findPanoramaByPredictionId(predictionId),
    findClaimedValidation(predictionId),
  ]);
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
        {panorama ? (
          <>
            /{" "}
            <Link
              href={`/verifica/panoramas/${panorama.slug}`}
              className="hover:underline"
            >
              {panorama.title}
            </Link>{" "}
          </>
        ) : null}
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
          {audit ? (
            <OutcomeBadge outcome={audit.interpretation.matchOutcome} />
          ) : null}
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
          {panorama?.registrationMode === "PROSPECTIVE"
            ? `Congelada el ${panorama.backfilledAt} antes del cierre de sus ventanas; verificable en git.`
            : `Incorporada retrospectivamente el ${panorama?.backfilledAt ?? "2026-08-02"}; la fecha pública del Reel se conserva como referencia temporal.`}{" "}
          {panorama ? (
            <a
              href={panorama.sourceUrl}
              className="text-official underline"
              rel="noreferrer"
            >
              Reel original
            </a>
          ) : null}
          .
        </p>
      </header>

      {claimedValidation ? (
        <section
          className="rounded-lg border border-amber-700 bg-amber-50 p-4"
          data-testid="claimed-validation"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              Validación reclamada por la cuenta
            </h2>
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
              {CLAIM_BADGES[claimedValidation.assessment]}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-900">
            La cuenta publicó “{claimedValidation.claimText}” para el evento de{" "}
            {claimedValidation.eventPlace}.{" "}
            {CLAIM_EXPLANATIONS[claimedValidation.assessment]}
          </p>
          <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            {claimedValidation.claimedMagnitude === null ? null : (
              <li
                className="border border-amber-300 bg-amber-100 p-3"
                data-testid="claimed-magnitude"
              >
                <span className="font-semibold">Publicado por la cuenta</span>
                <p className="mt-1 font-mono">
                  M{claimedValidation.claimedMagnitude.toFixed(2)}
                </p>
                {claimedValidation.claimedMagnitudeScale ? (
                  <p className="mt-1 text-amber-900">
                    {claimedValidation.claimedMagnitudeScale}
                  </p>
                ) : null}
              </li>
            )}
            {claimedValidation.sources.map((source) => (
              <li
                key={source.sourceId}
                className="border border-amber-200 bg-white p-3"
              >
                <a
                  href={source.url}
                  className="font-semibold text-official underline"
                  rel="noreferrer"
                >
                  {source.sourceName}
                </a>
                <p className="mt-1 font-mono">
                  M{source.magnitude.toFixed(1)} · {source.depthKm} km
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-800">
            Un reclamo publicado por la cuenta no altera el veredicto del
            protocolo congelado. Cada afirmación se evalúa contra el texto que
            quedó registrado antes de conocer el resultado.
          </p>
        </section>
      ) : null}

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
                Resultado de coincidencia:{" "}
                <OutcomeBadge outcome={audit.interpretation.matchOutcome} />
              </p>
              {audit.baseline ? (
                <div
                  className="rounded-lg border border-gray-300 bg-background-200 p-4"
                  data-testid="combined-interpretation"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <BaselineBadge band={audit.interpretation.baselineBand} />
                    <span className="font-mono text-3xl font-bold text-gray-1000">
                      {`${((audit.interpretation.baselineProbability ?? 0) * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-800">
                    Probabilidad base de al menos una coincidencia durante la
                    ventana, estimada con los 365 días anteriores.
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-1000">
                    {interpretationMessage(
                      audit.interpretation.matchOutcome,
                      audit.interpretation.baselineBand,
                    )}
                  </p>
                  <p className="mt-2 text-xs text-gray-800">
                    Capacidad predictiva: <strong>no establecida</strong>.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-missing">
                  Sin destinos inequívocos no se puede calcular una tasa base
                  honesta.
                </p>
              )}
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
                </div>
              ) : null}
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
