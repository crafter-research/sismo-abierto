import { neon } from "@neondatabase/serverless";
import type { IncidentRecord } from "@sismo/contracts";
import type {
  IncidentReviewStatus,
  IncidentStore,
  IncidentVersion,
  IncidentVersionKind,
} from "./types.ts";

export const INCIDENT_SCHEMA_SQL = `
CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  country_slug TEXT NOT NULL,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT incidents_status_check CHECK (status IN ('active', 'monitoring', 'closed'))
);

CREATE TABLE incident_versions (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  version_label TEXT NOT NULL,
  review_status TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  source JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT incident_versions_kind_check CHECK (kind IN ('seismic', 'humanitarian')),
  CONSTRAINT incident_versions_review_check CHECK (review_status IN ('automatic', 'pending', 'published', 'rejected'))
);

CREATE INDEX incident_versions_public_latest
  ON incident_versions (incident_id, kind, observed_at DESC)
  WHERE review_status IN ('automatic', 'published');

CREATE INDEX incident_versions_review_queue
  ON incident_versions (incident_id, created_at DESC)
  WHERE review_status = 'pending';
`;

type Row = Record<string, unknown>;

function jsonValue(value: unknown): unknown {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function rowToIncident(row: Row): IncidentRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    country: String(row.country),
    countrySlug: String(row.country_slug),
    eventId: String(row.event_id),
    title: String(row.title),
    location: String(row.location),
    startedAt: new Date(String(row.started_at)).toISOString(),
    status: String(row.status) as IncidentRecord["status"],
  };
}

function rowToVersion(row: Row): IncidentVersion {
  return {
    id: String(row.id),
    incidentId: String(row.incident_id),
    kind: String(row.kind) as IncidentVersionKind,
    versionLabel: String(row.version_label),
    reviewStatus: String(row.review_status) as IncidentReviewStatus,
    observedAt: new Date(String(row.observed_at)).toISOString(),
    publishedAt:
      row.published_at === null
        ? null
        : new Date(String(row.published_at)).toISOString(),
    source: jsonValue(row.source) as IncidentVersion["source"],
    payload: jsonValue(row.payload),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export class NeonIncidentStore implements IncidentStore {
  private sql: ReturnType<typeof neon>;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  async upsertIncident(incident: IncidentRecord): Promise<void> {
    await this.sql.query(
      `INSERT INTO incidents
        (id, slug, country, country_slug, event_id, title, location, started_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug,
         country = EXCLUDED.country,
         country_slug = EXCLUDED.country_slug,
         event_id = EXCLUDED.event_id,
         title = EXCLUDED.title,
         location = EXCLUDED.location,
         started_at = EXCLUDED.started_at,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [
        incident.id,
        incident.slug,
        incident.country,
        incident.countrySlug,
        incident.eventId,
        incident.title,
        incident.location,
        incident.startedAt,
        incident.status,
      ],
    );
  }

  async getIncident(slug: string): Promise<IncidentRecord | null> {
    const rows = (await this.sql.query(
      "SELECT * FROM incidents WHERE slug = $1 LIMIT 1",
      [slug],
    )) as Row[];
    return rows[0] ? rowToIncident(rows[0]) : null;
  }

  async insertVersion(version: IncidentVersion): Promise<void> {
    await this.sql.query(
      `INSERT INTO incident_versions
        (id, incident_id, kind, version_label, review_status, observed_at, published_at, source, payload, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         payload = EXCLUDED.payload,
         published_at = EXCLUDED.published_at
       WHERE incident_versions.kind = 'seismic'`,
      [
        version.id,
        version.incidentId,
        version.kind,
        version.versionLabel,
        version.reviewStatus,
        version.observedAt,
        version.publishedAt,
        JSON.stringify(version.source),
        JSON.stringify(version.payload),
        version.createdAt,
      ],
    );
  }

  async getLatestVersion(
    incidentId: string,
    kind: IncidentVersionKind,
    statuses: IncidentReviewStatus[],
  ): Promise<IncidentVersion | null> {
    const rows = (await this.sql.query(
      `SELECT * FROM incident_versions
       WHERE incident_id = $1 AND kind = $2 AND review_status = ANY($3::text[])
       ORDER BY observed_at DESC LIMIT 1`,
      [incidentId, kind, statuses],
    )) as Row[];
    return rows[0] ? rowToVersion(rows[0]) : null;
  }

  async listVersions(
    incidentId: string,
    statuses: IncidentReviewStatus[],
    limit: number,
  ): Promise<IncidentVersion[]> {
    const rows = (await this.sql.query(
      `SELECT * FROM incident_versions
       WHERE incident_id = $1 AND review_status = ANY($2::text[])
       ORDER BY observed_at DESC LIMIT $3`,
      [incidentId, statuses, limit],
    )) as Row[];
    return rows.map(rowToVersion);
  }

  async publishVersion(
    incidentId: string,
    versionId: string,
    publishedAt: string,
  ): Promise<IncidentVersion | null> {
    const rows = (await this.sql.query(
      `UPDATE incident_versions SET review_status = 'published', published_at = $3
       WHERE id = $1 AND incident_id = $2 AND kind = 'humanitarian' AND review_status = 'pending'
       RETURNING *`,
      [versionId, incidentId, publishedAt],
    )) as Row[];
    return rows[0] ? rowToVersion(rows[0]) : null;
  }
}
