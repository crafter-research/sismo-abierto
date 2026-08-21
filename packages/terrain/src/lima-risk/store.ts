import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { type RiskLevel, riskLevelSpec } from "./levels.ts";

/**
 * Lectura de `lima_riesgo_features`: el mapa de riesgo sísmico de Lima del
 * CISMID, extraído del PDF vectorial georreferenciado que publican.
 *
 * 86,792 polígonos, 50 distritos de Lima y Callao, estudios de 2010 a 2021.
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

export class LimaRiskStore {
  private readonly sql: NeonSql;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  /**
   * Qué dice el estudio sobre un punto. Devuelve null cuando el punto cae
   * fuera de los 50 distritos estudiados, que es la mitad de la respuesta:
   * "no hay estudio acá" es información, no un error.
   */
  async atPoint(lon: number, lat: number): Promise<LimaRiskMatch | null> {
    const rows = (await this.sql`
      SELECT district, funder, study_year, level, damage, repair_cost, risk
      FROM lima_riesgo_features
      WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(${lon}, ${lat}), 4326))
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

  /** Resumen por distrito, ordenado por exposición descendente. */
  async districts(): Promise<DistrictRiskSummary[]> {
    const rows = (await this.sql`
      SELECT district, funder, study_year,
             count(*)::int AS total,
             count(*) FILTER (WHERE level = 1)::int AS l1,
             count(*) FILTER (WHERE level = 2)::int AS l2,
             count(*) FILTER (WHERE level = 3)::int AS l3,
             count(*) FILTER (WHERE level = 4)::int AS l4,
             count(*) FILTER (WHERE level = 5)::int AS l5,
             round((sum(ST_Area(geom::geography)) / 1e6)::numeric, 2)::float8 AS area_km2
      FROM lima_riesgo_features
      GROUP BY district, funder, study_year
      ORDER BY (count(*) FILTER (WHERE level >= 4))::float / count(*) DESC
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

  async district(name: string): Promise<DistrictRiskSummary | null> {
    const all = await this.districts();
    const target = name.toLowerCase();
    return all.find((entry) => entry.district.toLowerCase() === target) ?? null;
  }

  /** Totales de toda la capa, para la cabecera. */
  async totals(): Promise<{
    features: number;
    districts: number;
    areaKm2: number;
    byLevel: number[];
    yearRange: [number, number];
  }> {
    const rows = (await this.sql`
      SELECT count(*)::int AS features,
             count(DISTINCT district)::int AS districts,
             round((sum(ST_Area(geom::geography)) / 1e6)::numeric, 1)::float8 AS area_km2,
             count(*) FILTER (WHERE level = 1)::int AS l1,
             count(*) FILTER (WHERE level = 2)::int AS l2,
             count(*) FILTER (WHERE level = 3)::int AS l3,
             count(*) FILTER (WHERE level = 4)::int AS l4,
             count(*) FILTER (WHERE level = 5)::int AS l5,
             min(study_year)::int AS min_year,
             max(study_year)::int AS max_year
      FROM lima_riesgo_features
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
