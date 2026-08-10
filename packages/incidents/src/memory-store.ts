import type { IncidentRecord } from "@sismo/contracts";
import type {
  IncidentReviewStatus,
  IncidentStore,
  IncidentVersion,
  IncidentVersionKind,
} from "./types.ts";

export class MemoryIncidentStore implements IncidentStore {
  private incidents = new Map<string, IncidentRecord>();
  private versions = new Map<string, IncidentVersion>();

  async upsertIncident(incident: IncidentRecord): Promise<void> {
    this.incidents.set(incident.slug, incident);
  }

  async getIncident(slug: string): Promise<IncidentRecord | null> {
    return this.incidents.get(slug) ?? null;
  }

  async insertVersion(version: IncidentVersion): Promise<void> {
    const existing = this.versions.get(version.id);
    if (!existing || version.kind === "seismic") {
      this.versions.set(version.id, version);
    }
  }

  async getLatestVersion(
    incidentId: string,
    kind: IncidentVersionKind,
    statuses: IncidentReviewStatus[],
  ): Promise<IncidentVersion | null> {
    return (
      [...this.versions.values()]
        .filter(
          (version) =>
            version.incidentId === incidentId &&
            version.kind === kind &&
            statuses.includes(version.reviewStatus),
        )
        .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0] ?? null
    );
  }

  async listVersions(
    incidentId: string,
    statuses: IncidentReviewStatus[],
    limit: number,
  ): Promise<IncidentVersion[]> {
    return [...this.versions.values()]
      .filter(
        (version) =>
          version.incidentId === incidentId &&
          statuses.includes(version.reviewStatus),
      )
      .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
      .slice(0, limit);
  }

  async publishVersion(
    incidentId: string,
    versionId: string,
    publishedAt: string,
  ): Promise<IncidentVersion | null> {
    const version = this.versions.get(versionId);
    if (
      !version ||
      version.incidentId !== incidentId ||
      version.kind !== "humanitarian" ||
      version.reviewStatus !== "pending"
    ) {
      return null;
    }
    const published: IncidentVersion = {
      ...version,
      reviewStatus: "published",
      publishedAt,
    };
    this.versions.set(versionId, published);
    return published;
  }
}
