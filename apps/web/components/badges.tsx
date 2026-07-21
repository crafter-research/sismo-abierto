import type { Provenance, ValueClass } from "@sismo/contracts";
import { formatFetchedAt } from "../lib/format";

const CLASS_STYLES: Record<ValueClass, { label: string; className: string }> = {
  official: { label: "OFICIAL", className: "bg-official-soft text-official" },
  derived: { label: "DERIVADO", className: "bg-derived-soft text-derived" },
  explanation: {
    label: "EXPLICACIÓN",
    className: "bg-explanation-soft text-explanation",
  },
  unavailable: {
    label: "NO DISPONIBLE",
    className: "bg-missing-soft text-missing",
  },
};

export function ClassBadge({ value }: { value: ValueClass }) {
  const style = CLASS_STYLES[value];
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${style.className}`}
    >
      {style.label}
    </span>
  );
}

const FRESHNESS_LABELS: Record<Provenance["freshness"], string> = {
  FRESH: "Actualizado por la fuente",
  STALE: "Fuente detenida o histórica",
  FRESHNESS_UNKNOWN: "La fuente no publica fecha de actualización",
};

export function SourceBadge({ provenance }: { provenance: Provenance }) {
  return (
    <div className="text-xs text-gray-900" data-testid="source-badge">
      <p>
        Fuente:{" "}
        <a
          href={provenance.source.url}
          className="text-official underline"
          rel="noreferrer"
        >
          {provenance.source.name}
        </a>
      </p>
      <p>
        Consultado:{" "}
        <span className="font-mono">
          {formatFetchedAt(provenance.fetchedAt)}
        </span>
        {" · "}
        {FRESHNESS_LABELS[provenance.freshness]}
      </p>
      {provenance.note ? (
        <p className="mt-0.5 text-gray-800">{provenance.note}</p>
      ) : null}
    </div>
  );
}
