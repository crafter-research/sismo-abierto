export type PredictionVerdict =
  | "PENDING"
  | "STRICT_HIT"
  | "NO_MATCH"
  | "AMBIGUOUS_GEOGRAPHY"
  | "SOURCE_DISAGREEMENT";

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

export interface CandidateEvent {
  sourceId: string;
  eventTimeUtc: string;
  magnitude: number;
  latitude: number;
  longitude: number;
  place: string;
  matchedRegion: string;
  regionIsAmbiguous: boolean;
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
