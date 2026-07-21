export type SourceStatus =
  | "OPERATIONAL"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "SCHEMA_CHANGED"
  | "FRESHNESS_UNKNOWN";

export interface SourceCheck {
  id: string;
  sourceId: string;
  checkedAt: string;
  httpStatus: number | null;
  durationMs: number;
  contentType: string | null;
  schemaValid: boolean | null;
  recordCount: number | null;
  status: SourceStatus;
  evidence: string;
}

export interface SourceState {
  sourceId: string;
  status: SourceStatus;
  lastCheckAt: string;
  lastCheckId: string;
  consecutiveFailures: number;
}

export interface ObservedChange {
  id: string;
  sourceId: string;
  fromStatus: SourceStatus;
  toStatus: SourceStatus;
  openedAt: string;
  closedAt: string | null;
  openingCheckId: string;
  closingCheckId: string | null;
  reason: string;
}
