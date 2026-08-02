import type {
  BaselineEstimate,
  BaselineProbabilityBand,
  PredictionInterpretation,
  PredictionMatchOutcome,
  PredictionVerdict,
} from "@sismo/contracts";

export const MATCH_OUTCOME_LABELS: Record<PredictionMatchOutcome, string> = {
  PENDING: "Pendiente",
  STRICT_MATCH: "Coincidencia estricta",
  NO_MATCH: "Sin coincidencia",
  AMBIGUOUS_GEOGRAPHY: "Geografía ambigua",
  SOURCE_DISAGREEMENT: "Fuentes en desacuerdo",
};

export const BASELINE_BAND_LABELS: Record<BaselineProbabilityBand, string> = {
  VERY_HIGH: "Muy esperable sin predicción",
  HIGH: "Esperable sin predicción",
  MODERATE: "Posibilidad moderada sin predicción",
  LOW: "Poco esperable según el histórico",
  UNAVAILABLE: "Tasa base no disponible",
};

export function matchOutcomeForVerdict(
  verdict: PredictionVerdict,
): PredictionMatchOutcome {
  return verdict === "STRICT_HIT" ? "STRICT_MATCH" : verdict;
}

export function baselineProbabilityBand(
  probability: number | null,
): BaselineProbabilityBand {
  if (probability === null) return "UNAVAILABLE";
  if (probability >= 0.8) return "VERY_HIGH";
  if (probability >= 0.5) return "HIGH";
  if (probability >= 0.2) return "MODERATE";
  return "LOW";
}

export function interpretPredictionResult(
  verdict: PredictionVerdict,
  baseline: BaselineEstimate | null,
): PredictionInterpretation {
  const baselineProbability = baseline?.probabilityAtLeastOne ?? null;
  return {
    matchOutcome: matchOutcomeForVerdict(verdict),
    baselineProbability,
    baselineBand: baselineProbabilityBand(baselineProbability),
    predictiveEvidence: "NOT_ESTABLISHED",
  };
}
