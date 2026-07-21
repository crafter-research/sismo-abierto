import { neon } from "@neondatabase/serverless";
import type {
  ObservedChange,
  SourceCheck,
  SourceState,
  SourceStatus,
} from "@sismo/contracts";
import type { SourceHealthStore } from "./store.ts";

export const SOURCE_HEALTH_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS source_checks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL,
  http_status INTEGER,
  duration_ms INTEGER NOT NULL,
  content_type TEXT,
  schema_valid BOOLEAN,
  record_count INTEGER,
  status TEXT NOT NULL,
  evidence TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS source_checks_source_time
  ON source_checks (source_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS source_state (
  source_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  last_check_at TIMESTAMPTZ NOT NULL,
  last_check_id TEXT NOT NULL,
  consecutive_failures INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS observed_changes (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  opening_check_id TEXT NOT NULL,
  closing_check_id TEXT,
  reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS observed_changes_source_time
  ON observed_changes (source_id, opened_at DESC);
`;

type Row = Record<string, unknown>;

function rowToCheck(row: Row): SourceCheck {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    checkedAt: new Date(String(row.checked_at)).toISOString(),
    httpStatus: row.http_status === null ? null : Number(row.http_status),
    durationMs: Number(row.duration_ms),
    contentType: row.content_type === null ? null : String(row.content_type),
    schemaValid: row.schema_valid === null ? null : Boolean(row.schema_valid),
    recordCount: row.record_count === null ? null : Number(row.record_count),
    status: String(row.status) as SourceStatus,
    evidence: String(row.evidence),
  };
}

function rowToChange(row: Row): ObservedChange {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    fromStatus: String(row.from_status) as SourceStatus,
    toStatus: String(row.to_status) as SourceStatus,
    openedAt: new Date(String(row.opened_at)).toISOString(),
    closedAt:
      row.closed_at === null
        ? null
        : new Date(String(row.closed_at)).toISOString(),
    openingCheckId: String(row.opening_check_id),
    closingCheckId:
      row.closing_check_id === null ? null : String(row.closing_check_id),
    reason: String(row.reason),
  };
}

export class NeonSourceHealthStore implements SourceHealthStore {
  private sql: ReturnType<typeof neon>;
  private ready: Promise<void> | null = null;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  private async ensureSchema(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        for (const statement of SOURCE_HEALTH_SCHEMA_SQL.split(";")) {
          const trimmed = statement.trim();
          if (trimmed) await this.sql.query(trimmed);
        }
      })();
    }
    await this.ready;
  }

  async insertCheck(check: SourceCheck): Promise<void> {
    await this.ensureSchema();
    await this.sql.query(
      `INSERT INTO source_checks
        (id, source_id, checked_at, http_status, duration_ms, content_type, schema_valid, record_count, status, evidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        check.id,
        check.sourceId,
        check.checkedAt,
        check.httpStatus,
        check.durationMs,
        check.contentType,
        check.schemaValid,
        check.recordCount,
        check.status,
        check.evidence,
      ],
    );
  }

  async listChecks(sourceId: string, limit: number): Promise<SourceCheck[]> {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      "SELECT * FROM source_checks WHERE source_id = $1 ORDER BY checked_at DESC LIMIT $2",
      [sourceId, limit],
    )) as Row[];
    return rows.map(rowToCheck);
  }

  async getState(sourceId: string): Promise<SourceState | null> {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      "SELECT * FROM source_state WHERE source_id = $1",
      [sourceId],
    )) as Row[];
    const row = rows[0];
    if (!row) return null;
    return {
      sourceId: String(row.source_id),
      status: String(row.status) as SourceStatus,
      lastCheckAt: new Date(String(row.last_check_at)).toISOString(),
      lastCheckId: String(row.last_check_id),
      consecutiveFailures: Number(row.consecutive_failures),
    };
  }

  async setState(state: SourceState): Promise<void> {
    await this.ensureSchema();
    await this.sql.query(
      `INSERT INTO source_state (source_id, status, last_check_at, last_check_id, consecutive_failures)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (source_id) DO UPDATE SET
         status = EXCLUDED.status,
         last_check_at = EXCLUDED.last_check_at,
         last_check_id = EXCLUDED.last_check_id,
         consecutive_failures = EXCLUDED.consecutive_failures`,
      [
        state.sourceId,
        state.status,
        state.lastCheckAt,
        state.lastCheckId,
        state.consecutiveFailures,
      ],
    );
  }

  async listStates(): Promise<SourceState[]> {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      "SELECT * FROM source_state",
      [],
    )) as Row[];
    return rows.map((row) => ({
      sourceId: String(row.source_id),
      status: String(row.status) as SourceStatus,
      lastCheckAt: new Date(String(row.last_check_at)).toISOString(),
      lastCheckId: String(row.last_check_id),
      consecutiveFailures: Number(row.consecutive_failures),
    }));
  }

  async insertChange(change: ObservedChange): Promise<void> {
    await this.ensureSchema();
    await this.sql.query(
      `INSERT INTO observed_changes
        (id, source_id, from_status, to_status, opened_at, closed_at, opening_check_id, closing_check_id, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        change.id,
        change.sourceId,
        change.fromStatus,
        change.toStatus,
        change.openedAt,
        change.closedAt,
        change.openingCheckId,
        change.closingCheckId,
        change.reason,
      ],
    );
  }

  async getOpenChange(sourceId: string): Promise<ObservedChange | null> {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      "SELECT * FROM observed_changes WHERE source_id = $1 AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1",
      [sourceId],
    )) as Row[];
    return rows[0] ? rowToChange(rows[0]) : null;
  }

  async closeChange(
    changeId: string,
    closedAt: string,
    closingCheckId: string,
  ): Promise<void> {
    await this.ensureSchema();
    await this.sql.query(
      "UPDATE observed_changes SET closed_at = $2, closing_check_id = $3 WHERE id = $1",
      [changeId, closedAt, closingCheckId],
    );
  }

  async listChanges(
    sourceId: string,
    limit: number,
  ): Promise<ObservedChange[]> {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      "SELECT * FROM observed_changes WHERE source_id = $1 ORDER BY opened_at DESC LIMIT $2",
      [sourceId, limit],
    )) as Row[];
    return rows.map(rowToChange);
  }
}
