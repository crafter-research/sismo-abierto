import { type NeonQueryFunction, neon } from "@neondatabase/serverless";

type NeonSql = NeonQueryFunction<false, false>;

export interface NearestFault {
  /** Texto de DESCRIP tal cual lo publica INGEMMET, ej. "Falla normal". */
  description: string;
  /** Distancia sobre el elipsoide (geography), en metros, redondeada al metro. */
  distanceMeters: number;
  /**
   * false para "Lineamiento": es un rasgo lineal observado en foto/imagen
   * satelital que INGEMMET no confirmó como falla activa. Confundirlo con una
   * falla real sería alarmismo sin base — la UI debe distinguirlo en el copy.
   */
  isConfirmedFault: boolean;
}

interface NearestFaultRow {
  d: string;
  m: string;
}

const UNCONFIRMED_DESCRIPTIONS = new Set(["Lineamiento"]);

function toNearestFault(row: NearestFaultRow): NearestFault {
  return {
    description: row.d,
    distanceMeters: Math.round(Number(row.m)),
    isConfirmedFault: !UNCONFIRMED_DESCRIPTIONS.has(row.d),
  };
}

/**
 * Fallas de INGEMMET más cercanas a un punto, por distancia real sobre el
 * elipsoide (`::geography`), usando el operador de vecino más cercano `<->`
 * para aprovechar el índice GIST existente (medido 221-638ms contra prod,
 * scan completo sería mucho más lento).
 *
 * Excluye dos cosas que NO son fallas geológicas:
 * - `Flechas`: simbología cartográfica (sentido de movimiento), no una
 *   estructura — decir "la Flecha más cercana está a 3km" no informa nada.
 * - `DESCRIP` vacío/en blanco (10 filas en la base): sin tipo no hay copy
 *   honesto que mostrar.
 *
 * `Lineamiento` SÍ se incluye porque es información real de proximidad, pero
 * viaja con `isConfirmedFault: false` para que la UI no lo trate como una
 * falla activa confirmada.
 */
export async function nearestFaults(
  lon: number,
  lat: number,
  sql: NeonSql = neon(process.env.DATABASE_URL ?? ""),
  limit = 3,
): Promise<NearestFault[]> {
  const rows = (await sql.query(
    `SELECT properties->>'DESCRIP' d,
            ROUND((ST_Distance(geom::geography, ST_SetSRID(ST_Point($1,$2),4326)::geography))::numeric) m
       FROM ingemmet_features
      WHERE layer_id = 'ingemmet-fallas'
        AND properties->>'DESCRIP' IS NOT NULL
        AND trim(properties->>'DESCRIP') <> ''
        AND properties->>'DESCRIP' <> 'Flechas'
      ORDER BY geom <-> ST_SetSRID(ST_Point($1,$2),4326)
      LIMIT $3`,
    [lon, lat, limit],
  )) as unknown as NearestFaultRow[];

  return rows.map(toNearestFault);
}
