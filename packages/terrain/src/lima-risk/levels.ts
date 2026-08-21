/**
 * Los cinco niveles de daño del mapa de riesgo sísmico de Lima (CISMID-UNI).
 *
 * El PDF oficial no trae los niveles como atributo: viajan en el color de
 * relleno de cada polígono, y la tabla que traduce color a nivel está impresa
 * en la leyenda del A1. Estos cinco valores son esa leyenda, verificados contra
 * los colores medidos en el PDF (2026-08-21): cada capa de distrito usa
 * exactamente estos cinco y ningún otro.
 *
 * Fuente de los umbrales de costo: la tabla publicada por el CISMID junto al
 * mapa, en cismid.uni.edu.pe.
 */

export type RiskLevel = 1 | 2 | 3 | 4 | 5;

export interface RiskLevelSpec {
  level: RiskLevel;
  /** Color de relleno en el PDF original. Es la llave de extracción. */
  color: string;
  damage: string;
  repairCost: string;
  /** Agrupación del CISMID: I-II bajo, III-IV moderado, V alto. */
  risk: "Bajo" | "Moderado" | "Alto";
  /** Color de la UI. No es el del PDF: ver nota abajo. */
  ui: string;
}

/**
 * Por qué la UI no reusa los colores del PDF: el verde `#267300` sobre fondo
 * oscuro queda casi negro y `#FFFF00` puro vibra sobre blanco. La rampa de
 * abajo son los tokens `glyph-*` que el sitio ya usa para niveles de alerta
 * (volcanes, sismos), así que el mapa de Lima habla el mismo idioma visual que
 * el resto del sitio en vez de inventar una paleta nueva. El nivel I agrega el
 * único tono que faltaba: un verde más oscuro que `glyph-verde` para separar
 * "sin daño" de "daño leve".
 */
export const RISK_LEVELS: readonly RiskLevelSpec[] = [
  {
    level: 1,
    color: "#267300",
    damage: "Sin daño o daño superficial",
    repairCost: "menos del 15%",
    risk: "Bajo",
    ui: "#0f7a30",
  },
  {
    level: 2,
    color: "#55FF00",
    damage: "Daño leve",
    repairCost: "15% a 30%",
    risk: "Bajo",
    ui: "#28a948",
  },
  {
    level: 3,
    color: "#FFFF00",
    damage: "Daño moderado",
    repairCost: "30% a 60%",
    risk: "Moderado",
    ui: "#ffc543",
  },
  {
    level: 4,
    color: "#FFAA00",
    damage: "Daño severo",
    repairCost: "60% a 85%",
    risk: "Moderado",
    ui: "#ff9300",
  },
  {
    level: 5,
    color: "#FF0000",
    damage: "Colapso",
    repairCost: "más del 85%",
    risk: "Alto",
    ui: "#ea001d",
  },
] as const;

export function riskLevelSpec(level: number): RiskLevelSpec | null {
  return RISK_LEVELS.find((spec) => spec.level === level) ?? null;
}

/** Número romano, como los nombra el CISMID en su tabla. */
export function romanLevel(level: number): string {
  return ["", "I", "II", "III", "IV", "V"][level] ?? String(level);
}

/**
 * Qué significa para una persona, no para un ingeniero. El PDF describe el
 * daño en términos de costo de reparación; esto lo traduce a la decisión que
 * la persona tiene que tomar.
 */
export function whatItMeans(level: number): string {
  switch (level) {
    case 1:
      return "Ante un sismo severo, se espera que una vivienda típica de esta zona quede en pie con daños menores.";
    case 2:
      return "Se esperan grietas y daños reparables sin comprometer la estructura.";
    case 3:
      return "Se espera daño estructural reparable, pero la reparación cuesta una fracción importante de la vivienda.";
    case 4:
      return "Se espera daño estructural grave. Reparar cuesta casi tanto como reconstruir.";
    case 5:
      return "Se espera colapso de una vivienda típica sin refuerzo. Esta es la categoría más alta del estudio.";
    default:
      return "";
  }
}
