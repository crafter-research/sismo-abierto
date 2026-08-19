import {
  BASELINE_BAND_LABELS,
  openWindowState,
  sourceConsensus,
} from "@sismo/audit";
import type {
  ClaimedValidation,
  FrozenPrediction,
  PredictionAudit,
  PredictionMatchOutcome,
} from "@sismo/contracts";
import Link from "next/link";
import { sourceLinksFor } from "../lib/source-links";
import { OriginFlag, TargetFlags } from "./origin-flag";
import { OutcomeLabel } from "./verdict-badge";

export interface PredictionReportRow {
  prediction: FrozenPrediction;
  audit: PredictionAudit | null;
  outcome: PredictionMatchOutcome | null;
  statusLabel?: string;
  pointLabel: string;
  claimedProbability?: number;
  claimedValidation?: ClaimedValidation | null;
  href?: string;
}

/**
 * Resumen corto del contraste entre lo que la cuenta publicó y lo que dicen las
 * fuentes oficiales. La ficha del punto trae el detalle completo; acá solo hace
 * falta que se vea, desde la tabla, que hubo un reclamo y en qué quedó.
 */
/**
 * Qué decir de una ventana abierta que ya tiene un reclamo publicado. Describe
 * lo observado sin adelantar el veredicto, que sigue siendo del protocolo.
 */
const OPEN_WINDOW_LABELS: Record<string, string> = {
  NO_CLAIM_YET: "Pendiente",
  CLAIM_INSIDE_RANGE: "Pendiente · coincidencia parcial",
  CLAIM_OUTSIDE_RANGE: "Pendiente · reclamo no califica",
  CLAIM_SOURCES_SPLIT: "Pendiente · fuentes divididas",
};

const OPEN_WINDOW_TITLES: Record<string, string> = {
  NO_CLAIM_YET:
    "La ventana sigue abierta. El protocolo no busca coincidencias hasta el deadline.",
  CLAIM_INSIDE_RANGE:
    "La cuenta ya declaró esta proyección cumplida y el evento que invoca cae dentro del rango y del plazo publicados. El veredicto final espera al cierre de la ventana.",
  CLAIM_OUTSIDE_RANGE:
    "La cuenta ya declaró esta proyección cumplida, pero el evento que invoca queda fuera del rango publicado según las fuentes oficiales.",
  CLAIM_SOURCES_SPLIT:
    "La cuenta ya declaró esta proyección cumplida. Una fuente oficial deja el evento dentro del rango publicado y la otra lo deja fuera.",
};

const CLAIM_SUMMARY: Record<ClaimedValidation["assessment"], string> = {
  MATCHES_FROZEN_CLAIM: "coincide",
  OUTSIDE_FROZEN_MAGNITUDE: "magnitud fuera",
  OUTSIDE_FROZEN_GEOGRAPHY: "epicentro fuera",
  SOURCE_DISAGREEMENT_ON_MAGNITUDE: "fuentes discrepan",
  UNVERIFIABLE_IN_OFFICIAL_SOURCES: "sin registro oficial",
};

/** Texto completo para el title, que es donde hay espacio para explicarlo. */
const CLAIM_SUMMARY_FULL: Record<ClaimedValidation["assessment"], string> = {
  MATCHES_FROZEN_CLAIM: "coincide con lo publicado",
  OUTSIDE_FROZEN_MAGNITUDE: "magnitud fuera del rango publicado",
  OUTSIDE_FROZEN_GEOGRAPHY: "epicentro fuera del destino publicado",
  SOURCE_DISAGREEMENT_ON_MAGNITUDE: "las fuentes oficiales discrepan",
  UNVERIFIABLE_IN_OFFICIAL_SOURCES: "sin registro en fuentes oficiales",
};

/**
 * De todos los candidatos, el que mejor representa la comparación: primero uno
 * que haya caído dentro de una región inequívoca, si no el de mayor magnitud.
 * Los demás siguen listados completos en "Ver evidencia".
 */
function leadCandidate(
  audit: PredictionAudit | null,
): PredictionAudit["candidates"][number] | null {
  if (!audit || audit.candidates.length === 0) return null;
  const inside = audit.candidates.filter(
    (candidate) => candidate.match === "inside",
  );
  const pool = inside.length > 0 ? inside : audit.candidates;
  return pool.reduce((best, candidate) =>
    candidate.magnitude > best.magnitude ? candidate : best,
  );
}

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

