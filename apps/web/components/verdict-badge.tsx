import type { PredictionVerdict } from "@sismo/contracts";

export const VERDICT_STYLES: Record<PredictionVerdict, string> = {
  PENDING: "bg-[#f0f7ff] text-[#0059ec] dark:bg-[#0e1f38] dark:text-[#48aeff]",
  STRICT_HIT:
    "bg-[#ecfdec] text-[#107d32] dark:bg-[#0f2e17] dark:text-[#4ce15e]",
  NO_MATCH: "bg-gray-100 text-gray-900",
  AMBIGUOUS_GEOGRAPHY:
    "bg-[#fff6de] text-[#aa4d00] dark:bg-[#332100] dark:text-[#ffc543]",
  SOURCE_DISAGREEMENT:
    "bg-[#faf0ff] text-[#7d00cc] dark:bg-[#26103a] dark:text-[#c979ff]",
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
