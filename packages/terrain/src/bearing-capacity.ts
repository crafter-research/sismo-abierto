import { neon } from "@neondatabase/serverless";
import { citySlug } from "./zonification.ts";

/**
 * Capacidad portante publicada por el IGP, leída de Neon.
 *
 * Vive en la base y no en un snapshot como la zonificación porque son 57
 * capas separadas del WFS: traerlas en cada build volvería el deploy
 * dependiente de un servicio con rate limit no documentado.
 */
export interface BearingCapacityZone {
  /** Rango publicado, tal cual lo escribe el IGP: "> 3 Kg/cm2", "0.65 kg/cm²". */
  capacity: string;
  /** Clasificación cualitativa del IGP: Alta, Media, Baja, Muy Baja. */
  rating: string | null;
  studyYear: string | null;
  polygonCount: number;
}

export interface CityBearingCapacity {
  slug: string;
  city: string;
  zones: BearingCapacityZone[];
}

const SOURCE_ID = "igp-wfs-capacidad-portante";

/**
 * El `city` de la fila deriva del nombre de la capa (`cap_por_alto_alianza`),
 * que no siempre coincide con el slug de la zonificación
 * (`alto-de-la-alianza`). La propiedad `ciudad` del feature trae el nombre
 * publicado y cierra esos casos: medido, 51 cruzan por capa y 6 por propiedad,
 * 57 de 57 sin huérfanas.
 */
function slugCandidates(city: string, publishedName: string | null): string[] {
  const fromLayer = citySlug(city.replace(/_/g, " "));
  const fromProperty = publishedName ? citySlug(publishedName) : null;
  return fromProperty && fromProperty !== fromLayer
    ? [fromLayer, fromProperty]
    : [fromLayer];
}

/** Orden del IGP, de mejor a peor terreno. Lo desconocido va al final. */
const RATING_ORDER = ["Alta", "Media", "Baja", "Muy Baja"];

function ratingRank(rating: string | null): number {
  if (!rating) return RATING_ORDER.length;
  const index = RATING_ORDER.indexOf(rating);
  return index === -1 ? RATING_ORDER.length : index;
}

interface Row {
  city: string;
  nombre: string | null;
  capac_port: string | null;
  tipo: string | null;
  fecha: string | null;
}

function groupRows(rows: Row[]): Map<string, CityBearingCapacity> {
  const byCity = new Map<string, CityBearingCapacity>();
  for (const row of rows) {
    if (!row.capac_port) continue;
    for (const slug of slugCandidates(row.city, row.nombre)) {
      const entry = byCity.get(slug) ?? {
        slug,
        city: row.nombre ?? row.city.replace(/_/g, " "),
        zones: [],
      };
      const existing = entry.zones.find(
        (zone) => zone.capacity === row.capac_port && zone.rating === row.tipo,
      );
      if (existing) {
        existing.polygonCount++;
      } else {
        entry.zones.push({
          capacity: row.capac_port,
          rating: row.tipo,
          studyYear: row.fecha,
          polygonCount: 1,
        });
      }
      byCity.set(slug, entry);
    }
  }
  for (const entry of byCity.values()) {
    entry.zones.sort(
      (a, b) =>
        ratingRank(a.rating) - ratingRank(b.rating) ||
        a.capacity.localeCompare(b.capacity, "es"),
    );
  }
  return byCity;
}

/**
 * Capacidad portante de una ciudad. `null` cuando el IGP no publicó estudio o
 * cuando la base no está configurada: ausencia de dato no es capacidad baja.
 */
export async function cityBearingCapacity(
  slug: string,
  databaseUrl = process.env.DATABASE_URL,
): Promise<CityBearingCapacity | null> {
  if (!databaseUrl) return null;
  const sql = neon(databaseUrl);
  const rows = (await sql.query(
    `SELECT city,
            properties->>'ciudad'     AS nombre,
            properties->>'capac_port' AS capac_port,
            properties->>'tipo'       AS tipo,
            properties->>'fecha'      AS fecha
       FROM terrain_features
      WHERE source_id = $1`,
    [SOURCE_ID],
  )) as unknown as Row[];
  return groupRows(rows).get(slug) ?? null;
}

/** Slugs con capacidad portante publicada, para enlazar sin prometer vacío. */
export async function bearingCapacityCoverage(
  databaseUrl = process.env.DATABASE_URL,
): Promise<Set<string>> {
  if (!databaseUrl) return new Set();
  const sql = neon(databaseUrl);
  const rows = (await sql.query(
    `SELECT city,
            properties->>'ciudad'     AS nombre,
            properties->>'capac_port' AS capac_port,
            properties->>'tipo'       AS tipo,
            properties->>'fecha'      AS fecha
       FROM terrain_features
      WHERE source_id = $1 AND properties->>'capac_port' IS NOT NULL`,
    [SOURCE_ID],
  )) as unknown as Row[];
  return new Set(groupRows(rows).keys());
}

export { groupRows as __groupRowsForTest };
