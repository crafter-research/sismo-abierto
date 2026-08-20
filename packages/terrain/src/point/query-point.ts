import { type NeonQueryFunction, neon } from "@neondatabase/serverless";

export interface IgpPointMatch {
  dimension: string;
  city: string;
  properties: Record<string, unknown>;
  studyYear: string | null;
}

export interface IngemmetPointMatch {
  layer: string;
  properties: Record<string, unknown>;
  attribution: string;
  fetchedAt: string;
}

export type StudyLevel = "microzonificacion" | "nacional" | "ninguno";

export interface PointTerrain {
  igp: IgpPointMatch[];
  ingemmet: IngemmetPointMatch[];
  /** Nivel de estudio disponible en ese punto. Es el corazón del diseño. */
  studyLevel: StudyLevel;
  /** Ciudades del IGP cuyos polígonos contienen el punto (puede ser >1). */
  cities: string[];
}

/** Texto en español para que la UI no invente copy sobre lo que significa cada nivel. */
export function studyLevelLabel(level: StudyLevel): string {
  switch (level) {
    case "microzonificacion":
      return "Estudio de microzonificación urbana del IGP";
    case "nacional":
      return "Cobertura geomorfológica nacional de INGEMMET";
    case "ninguno":
      return "Sin estudio publicado en este punto";
  }
}

type NeonSql = NeonQueryFunction<false, false>;

interface IgpRow {
  dimension: string;
  city: string;
  properties: Record<string, unknown>;
}

interface IngemmetRow {
  layer_id: string;
  properties: Record<string, unknown>;
  attribution: string;
  fetched_at: string;
}

function toIgpMatch(row: IgpRow): IgpPointMatch {
  // `fecha` viaja dentro del JSONB de `properties` y Postgres lo entrega tal
  // cual lo ingirió el WFS: string en algunas capas, number en otras (medido
  // contra la base real, ej. Geologia:geologia_piura trae `fecha: 2018`).
  const fecha = row.properties.fecha;
  const studyYear =
    typeof fecha === "string" || typeof fecha === "number"
      ? String(fecha)
      : null;
  return {
    dimension: row.dimension,
    city: row.city,
    properties: row.properties,
    studyYear,
  };
}

function toIngemmetMatch(row: IngemmetRow): IngemmetPointMatch {
  return {
    layer: row.layer_id,
    properties: row.properties,
    attribution: row.attribution,
    fetchedAt: row.fetched_at,
  };
}

function studyLevelOf(
  igp: IgpPointMatch[],
  ingemmet: IngemmetPointMatch[],
): StudyLevel {
  if (igp.length > 0) return "microzonificacion";
  if (ingemmet.length > 0) return "nacional";
  return "ninguno";
}

function citiesOf(igp: IgpPointMatch[]): string[] {
  return [...new Set(igp.map((match) => match.city))];
}

/**
 * Terreno en un punto: cruza `terrain_features` (IGP) e `ingemmet_features`
 * (INGEMMET) por `ST_Contains(geom, punto)`, cada tabla en su propia consulta
 * para no forzar un shape de columnas común entre dos esquemas distintos.
 * Ambas corren en paralelo — medido ~350ms el par, así que serializar
 * duplicaría la latencia sin motivo.
 */
export async function queryPoint(
  lon: number,
  lat: number,
  sql: NeonSql = neon(process.env.DATABASE_URL ?? ""),
): Promise<PointTerrain> {
  const [igpRows, ingemmetRows] = (await Promise.all([
    sql.query(
      `SELECT dimension, city, properties
         FROM terrain_features
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
      [lon, lat],
    ),
    sql.query(
      `SELECT layer_id, properties, attribution, fetched_at
         FROM ingemmet_features
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
      [lon, lat],
    ),
  ])) as unknown as [IgpRow[], IngemmetRow[]];

  const igp = igpRows.map(toIgpMatch);
  const ingemmet = ingemmetRows.map(toIngemmetMatch);

  return {
    igp,
    ingemmet,
    studyLevel: studyLevelOf(igp, ingemmet),
    cities: citiesOf(igp),
  };
}
