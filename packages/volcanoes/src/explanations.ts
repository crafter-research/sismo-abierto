export interface LevelExplanation {
  level: string;
  meaning: string;
}

export const LEVEL_EXPLANATIONS_VERSION = "1.0.0";

export const LEVEL_EXPLANATIONS: LevelExplanation[] = [
  {
    level: "Verde",
    meaning:
      "En la semaforización volcánica peruana, el nivel verde suele describir actividad dentro de parámetros normales de un volcán activo o potencialmente activo.",
  },
  {
    level: "Amarillo",
    meaning:
      "El nivel amarillo suele describir un incremento de actividad por encima del nivel base, que amerita seguimiento reforzado.",
  },
  {
    level: "Naranja",
    meaning:
      "El nivel naranja suele describir actividad en aumento con explosiones o emisiones relevantes en curso o esperables.",
  },
  {
    level: "Rojo",
    meaning:
      "El nivel rojo suele describir una erupción mayor en curso con impacto potencial significativo.",
  },
];

export const EXPLANATION_DISCLAIMER =
  "Explicación educativa comunitaria, pendiente de revisión por el equipo científico. El significado operativo exacto de cada nivel lo define el IGP/CENVUL. Esta página no es una alerta en vivo.";

export function explanationForLevel(level: string): LevelExplanation | null {
  return (
    LEVEL_EXPLANATIONS.find(
      (entry) => entry.level.toLowerCase() === level.trim().toLowerCase(),
    ) ?? null
  );
}

export const VA3_BLOCKED_NOTICE =
  "La cronología de boletines oficiales por volcán está bloqueada: la capa pública no expone fecha de actualización por registro (verificado vía DescribeFeatureType el 2026-07-20) y no existe todavía un mapeo determinista entre cada registro y sus boletines. Antes de mostrar una serie histórica necesitamos confirmar con el IGP cuál es la fuente de verdad del nivel vigente y su fecha.";
