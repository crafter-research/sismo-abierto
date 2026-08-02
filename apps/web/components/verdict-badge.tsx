import { BASELINE_BAND_LABELS, MATCH_OUTCOME_LABELS } from "@sismo/audit";
import type {
  BaselineProbabilityBand,
  PredictionMatchOutcome,
} from "@sismo/contracts";

export const OUTCOME_STYLES: Record<PredictionMatchOutcome, string> = {
  PENDING: "bg-gray-100 text-gray-900",
  STRICT_MATCH: "bg-sem-blue-soft text-sem-blue",
  NO_MATCH: "bg-gray-100 text-gray-900",
  AMBIGUOUS_GEOGRAPHY: "bg-sem-amber-soft text-sem-amber",
  SOURCE_DISAGREEMENT: "bg-sem-purple-soft text-sem-purple",
};

const BASELINE_STYLES: Record<BaselineProbabilityBand, string> = {
  VERY_HIGH: "border-gray-300 bg-gray-100 text-gray-900",
  HIGH: "border-gray-300 bg-gray-100 text-gray-900",
  MODERATE: "border-sem-amber bg-sem-amber-soft text-sem-amber",
  LOW: "border-sem-purple bg-sem-purple-soft text-sem-purple",
  UNAVAILABLE: "border-gray-300 bg-background-200 text-gray-800",
};

export function OutcomeBadge({ outcome }: { outcome: PredictionMatchOutcome }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${OUTCOME_STYLES[outcome]}`}
    >
      {MATCH_OUTCOME_LABELS[outcome]}
    </span>
  );
}

export function BaselineBadge({ band }: { band: BaselineProbabilityBand }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-xs font-semibold ${BASELINE_STYLES[band]}`}
    >
      {BASELINE_BAND_LABELS[band]}
    </span>
  );
}
