import type { PredictionVerdict } from "@sismo/contracts";

export const VERDICT_STYLES: Record<PredictionVerdict, string> = {
  PENDING: "bg-sem-blue-soft text-sem-blue",
  STRICT_HIT: "bg-sem-green-soft text-sem-green",
  NO_MATCH: "bg-gray-100 text-gray-900",
  AMBIGUOUS_GEOGRAPHY: "bg-sem-amber-soft text-sem-amber",
  SOURCE_DISAGREEMENT: "bg-sem-purple-soft text-sem-purple",
};

export function VerdictBadge({ verdict }: { verdict: PredictionVerdict }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 font-mono text-xs ${VERDICT_STYLES[verdict]}`}
    >
      {verdict}
    </span>
  );
}
