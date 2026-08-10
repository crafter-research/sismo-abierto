import type {
  IncidentRecord,
  IncidentSource,
  NormalizedEvent,
} from "@sismo/contracts";

export type IncidentVersionKind = "seismic" | "humanitarian";
export type IncidentReviewStatus =
  | "automatic"
  | "pending"
  | "published"
  | "rejected";

export interface IncidentVersion {
  id: string;
  incidentId: string;
  kind: IncidentVersionKind;
  versionLabel: string;
  reviewStatus: IncidentReviewStatus;
  observedAt: string;
  publishedAt: string | null;
  source: IncidentSource;
  payload: unknown;
  createdAt: string;
}

export interface SeismicVersionPayload {
  event: NormalizedEvent;
  syncedAt: string;
}

export interface HumanitarianVersionPayload {
  facts: Array<{
    key: string;
    value: number;
    displayValue: string;
    label: string;
  }>;
}

export interface IncidentStore {
  upsertIncident(incident: IncidentRecord): Promise<void>;
  getIncident(slug: string): Promise<IncidentRecord | null>;
  insertVersion(version: IncidentVersion): Promise<void>;
  getLatestVersion(
    incidentId: string,
    kind: IncidentVersionKind,
    statuses: IncidentReviewStatus[],
  ): Promise<IncidentVersion | null>;
  listVersions(
    incidentId: string,
    statuses: IncidentReviewStatus[],
    limit: number,
  ): Promise<IncidentVersion[]>;
  publishVersion(
    incidentId: string,
    versionId: string,
    publishedAt: string,
  ): Promise<IncidentVersion | null>;
}
