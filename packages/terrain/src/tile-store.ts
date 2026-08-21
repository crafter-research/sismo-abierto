import { neon } from "@neondatabase/serverless";
import type { GeomorphCategory } from "./geomorphology.ts";
import {
  TILE_EXTENT,
  TILE_LAYER_ID,
  TILE_SOURCE_LAYER,
} from "./tile-config.ts";

/**
 * Lee un vector tile MVT de geomorfología directo de PostGIS.
 *
 * `ST_AsMVTGeom` recorta y reproyecta a coordenadas de tile (0..4096) dentro
 * del bounding box del tile (`ST_TileEnvelope`); `ST_Simplify` corre antes,
 * en metros sobre 3857, para no cargar vértices que la simplificación
 * después va a descartar igual. Solo geomorfología: la capa de fallas
 * geológicas no forma parte de este pedido.
 *
 * La categoría legible (`subunidad_cat`) se calcula en TypeScript
 * (`categorizeGeomorph`, única fuente de verdad para el criterio de
 * agrupación) y se pasa a la query ya resuelta como un `jsonb` de
 * SUBUNIDAD→categoría, para no duplicar la lógica de regex en SQL.
 */
export class TerrainTileStore {
  private sql: ReturnType<typeof neon>;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  async mvt(
    z: number,
    x: number,
    y: number,
    toleranceMeters: number,
    categoryBySubunidad: Record<string, GeomorphCategory>,
  ): Promise<Buffer | null> {
    const rows = (await this.sql.query(
      `
      WITH bounds AS (
        SELECT ST_TileEnvelope($1, $2, $3) AS geom
      ),
      mvtgeom AS (
        SELECT
          ST_AsMVTGeom(
            ST_Simplify(ST_Transform(f.geom, 3857), $4),
            bounds.geom
          ) AS geom,
          COALESCE(
            $8::jsonb ->> (f.properties->>'SUBUNIDAD'),
            'otro'
          ) AS subunidad_cat
        FROM ingemmet_features f, bounds
        WHERE f.layer_id = $5
          AND ST_Intersects(ST_Transform(f.geom, 3857), bounds.geom)
      )
      SELECT ST_AsMVT(mvtgeom.*, $6, $7) AS mvt
      FROM mvtgeom
      WHERE geom IS NOT NULL
      `,
      [
        z,
        x,
        y,
        toleranceMeters,
        TILE_LAYER_ID,
        TILE_SOURCE_LAYER,
        TILE_EXTENT,
        JSON.stringify(categoryBySubunidad),
      ],
    )) as unknown as { mvt: Buffer }[];
    const mvt = rows[0]?.mvt;
    if (!mvt || mvt.length === 0) return null;
    return mvt;
  }

  /** Lista de SUBUNIDAD distintas en la capa, para construir el lookup de categorías una sola vez por corrida. */
  async distinctSubunidades(): Promise<string[]> {
    const rows = (await this.sql.query(
      `SELECT DISTINCT properties->>'SUBUNIDAD' AS subunidad
       FROM ingemmet_features
       WHERE layer_id = $1 AND properties->>'SUBUNIDAD' IS NOT NULL`,
      [TILE_LAYER_ID],
    )) as unknown as { subunidad: string }[];
    return rows.map((row) => row.subunidad);
  }
}

// --- Aritmética de tiles XYZ (Web Mercator), sin dependencias externas. ---

export function lonToTileX(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

export function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z,
  );
}

/** Rango [xMin, xMax, yMin, yMax] de tiles que cubren un bbox en un zoom dado. */
export function tileRangeForBbox(
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number },
  z: number,
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  return {
    xMin: lonToTileX(bbox.minLon, z),
    xMax: lonToTileX(bbox.maxLon, z),
    yMin: latToTileY(bbox.maxLat, z), // lat máxima = y mínimo (Web Mercator invierte el eje)
    yMax: latToTileY(bbox.minLat, z),
  };
}
