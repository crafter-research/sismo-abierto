import { neon } from "@neondatabase/serverless";
import type { TerrainDimension } from "./dimensions.ts";
import type { TerrainFeature } from "./ingest.ts";

/**
 * Migración canónica. Se aplica con el flujo de migraciones por branch de Neon
 * antes de habilitar la ingesta en producción, igual que `packages/incidents`.
 */
export const TERRAIN_SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS terrain_features (
  id TEXT PRIMARY KEY,
  dimension TEXT NOT NULL,
  layer TEXT NOT NULL,
  city TEXT NOT NULL,
  properties JSONB NOT NULL,
  geometry JSONB,
  source_id TEXT NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL
);
-- CREATE TABLE IF NOT EXISTS no agrega columnas a una tabla ya existente, y
-- terrain_features ya existe en producción: la columna necesita su propio ADD.
ALTER TABLE terrain_features ADD COLUMN IF NOT EXISTS geom geometry;
CREATE INDEX IF NOT EXISTS terrain_features_dimension_city
  ON terrain_features (dimension, city);
CREATE INDEX IF NOT EXISTS terrain_geom_gix
  ON terrain_features USING GIST (geom);

CREATE TABLE IF NOT EXISTS terrain_ingest_runs (
  id TEXT PRIMARY KEY,
  dimension TEXT NOT NULL,
  source_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  layers_expected INTEGER NOT NULL,
  layers_ingested INTEGER NOT NULL DEFAULT 0,
  feature_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  note TEXT
);
CREATE INDEX IF NOT EXISTS terrain_ingest_runs_dimension_time
  ON terrain_ingest_runs (dimension, started_at DESC);
`;

export interface TerrainIngestRun {
  id: string;
  dimension: TerrainDimension;
  sourceId: string;
  startedAt: string;
  layersExpected: number;
}

export class NeonTerrainStore {
  private sql: ReturnType<typeof neon>;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  async migrate(): Promise<void> {
    for (const statement of TERRAIN_SCHEMA_SQL.split(";")) {
      const trimmed = statement.trim();
      if (trimmed) await this.sql.query(trimmed);
    }
  }

  async startRun(run: TerrainIngestRun): Promise<void> {
    await this.sql.query(
      `INSERT INTO terrain_ingest_runs
         (id, dimension, source_id, started_at, layers_expected, status)
       VALUES ($1, $2, $3, $4, $5, 'running')`,
      [run.id, run.dimension, run.sourceId, run.startedAt, run.layersExpected],
    );
  }

  /**
   * Reemplaza la capa entera dentro de una transacción: el borrado y la
   * inserción viajan juntos, así una corrida interrumpida no deja la ciudad
   * vacía en la base.
   *
   * `geom` se puebla en el mismo INSERT desde `geometry` (GeoJSON) en vez de en
   * un paso aparte: el dato nace correcto y no hay ventana donde una fila tenga
   * `geometry` sin su `geom` equivalente.
   */
  async replaceLayer(
    layer: string,
    features: TerrainFeature[],
    sourceId: string,
    ingestedAt: string,
  ): Promise<void> {
    const statements = [
      this.sql.query(`DELETE FROM terrain_features WHERE layer = $1`, [layer]),
      ...features.map((feature, index) =>
        this.sql.query(
          `INSERT INTO terrain_features
             (id, dimension, layer, city, properties, geometry, geom, source_id, ingested_at)
           VALUES ($1, $2, $3, $4, $5, $6,
             CASE WHEN $6::jsonb IS NULL THEN NULL
                  ELSE ST_SetSRID(ST_GeomFromGeoJSON($6::text), 4326) END,
             $7, $8)`,
          [
            `${layer}#${index}`,
            feature.dimension,
            feature.layer,
            feature.city,
            JSON.stringify(feature.properties),
            feature.geometry === null ? null : JSON.stringify(feature.geometry),
            sourceId,
            ingestedAt,
          ],
        ),
      ),
    ];
    await this.sql.transaction(statements);
  }

  async finishRun(
    runId: string,
    summary: {
      finishedAt: string;
      layersIngested: number;
      featureCount: number;
      status: "ok" | "failed";
      note?: string;
    },
  ): Promise<void> {
    await this.sql.query(
      `UPDATE terrain_ingest_runs
          SET finished_at = $2, layers_ingested = $3, feature_count = $4,
              status = $5, note = $6
        WHERE id = $1`,
      [
        runId,
        summary.finishedAt,
        summary.layersIngested,
        summary.featureCount,
        summary.status,
        summary.note ?? null,
      ],
    );
  }
}
