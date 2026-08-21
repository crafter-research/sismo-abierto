import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { type RiskLevel, riskLevelSpec } from "./levels.ts";

/**
 * Lectura de `lima_riesgo_features`: el mapa de riesgo sísmico de Lima del
 * CISMID, extraído del PDF vectorial georreferenciado que publican.
 *
 * 84,784 polígonos, 50 distritos de Lima y Callao, estudios de 2010 a 2021.
 * Cada polígono es aproximadamente una manzana.
 */

type NeonSql = NeonQueryFunction<false, false>;

export interface LimaRiskMatch {
  district: string;
  funder: string;
  studyYear: number;
  level: RiskLevel;
  damage: string;
  repairCost: string;
  risk: string;
}

export interface DistrictRiskSummary {
  district: string;
  funder: string;
  studyYear: number;
  total: number;
  /** Conteo por nivel, índice 0 = nivel 1. */
  byLevel: number[];
  /** Porcentaje de manzanas en nivel 4 o 5. Es el número que ordena la lista. */
  pctHigh: number;
  areaKm2: number;
}

export interface DistrictOutline {
  district: string;
  geometry: GeoJSON.Geometry;
  /** [[minLon, minLat], [maxLon, maxLat]], para el fly-to del mapa. */
  bounds: [[number, number], [number, number]];
}

export class LimaRiskStore {
  private readonly sql: NeonSql;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  /**
   * Qué dice el estudio sobre un punto. Devuelve null cuando el punto cae
   * fuera de los 50 distritos estudiados, que es la mitad de la respuesta:
   * "no hay estudio acá" es información, no un error.
   *
   * `snapMeters` existe para las direcciones geocodificadas. Un geocoder
   * devuelve el centro de la calle, y las calles son exactamente los huecos
   * entre manzanas: medido contra Nominatim, 3 de 4 direcciones de Lima caían
   * a 2, 13 y 90 m del polígono más cercano en vez de adentro. Con snap 0 (el
   * default) el comportamiento es intersección estricta, que es lo correcto
   * para un click en el mapa, donde el hueco significa "no hay manzana acá".
   */
  async atPoint(
    lon: number,
    lat: number,
    options: { snapMeters?: number } = {},
  ): Promise<LimaRiskMatch | null> {
    const snap = options.snapMeters ?? 0;
    const rows = (await this.sql`
      SELECT district, funder, study_year, level, damage, repair_cost, risk
      FROM lima_riesgo_features
      WHERE ST_DWithin(
              geom::geography,
              ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)::geography,
              ${snap}
            )
      ORDER BY geom <-> ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)
      LIMIT 1
    `) as Array<{
      district: string;
      funder: string;
      study_year: number;
      level: number;
      damage: string;
      repair_cost: string;
      risk: string;
    }>;

    const row = rows[0];
    if (!row) return null;
    return {
      district: row.district,
      funder: row.funder,
      studyYear: row.study_year,
      level: row.level as RiskLevel,
      damage: row.damage,
      repairCost: row.repair_cost,
      risk: row.risk,
    };
  }

  /**
   * Resumen por distrito, ordenado por exposición descendente.
   *
   * Lee `lima_riesgo_stats`, precalculada por la ingesta. Agrupar y sumar
   * `ST_Area(geom::geography)` sobre las 84 mil manzanas cuesta 930 ms medidos
   * con EXPLAIN ANALYZE; leer la tabla cuesta 0.04 ms. El dato solo cambia
   * cuando se reingiere el PDF.
   */
  async districts(): Promise<DistrictRiskSummary[]> {
    const rows = (await this.sql`
      SELECT district, funder, study_year, total, l1, l2, l3, l4, l5, area_km2
      FROM lima_riesgo_stats
      ORDER BY (l4 + l5)::float / NULLIF(total, 0) DESC
    `) as Array<{
      district: string;
      funder: string;
      study_year: number;
      total: number;
      l1: number;
      l2: number;
      l3: number;
      l4: number;
      l5: number;
      area_km2: number;
    }>;

    return rows.map((row) => {
      const byLevel = [row.l1, row.l2, row.l3, row.l4, row.l5];
      return {
        district: row.district,
        funder: row.funder,
        studyYear: row.study_year,
        total: row.total,
        byLevel,
        pctHigh: row.total ? ((row.l4 + row.l5) / row.total) * 100 : 0,
        areaKm2: row.area_km2,
      };
    });
  }