export function PredictionReportTable({
  rows,
}: {
  rows: PredictionReportRow[];
}) {
  return (
    <div className="overflow-x-auto" data-testid="report-table-wrap">
      <table
        className="w-full min-w-[68rem] table-fixed text-sm"
        data-testid="claim-ledger"
      >
        <caption className="sr-only">
          Predicciones del reporte con resultado y tasa base
        </caption>
        <colgroup>
          <col className="w-[15%]" />
          <col className="w-[8%]" />
          <col className="w-[22%]" />
          <col className="w-[10%]" />
          <col className="w-[22%]" />
          <col className="w-[23%]" />
        </colgroup>
        <thead>
          <tr className="border-gray-300 border-b text-left text-xs text-gray-900">
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Punto y origen
            </th>
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Magnitud predicha
            </th>
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Migración declarada
            </th>
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Deadline Lima
            </th>
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Sismo comparado
            </th>
            <th scope="col" className="pb-2 font-semibold">
              Resultado y tasa base
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(
            ({
              prediction,
              audit,
              outcome,
              statusLabel,
              pointLabel,
              claimedProbability,
              claimedValidation,
              href,
            }) => {
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
                : "Tasa base pendiente";

              return (
                <tr
                  key={prediction.predictionId}
                  className="border-gray-200 border-b align-middle"
                  data-testid="claim-row"
                >
                  <td className="py-3.5 pr-5 align-top">
                    <div className="flex items-start gap-3">
                      {href ? (
                        <Link
                          href={href}
                          className="shrink-0 font-mono font-semibold underline underline-offset-2"
                        >
                          {pointLabel}
                        </Link>
                      ) : (
                        <span className="shrink-0 font-mono font-semibold">
                          {pointLabel}
                        </span>
                      )}
                      <OriginFlag origin={prediction.origin} />
                      <span className="leading-5">{prediction.origin}</span>
                    </div>
                    {claimedProbability !== undefined ? (
                      <span className="mt-1 block text-xs text-gray-800">
                        {claimedProbability}% declarado
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3.5 pr-5 align-top font-mono text-[13px] tabular-nums">
                    {prediction.predictedMagnitudeMin.toFixed(1)}–
                    {prediction.predictedMagnitudeMax.toFixed(1)}
                  </td>
                  <td className="py-3.5 pr-5 align-top">
                    <ul className="space-y-0.5 leading-5">
                      {visible.map((target) => (
                        <li key={target} className="flex flex-wrap items-start">
                          {/* La flecha nombra la afirmación que se audita: la
                              cuenta sostiene que la energía del origen migra a
                              este destino. Es la hipótesis, no un hecho. */}
                          <span
                            aria-hidden="true"
                            className="mr-1.5 shrink-0 select-none text-gray-700"
                          >
                            &rarr;
                          </span>
                          <TargetFlags target={target} />
                          <span>{target}</span>
                        </li>
                      ))}
                    </ul>
                    {hidden.length > 0 ? (
                      <details className="mt-1.5 text-xs">
                        <summary className="w-fit cursor-pointer rounded border border-gray-300 bg-background-100 px-2 py-1 text-gray-900 hover:border-gray-600">
                          +{hidden.length} destinos
                        </summary>
                        <ul className="mt-2 space-y-1 border-gray-300 border-l pl-3 text-gray-900">
                          {hidden.map((target) => (
                            <li
                              key={target}
                              className="flex flex-wrap items-start"
                            >
                              <TargetFlags target={target} />
                              <span>{target}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </td>
                  <td className="py-3.5 pr-5 align-top">
                    <time
                      dateTime={prediction.deadlineEndLima}
                      className="font-mono text-[13px] tabular-nums"
                    >
                      {formatDeadlineLima(prediction.deadlineEndLima)}
                    </time>
                  </td>
                  <td className="py-3.5 pr-5 align-top">
                    {(() => {
                      const lead = leadCandidate(audit);
                      if (!lead) {
                        // Sin candidato oficial, lo que importa es qué sismo
                        // invocó la cuenta para declararse acertada. Decir solo
                        // "ninguno cumplió" oculta la afirmación que se evalúa.
                        if (!claimedValidation) {
                          return (
                            <span className="text-xs text-gray-800">
                              Ningún sismo cumplió magnitud y plazo
                            </span>
                          );
                        }
                        const alegado = claimedValidation;
                        const linksAlegado = sourceLinksFor(
                          alegado.sources[0]?.sourceId ?? "",
                          alegado.eventTimeUtc,
                          alegado.sources[0]?.magnitude ?? 0,
                        );
                        return (
                          <div
                            className="text-xs leading-5"
                            data-testid="alleged-event"
                          >
                            <p className="font-semibold text-amber-800">
                              Sismo alegado por la cuenta
                            </p>
                            {(() => {
                              const consenso = sourceConsensus(
                                alegado,
                                prediction,
                              );
                              return (
                                <p className="text-gray-900">
                                  {consenso.total > 0
                                    ? `${consenso.inside} de ${consenso.total} fuentes dentro del rango`
                                    : "Sin registro en fuentes oficiales"}
                                  {consenso.total > 0 ? (
                                    <span className="text-gray-800">
                                      {" · error "}
                                      {consenso.minError === consenso.maxError
                                        ? consenso.minError.toFixed(2)
                                        : `${consenso.minError.toFixed(2)} a ${consenso.maxError.toFixed(2)}`}
                                    </span>
                                  ) : null}
                                </p>
                              );
                            })()}
                            <details className="mt-1">
                              <summary className="w-fit cursor-pointer text-gray-900 underline underline-offset-2">
                                Ver el sismo alegado
                              </summary>
                              <div className="mt-1.5 space-y-0.5 border-gray-300 border-l pl-2.5">
                                <p className="flex flex-wrap items-center gap-x-1.5">
                                  <span className="text-gray-900">
                                    {alegado.eventTimeUtc.slice(0, 10)}
                                  </span>
                                  <TargetFlags
                                    target={alegado.eventPlace}
                                    max={1}
                                  />
                                  <span className="text-gray-900">
                                    {alegado.eventPlace}
                                  </span>
                                </p>
                                <p className="text-gray-900">
                                  <span className="text-gray-800">
                                    Magnitud según la cuenta:
                                  </span>{" "}
                                  <span className="font-mono tabular-nums">
                                    {alegado.claimedMagnitude === null
                                      ? "M?"
                                      : `M${alegado.claimedMagnitude.toFixed(2)}`}
                                  </span>
                                  {alegado.claimedMagnitudeScale ? (
                                    <span className="text-gray-800">
                                      {" "}
                                      ({alegado.claimedMagnitudeScale})
                                    </span>
                                  ) : null}
                                  <span
                                    className="text-gray-800"
                                    title={
                                      alegado.claimedSourceCited
                                        ? undefined
                                        : "La publicación muestra una captura de una aplicación de terceros sin nombrar qué agencia calculó la magnitud."
                                    }
                                  >
                                    {" · "}
                                    {alegado.claimedSourceCited
                                      ? `cita ${alegado.claimedSourceCited}`
                                      : "sin fuente citada"}
                                  </span>
                                </p>
                                {alegado.sources.some(
                                  (source) => source.magnitude > 0,
                                ) ? (
                                  <p className="text-gray-900">
                                    <span className="text-gray-800">
                                      Medido oficialmente:
                                    </span>{" "}
                                    {alegado.sources
                                      .filter((source) => source.magnitude > 0)
                                      .map((source, index) => {
                                        const dentro =
                                          source.magnitude >=
                                            prediction.predictedMagnitudeMin &&
                                          source.magnitude <=
                                            prediction.predictedMagnitudeMax;
                                        return (
                                          <span key={source.sourceId}>
                                            {index > 0 ? ", " : ""}
                                            <span className="font-mono tabular-nums">
                                              M{source.magnitude.toFixed(1)}
                                            </span>{" "}
                                            <a
                                              href={source.url}
                                              rel="noreferrer"
                                              className="text-official underline underline-offset-2"
                                            >
                                              {source.sourceName
                                                .split(" · ")
                                                .pop()}
                                            </a>{" "}
                                            <span
                                              className={
                                                dentro
                                                  ? "text-official"
                                                  : "text-amber-800"
                                              }
                                            >
                                              {dentro ? "dentro" : "fuera"}
                                            </span>
                                          </span>
                                        );
                                      })}
                                  </p>
                                ) : (
                                  <p className="text-gray-800">
                                    Sin registro en fuentes oficiales
                                  </p>
                                )}
                              </div>
                            </details>
                            {linksAlegado.length > 0 ? (
                              <p className="mt-0.5 flex flex-wrap gap-x-2">
                                {linksAlegado.map((link) => (
                                  <a
                                    key={link.href}
                                    href={link.href}
                                    rel="noreferrer"
                                    className="text-official underline underline-offset-2"
                                  >
                                    {link.label}
                                  </a>
                                ))}
                              </p>
                            ) : null}
                          </div>
                        );
                      }
                      const links = sourceLinksFor(
                        lead.sourceId,
                        lead.eventTimeUtc,
                        lead.magnitude,
                      );
                      const extra = (audit?.candidates.length ?? 1) - 1;
                      return (
                        <div className="text-xs leading-5">
                          <p className="font-mono font-semibold tabular-nums">
                            M{lead.magnitude.toFixed(1)}
                            <span className="ml-1.5 font-normal text-gray-900">
                              {lead.eventTimeUtc.slice(0, 10)}
                            </span>
                          </p>
                          <p className="flex flex-wrap items-center text-gray-900">
                            <TargetFlags target={lead.matchedRegion} max={1} />
                            <span>{lead.matchedRegion}</span>
                          </p>
                          <p className="font-mono text-[11px] text-gray-800">
                            {lead.latitude.toFixed(2)},{" "}
                            {lead.longitude.toFixed(2)}
                          </p>
                          <p className="mt-0.5 flex flex-wrap gap-x-2">
                            {links.map((link) => (
                              <a
                                key={link.href}
                                href={link.href}
                                rel="noreferrer"
                                className="text-official underline underline-offset-2"
                                title={
                                  link.precision === "catalog"
                                    ? "El catálogo no publica un enlace por evento"
                                    : undefined
                                }
                              >
                                {link.label}
                              </a>
                            ))}
                          </p>
                          {extra > 0 ? (
                            <p className="text-[11px] text-gray-800">
                              +{extra} candidato{extra > 1 ? "s" : ""} en la
                              evidencia
                            </p>
                          ) : null}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3.5 align-top">
                    <div className="grid grid-cols-[minmax(8.5rem,0.9fr)_minmax(8rem,1.15fr)] items-center gap-4">
                      <div>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {outcome ? (
                            outcome === "PENDING" ? (
                              (() => {
                                const state = openWindowState(
                                  claimedValidation ?? null,
                                  prediction,
                                );
                                return (
                                  <span
                                    className="inline-flex font-semibold text-gray-900 text-xs"
                                    title={OPEN_WINDOW_TITLES[state]}
                                    data-testid="open-window-state"
                                  >
                                    {OPEN_WINDOW_LABELS[state]}
                                  </span>
                                );
                              })()
                            ) : (
                              <OutcomeLabel outcome={outcome} />
                            )
                          ) : (
                            (() => {
                              const state = openWindowState(
                                claimedValidation ?? null,
                                prediction,
                              );
                              const abierta = statusLabel === "Ventana abierta";
                              return (
                                <span
                                  className="inline-flex rounded bg-gray-200 px-2 py-1 font-semibold text-xs text-gray-900"
                                  title={
                                    abierta
                                      ? OPEN_WINDOW_TITLES[state]
                                      : undefined
                                  }
                                >
                                  {abierta
                                    ? OPEN_WINDOW_LABELS[state]
                                    : (statusLabel ?? "Sin auditoría")}
                                </span>
                              );
                            })()
                          )}
                          {claimedValidation ? (
                            <span
                              className="inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] leading-4 text-amber-950"
                              data-testid="row-claimed-validation"
                              title={`La cuenta declaró esta proyección cumplida: ${CLAIM_SUMMARY_FULL[claimedValidation.assessment]}`}
                            >
                              <span aria-hidden="true">◆</span>
                              {CLAIM_SUMMARY[claimedValidation.assessment]}
                            </span>
                          ) : null}
                        </span>
                        <p
                          className="mt-1 font-mono text-xl font-bold tabular-nums leading-none"
                          title={
                            percentage === null
                              ? "Sin tasa base: el destino publicado no tiene límites definidos, así que no hay área contra la cual contar los eventos históricos."
                              : undefined
                          }
                        >
                          {percentage === null
                            ? "—"
                            : `${percentage.toFixed(1)}%`}
                        </p>
                      </div>
                      <div>
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
                        <p className="mt-2 text-xs leading-5 text-gray-900">
                          {baselineLabel}
                        </p>
                      </div>
                    </div>
                    {audit &&
                    (audit.candidates.length > 0 ||
                      audit.ambiguousRegions.length > 0) ? (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer underline underline-offset-2">
                          Ver evidencia
                        </summary>
                        {audit.candidates.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-gray-900">
                            {audit.candidates.map((candidate) => (
                              <li
                                key={`${candidate.eventTimeUtc}-${candidate.latitude}-${candidate.longitude}`}
                              >
                                {candidate.eventTimeUtc.slice(0, 10)} · M
                                {candidate.magnitude} · {candidate.place}
                                <span className="ml-1 font-mono text-gray-700">
                                  ({candidate.latitude.toFixed(2)},{" "}
                                  {candidate.longitude.toFixed(2)})
                                </span>
                                {(() => {
                                  const links = sourceLinksFor(
                                    candidate.sourceId,
                                    candidate.eventTimeUtc,
                                    candidate.magnitude,
                                  );
                                  if (links.length === 0) return null;
                                  return (
                                    <>
                                      {links.map((link) => (
                                        <span key={link.href}>
                                          {" "}
                                          <a
                                            href={link.href}
                                            rel="noreferrer"
                                            className="text-official underline underline-offset-2"
                                            title={
                                              link.precision === "catalog"
                                                ? "El catálogo no publica un enlace por evento"
                                                : undefined
                                            }
                                          >
                                            {link.label}
                                          </a>
                                        </span>
                                      ))}
                                    </>
                                  );
                                })()}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {audit.ambiguousRegions.length > 0 ? (
                          <p className="mt-2 text-gray-800">
                            Geografía ambigua:{" "}
                            {audit.ambiguousRegions.join("; ")}
                          </p>
                        ) : null}
                      </details>
                    ) : null}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}
