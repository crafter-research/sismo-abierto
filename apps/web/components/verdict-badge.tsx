import type { PredictionVerdict } from "@sismo/contracts";

export const VERDICT_STYLES: Record<PredictionVerdict, string> = {
  PENDING: "bg-missing-soft text-missing",
  STRICT_HIT: "bg-official-soft text-official",
  NO_MATCH: "bg-gray-100 text-gray-700",
  AMBIGUOUS_GEOGRAPHY: "bg-explanation-soft text-explanation",
  SOURCE_DISAGREEMENT: "bg-explanation-soft text-explanation",
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