  /**
   * Contorno de cada distrito, para resaltar el elegido en el mapa. Se deriva
   * de los propios polígonos (`ST_Union`) en vez de traer un shapefile de
   * límites administrativos aparte: lo que importa acá es el borde del
   * *estudio*, que no siempre coincide con el límite político y es el que la
   * gente necesita ver para saber hasta dónde llega el dato.
   *
   * Lee `lima_riesgo_outlines`, precalculada por la ingesta. Calcularla al
   * vuelo cuesta 3.5 s medidos (50 buffers + uniones sobre 84 mil polígonos) y
   * era la causa de un TTFB de 2.3 s en esta página. La geometría solo cambia
   * cuando se reingiere el PDF, así que no hay razón para recalcularla por
   * request.
   *
   * El buffer de ~66 m que usa esa tabla cierra las calles antes de unir. Sin
   * él, `ST_Union` de las manzanas deja un hueco por cada calle: medido en
   * Villa El Salvador daba 3,058 anillos, y dibujar todos con línea gruesa
   * pinta el distrito de negro en vez de bordearlo.
   */
  async outlines(): Promise<DistrictOutline[]> {
    const rows = (await this.sql`
      SELECT district, ST_AsGeoJSON(geom) AS geojson,
             min_lon, min_lat, max_lon, max_lat
      FROM lima_riesgo_outlines
    `) as Array<{
      district: string;
      geojson: string;
      min_lon: number;
      min_lat: number;
      max_lon: number;
      max_lat: number;
    }>;

    return rows.map((row) => ({
      district: row.district,
      geometry: JSON.parse(row.geojson) as GeoJSON.Geometry,
      bounds: [
        [row.min_lon, row.min_lat],
        [row.max_lon, row.max_lat],
      ],
    }));
  }

  async district(name: string): Promise<DistrictRiskSummary | null> {
    const all = await this.districts();
    const target = name.toLowerCase();
    return all.find((entry) => entry.district.toLowerCase() === target) ?? null;
  }

  /** Totales de toda la capa. Se derivan de `lima_riesgo_stats`, no del detalle. */
  async totals(): Promise<{
    features: number;
    districts: number;
    areaKm2: number;
    byLevel: number[];
    yearRange: [number, number];
  }> {
    const rows = (await this.sql`
      SELECT sum(total)::int AS features,
             count(*)::int AS districts,
             round(sum(area_km2)::numeric, 1)::float8 AS area_km2,
             sum(l1)::int AS l1, sum(l2)::int AS l2, sum(l3)::int AS l3,
             sum(l4)::int AS l4, sum(l5)::int AS l5,
             min(study_year)::int AS min_year, max(study_year)::int AS max_year
      FROM lima_riesgo_stats
    `) as Array<{
      features: number;
      districts: number;
      area_km2: number;
      l1: number;
      l2: number;
      l3: number;
      l4: number;
      l5: number;
      min_year: number;
      max_year: number;
    }>;

    const row = rows[0];
    if (!row) {
      return {
        features: 0,
        districts: 0,
        areaKm2: 0,
        byLevel: [0, 0, 0, 0, 0],
        yearRange: [0, 0],
      };
    }
    return {
      features: row.features,
      districts: row.districts,
      areaKm2: row.area_km2,
      byLevel: [row.l1, row.l2, row.l3, row.l4, row.l5],
      yearRange: [row.min_year, row.max_year],
    };
  }
}

/** Etiqueta legible del financiador, que viaja en el nombre de capa del PDF. */
export function funderLabel(funder: string): string {
  switch (funder) {
    case "CISMID-MVCS":
      return "Ministerio de Vivienda, Construcción y Saneamiento";
    case "CISMID-MEF":
      return "Ministerio de Economía y Finanzas";
    case "CISMID-CENEPRED":
      return "CENEPRED";
    default:
      return funder;
  }
}

export { riskLevelSpec };
