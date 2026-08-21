/**
 * Agrupación de las 128 SUBUNIDAD distintas de geomorfología (INGEMMET,
 * GEOCATMIN, medido 2026-08-20 contra `ingemmet_features`) en categorías
 * legibles para un mapa nacional.
 *
 * Pintar 128 colores es ruido: nadie distingue "Colina y lomada en roca
 * intrusiva" de "Colina y lomada en roca sedimentaria" en un mapa de país
 * entero. Se agrupa por la palabra que domina el nombre INGEMMET
 * (montaña/colina/vertiente/terraza/llanura/glaciar/volcán/agua/litoral),
 * que es el criterio que el propio catálogo usa para nombrar cada subunidad.
 *
 * El orden de los patrones importa: se evalúan en secuencia y el primer
 * match gana. "Vertiente" antes que "montaña" porque frases como "Ladera de
 * montaña en roca sedimentaria" contienen ambas palabras y la pendiente
 * (vertiente/ladera) es el rasgo más específico.
 */
export type GeomorphCategory =
  | "montana"
  | "colina"
  | "vertiente"
  | "terraza"
  | "llanura"
  | "glaciar"
  | "volcanico"
  | "agua"
  | "litoral"
  | "antropico"
  | "otro";

interface CategoryRule {
  category: GeomorphCategory;
  pattern: RegExp;
}

// Orden de evaluación: primero los rasgos más específicos (antrópico,
// glaciar, volcánico, litoral, agua), después la forma del relieve
// (vertiente/ladera > colina/lomada > montaña > terraza > llanura).
// Glaciar va antes que agua: "Valle glaciar con laguna" contiene ambas
// palabras y el origen glaciar es el rasgo dominante del nombre INGEMMET.
const CATEGORY_RULES: CategoryRule[] = [
  { category: "antropico", pattern: /antrópic|actividad minera/i },
  { category: "glaciar", pattern: /glacia|morrena|nieve|gelifracción/i },
  {
    category: "volcanico",
    pattern:
      /volcán|volcánic|piroclást|lava|ignimbrít|cráter|caldera|domo|estratovolc|escoria/i,
  },
  {
    category: "litoral",
    pattern:
      /litoral|costa|playa|tablazo|marina|albufera|delta|estuario|dunas|mantos? de arena|barra de arena/i,
  },
  {
    category: "agua",
    pattern:
      /laguna|lago|pantano|bofedal|aguajal|humedal|cauce del río|isla fluvial|meandro|orillar/i,
  },
  { category: "vertiente", pattern: /vertiente|piedemonte|ladera|abanico/i },
  { category: "colina", pattern: /colina|lomada|monte isla/i },
  { category: "montana", pattern: /montaña/i },
  { category: "terraza", pattern: /terraza/i },
  {
    category: "llanura",
    pattern:
      /llanura|planicie|altiplanicie|meseta|valle|depresión|kárstico|relieve/i,
  },
];

/** Categoría legible a partir del texto SUBUNIDAD tal como llega de GEOCATMIN. */
export function categorizeGeomorph(
  subunidad: string | null | undefined,
): GeomorphCategory {
  const text = subunidad ?? "";
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return "otro";
}

/**
 * Tabla SUBUNIDAD→categoría, para pasar a la query SQL de generación de
 * tiles (`TerrainTileStore.mvt`). Se calcula una sola vez sobre la lista
 * completa de subunidades y viaja como parámetro, en vez de reimplementar
 * el regex en PL/pgSQL.
 */
export function buildSubunidadCategoryLookup(
  subunidades: string[],
): Record<string, GeomorphCategory> {
  const lookup: Record<string, GeomorphCategory> = {};
  for (const subunidad of subunidades) {
    lookup[subunidad] = categorizeGeomorph(subunidad);
  }
  return lookup;
}

/**
 * Paleta terrosa, distinta de SOIL_COLORS (que ya usa la rampa
 * verde-amarillo-rojo de riesgo de suelo del IGP): esta capa clasifica
 * forma del terreno, no rigidez, y compartir rampa confundiría las dos
 * leyendas en el mismo mapa.
 */
export const GEOMORPH_COLORS: Record<GeomorphCategory, string> = {
  montana: "#6B4423",
  colina: "#A9784A",
  vertiente: "#C9A063",
  terraza: "#D9C08A",
  llanura: "#E8DCB5",
  glaciar: "#D6E8F0",
  volcanico: "#8B2E2E",
  agua: "#3D7EA6",
  litoral: "#E0C097",
  antropico: "#8C8C8C",
  otro: "#B8B8B8",
};

export const GEOMORPH_LEGEND: { category: GeomorphCategory; label: string }[] =
  [
    { category: "montana", label: "Montaña" },
    { category: "colina", label: "Colina y lomada" },
    { category: "vertiente", label: "Vertiente, ladera y piedemonte" },
    { category: "terraza", label: "Terraza" },
    { category: "llanura", label: "Llanura, planicie y valle" },
    { category: "glaciar", label: "Glaciar y morrena" },
    { category: "volcanico", label: "Relieve volcánico" },
    { category: "agua", label: "Agua y humedal" },
    { category: "litoral", label: "Litoral y costa" },
    { category: "antropico", label: "Actividad antrópica" },
    { category: "otro", label: "Otras formas" },
  ];
