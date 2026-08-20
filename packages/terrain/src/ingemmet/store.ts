import { neon } from "@neondatabase/serverless";
import type { IngemmetFeature } from "./ingest.ts";
import { INGEMMET_ATTRIBUTION } from "./source.ts";

/**
 * Tabla propia, separada de `terrain_features`.
 *
 * Las capas del IGP son microzonificación urbana por ciudad; las de INGEMMET son
 * cobertura nacional continua sin concepto de ciudad. Meterlas en la misma tabla
 * obligaría a inventar un `city` que no existe.
 *
 * `fetched_at` y `attribution` no son decorado: son las dos condiciones del
 * permiso de reuso (trazabilidad con fecha de consulta, y atribución visible).
 * Viajan con la fila para que ningún consumidor pueda publicar el dato sin ellas.
 */
export const INGEMMET_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS ingemmet_features (
  id TEXT PRIMARY KEY,
  layer_id TEXT NOT NULL,
  object_id INTEGER NOT NULL,
  properties JSONB NOT NULL,
  geometry JSONB,
  attribution TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS ingemmet_features_layer ON ingemmet_features (layer_id);

CREATE TABLE IF NOT EXISTS ingemmet_ingest_runs (
  id TEXT PRIMARY KEY,
  layer_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  declared_count INTEGER NOT NULL DEFAULT 0,
  feature_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  note TEXT
);
`;

/**
 * Techo por INSERT, con margen contra el límite duro de 64MB de Neon: al JSON de
 * la geometría se le suman propiedades, nombres de columna y placeholders.
 */
const INSERT_MAX_BYTES = 20 * 1024 * 1024;

export class IngemmetStore {
  private sql: ReturnType<typeof neon>;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  async migrate(): Promise<void> {
    for (const statement of INGEMMET_SCHEMA_SQL.split(";")) {
      const trimmed = statement.trim();
      if (trimmed) await this.sql.query(trimmed);
    }
  }

  async startRun(run: {
    id: string;
    layerId: string;
    startedAt: string;
  }): Promise<void> {
    await this.sql.query(
      `INSERT INTO ingemmet_ingest_runs (id, layer_id, started_at, status)
       VALUES ($1, $2, $3, 'running')`,
      [run.id, run.layerId, run.startedAt],
    );
  }

  /**
   * OBJECTID ya guardados de una capa.
   *
   * Permite reanudar: una corrida de 62k features tarda ~40 min y un corte de
   * red del lado de Neon perdía todo el avance. Con esto se piden solo los que
   * faltan.
   */
  async existingObjectIds(layerId: string): Promise<Set<number>> {
    const rows = (await this.sql.query(
      `SELECT object_id FROM ingemmet_features WHERE layer_id = $1`,
      [layerId],
    )) as unknown as { object_id: number }[];
    return new Set(rows.map((row) => Number(row.object_id)));
  }

  /** Vacía la capa antes de reescribirla. Se llama una vez por corrida. */
  async clearLayer(layerId: string): Promise<void> {
    await this.sql.query(`DELETE FROM ingemmet_features WHERE layer_id = $1`, [
      layerId,
    ]);
  }

  /**
   * Inserta un lote con un solo INSERT multi-fila.
   *
   * `terrain_features` usa una statement por feature dentro de una transacción,
   * que a 113k features son 113k statements. Acá el lote entra en una sola.
   */
  async insertBatch(
    features: IngemmetFeature[],
    fetchedAt: string,
  ): Promise<void> {
    if (features.length === 0) return;
    // Neon rechaza un request de más de 64MB (HTTP 413). Los polígonos de
    // geomorfología con muchos vértices llegan ahí con pocos cientos de filas,
    // así que el corte va por bytes de geometría, no por cantidad.
    if (features.length > 1) {
      const bytes = features.reduce(
        (sum, feature) => sum + JSON.stringify(feature.geometry ?? null).length,
        0,
      );
      if (bytes > INSERT_MAX_BYTES) {
        const mid = Math.ceil(features.length / 2);
        await this.insertBatch(features.slice(0, mid), fetchedAt);
        await this.insertBatch(features.slice(mid), fetchedAt);
        return;
      }
    }
    const values: unknown[] = [];
    const rows = features.map((feature, index) => {
      const base = index * 6;
      values.push(
        `${feature.layerId}#${feature.objectId}`,
        feature.layerId,
        feature.objectId,
        JSON.stringify(feature.properties),
        feature.geometry === null ? null : JSON.stringify(feature.geometry),
        fetchedAt,
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, '${INGEMMET_ATTRIBUTION.replace(/'/g, "''")}', $${base + 6})`;
    });
    await this.sql.query(
      `INSERT INTO ingemmet_features
         (id, layer_id, object_id, properties, geometry, attribution, fetched_at)
       VALUES ${rows.join(", ")}
       ON CONFLICT (id) DO NOTHING`,
      values,
    );
  }

  async finishRun(
    runId: string,
    summary: {
      finishedAt: string;
      declaredCount: number;
      featureCount: number;
      status: "ok" | "failed";
      note?: string;
    },
  ): Promise<void> {
    await this.sql.query(
      `UPDATE ingemmet_ingest_runs
          SET finished_at = $2, declared_count = $3, feature_count = $4,
              status = $5, note = $6
        WHERE id = $1`,
      [
        runId,
        summary.finishedAt,
        summary.declaredCount,
        summary.featureCount,
        summary.status,
        summary.note ?? null,
      ],
    );
  }
}
