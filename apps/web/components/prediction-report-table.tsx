import { BASELINE_BAND_LABELS } from "@sismo/audit";
import type {
  FrozenPrediction,
  PredictionAudit,
  PredictionMatchOutcome,
} from "@sismo/contracts";
import Link from "next/link";
import { OutcomeLabel } from "./verdict-badge";

export interface PredictionReportRow {
  prediction: FrozenPrediction;
  audit: PredictionAudit | null;
  outcome: PredictionMatchOutcome | null;
  statusLabel?: string;
  pointLabel: string;
  claimedProbability?: number;
  href?: string;
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
          <col className="w-[17%]" />
          <col className="w-[10%]" />
          <col className="w-[30%]" />
          <col className="w-[13%]" />
          <col className="w-[30%]" />
        </colgroup>
        <thead>
          <tr className="border-gray-300 border-b text-left text-xs text-gray-900">
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Punto y origen
            </th>
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Magnitud
            </th>
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Destinos
            </th>
            <th scope="col" className="pb-2 pr-5 font-semibold">
              Deadline Lima
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
                    <p className="leading-5">{visible.join(" · ")}</p>
                    {hidden.length > 0 ? (
                      <details className="mt-1.5 text-xs">
                        <summary className="w-fit cursor-pointer rounded border border-gray-300 bg-background-100 px-2 py-1 text-gray-900 hover:border-gray-600">
                          +{hidden.length} destinos
                        </summary>
                        <ul className="mt-2 space-y-1 border-gray-300 border-l pl-3 text-gray-900">
                          {hidden.map((target) => (
                            <li key={target}>{target}</li>
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
                  <td className="py-3.5 align-top">
                    <div className="grid grid-cols-[minmax(8.5rem,0.9fr)_minmax(8rem,1.15fr)] items-center gap-4">
                      <div>
                        {outcome ? (
                          <OutcomeLabel outcome={outcome} />
                        ) : (
                          <span className="inline-flex rounded bg-gray-200 px-2 py-1 font-semibold text-xs text-gray-900">
                            {statusLabel ?? "Sin auditoría"}
                          </span>
                        )}
                        <p className="mt-1 font-mono text-2xl font-bold tabular-nums leading-none">
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
