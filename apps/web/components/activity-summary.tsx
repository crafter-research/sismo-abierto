import type { Provenance } from "@sismo/contracts";
import type { EventActivitySummary, MonthlyActivity } from "@sismo/data";
import { ClassBadge, SourceBadge } from "./badges";

function monthLabel(month: string, format: "short" | "long" = "short") {
  const label = new Intl.DateTimeFormat("es-PE", {
    month: format,
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
  return `${label.charAt(0).toUpperCase()}${label.slice(1).replace(".", "")}`;
}

function peakLabel(entries: MonthlyActivity[]) {
  if (entries.length === 0) return "Sin datos";
  return entries.map((entry) => monthLabel(entry.month, "long")).join(" y ");
}

export function ActivitySummary({
  summary,
  scopeLabel,
  provenance,
}: {
  summary: EventActivitySummary;
  scopeLabel: string;
  provenance: Provenance;
}) {
  const maxMonthlyCount = Math.max(
    1,
    ...summary.monthly.map((entry) => entry.count),
  );
  const peakCount = summary.peakMonths[0]?.count ?? 0;

  return (
    <section
      aria-labelledby="activity-summary-title"
      className="border-gray-300 border-y py-5"
      data-testid="activity-summary"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="activity-summary-title"
            className="font-semibold text-lg tracking-tight"
          >
            Actividad en cifras
          </h2>
          <p className="mt-0.5 text-gray-900 text-sm">{scopeLabel}</p>
        </div>
        <ClassBadge value="derived" />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-y-5 lg:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))]">
        <div className="pr-5">
          <dt className="font-mono text-[11px] text-gray-800 uppercase tracking-wide">
            Eventos registrados
          </dt>
          <dd className="mt-1 font-semibold text-[52px] leading-none tracking-[-0.055em] sm:text-[60px]">
            {summary.total}
          </dd>
        </div>
        <div className="border-gray-200 border-l pl-5">
          <dt className="font-mono text-[11px] text-gray-800 uppercase tracking-wide">
            Magnitud 5 o más
          </dt>
          <dd className="mt-2 font-semibold text-2xl tracking-tight">
            {summary.magnitudeAtLeast5}
          </dd>
        </div>
        <div className="border-gray-200 lg:border-l lg:pl-5">
          <dt className="font-mono text-[11px] text-gray-800 uppercase tracking-wide">
            Mayor magnitud
          </dt>
          <dd className="mt-2 font-semibold text-2xl tracking-tight">
            {summary.maxMagnitude === null
              ? "Sin datos"
              : `M ${summary.maxMagnitude.toFixed(1)}`}
          </dd>
        </div>
        <div className="border-gray-200 border-l pl-5">
          <dt className="font-mono text-[11px] text-gray-800 uppercase tracking-wide">
            Mes más activo
          </dt>
          <dd className="mt-2 font-semibold text-2xl tracking-tight">
            {peakLabel(summary.peakMonths)}
          </dd>
          <p className="mt-0.5 font-mono text-gray-800 text-xs">
            {peakCount} eventos
          </p>
        </div>
      </dl>

      {summary.monthly.length > 0 ? (
        <div className="mt-7">
          <h3 className="font-mono text-[11px] text-gray-800 uppercase tracking-wide">
            Eventos por mes
          </h3>
          <div
            className="mt-3 grid h-40 items-end gap-2 border-gray-200 border-b px-1"
            style={{
              gridTemplateColumns: `repeat(${summary.monthly.length}, minmax(0, 1fr))`,
            }}
            role="img"
            aria-label={summary.monthly
              .map(
                (entry) =>
                  `${monthLabel(entry.month, "long")}: ${entry.count} eventos`,
              )
              .join(". ")}
          >
            {summary.monthly.map((entry) => (
              <div
                key={entry.month}
                className="flex h-full min-w-0 flex-col justify-end text-center"
              >
                <span className="mb-1 font-mono text-[11px] text-gray-900">
                  {entry.count}
                </span>
                <span className="flex h-28 items-end">
                  <span
                    className="mx-auto w-full max-w-14 bg-gray-1000"
                    style={{
                      height: `${Math.max(4, (entry.count / maxMonthlyCount) * 100)}%`,
                    }}
                  />
                </span>
                <span className="mt-1.5 truncate font-mono text-[10px] text-gray-800 uppercase">
                  {monthLabel(entry.month)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <SourceBadge provenance={provenance} />
      </div>
    </section>
  );
}
