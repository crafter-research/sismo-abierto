export type PredictionVerdict =
  | "PENDING"
  | "STRICT_HIT"
  | "NO_MATCH"
  | "AMBIGUOUS_GEOGRAPHY"
  | "SOURCE_DISAGREEMENT";

export type PredictionMatchOutcome =
  | "PENDING"
  | "STRICT_MATCH"
  | "NO_MATCH"
  | "AMBIGUOUS_GEOGRAPHY"
  | "SOURCE_DISAGREEMENT";

export type BaselineProbabilityBand =
  | "VERY_HIGH"
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "UNAVAILABLE";

export type PredictiveEvidence = "NOT_ESTABLISHED";

export interface PredictionInterpretation {
  matchOutcome: PredictionMatchOutcome;
  baselineProbability: number | null;
  baselineBand: BaselineProbabilityBand;
  predictiveEvidence: PredictiveEvidence;
}

export interface FrozenPrediction {
  predictionId: string;
  origin: string;
  originMagnitude: number;
  targetRegions: string[];
  predictedMagnitudeMin: number;
  predictedMagnitudeMax: number;
  maxDays: number;
  startDate: string;
  deadlineEndLima: string;
}

export interface PanoramaPoint extends FrozenPrediction {
  pointNumber: number;
  sourceText: string;
}

export interface PanoramaReport {
  slug: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  registrationMode: "PROSPECTIVE" | "RETROSPECTIVE";
  sourceUrl: string;
  sourcePublishedAtLima: string;
  sourceEvidence: string;
  backfilledAt: string;
  points: PanoramaPoint[];
}

export interface ClaimedValidationSource {
  sourceId: string;
  sourceName: string;
  magnitude: number;
  depthKm: number;
  url: string;
}

export interface ClaimedValidation {
  predictionId: string;
  sourceAccount: string;
  claimText: string;
  sourcePublishedAtLima: string;
  sourceEvidence: string;
  eventTimeUtc: string;
  eventPlace: string;
  latitude: number;
  longitude: number;
  claimedMagnitude: number | null;
  claimedMagnitudeScale: string | null;
  sources: ClaimedValidationSource[];
  assessment:
    | "OUTSIDE_FROZEN_MAGNITUDE"
    | "OUTSIDE_FROZEN_GEOGRAPHY"
    | "UNVERIFIABLE_IN_OFFICIAL_SOURCES"
    | "SOURCE_DISAGREEMENT_ON_MAGNITUDE"
    | "MATCHES_FROZEN_CLAIM";
}

export interface HistoricalReportPoint {
  pointNumber: number;
  claimedProbability: number;
  sourceText: string;
  targetRegions: string[];
}

export interface HistoricalReport {
  reportNumber: number;
  sourceAccount: string;
  sourceEvidence: string;
  sourcePostDate: string | null;
  backfilledAt: string;
  origin: string;
  originMagnitude: number;
  startDate: string;
  maxDays: number;
  deadlineEndLima: string;
  deadlineSourceText: string;
  predictedMagnitudeMin: number;
  predictedMagnitudeMax: number;
  points: HistoricalReportPoint[];
}

export interface HistoricalPointAudit {
  point: HistoricalReportPoint;
  prediction: FrozenPrediction;
  audit: PredictionAudit;
}

export interface HistoricalReportAudit {
  report: HistoricalReport;
  points: HistoricalPointAudit[];
}

export interface HistoricalReportAuditResults {
  runAt: string;
  reports: HistoricalReportAudit[];
}

export interface CandidateEvent {
  sourceId: string;
  eventTimeUtc: string;
  magnitude: number;
  latitude: number;
  longitude: number;
  place: string;
  matchedRegion: string;
  regionIsAmbiguous: boolean;
  // El evaluador ya guardaba estos tres campos en los artefactos; el contrato
  // no los declaraba, así que quien leyera un candidato veía menos de lo que
  // el archivo contiene.
  match: "inside" | "boundary";
  sourceDisagreement: boolean;
  disagreementDetail: string | null;
}

export interface BaselineEstimate {
  lookbackDays: number;
  matchingEventCount: number;
  eventsPerDay: number;
  probabilityAtLeastOne: number;
  windowDays: number;
}

export interface PredictionAudit {
  predictionId: string;
  verdict: PredictionVerdict;
  interpretation: PredictionInterpretation;
  evaluatedAt: string | null;
  windowStartLima: string;
  windowEndLima: string;
  candidates: CandidateEvent[];
  ambiguousRegions: string[];
  unambiguousRegions: string[];
  baseline: BaselineEstimate | null;
  evidence: EvidenceEntry[];
}

export interface EvidenceEntry {
  at: string;
  action: string;
  url: string | null;
  detail: string;
}
