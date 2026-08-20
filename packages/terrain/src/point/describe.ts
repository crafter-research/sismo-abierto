/**
 * El IGP publica el campo descriptivo bajo una llave distinta por dimensión:
 * medido contra `terrain_features` el 2026-08-20 (348 capas), `unidades` en
 * Geologia/Geomorfologia, `tipo` en Suelos (SUCS entre paréntesis, ej.
 * "Arcillas inorgánicas (CL)"), `zona` en ZonificacionSismica, `capac_port`
 * en CapacidadPortante, `eventos` en Geodinamica. No hay un campo único: cada
 * dimensión necesita su propia prioridad.
 */
const IGP_DESCRIPTIVE_FIELDS: Record<string, readonly string[]> = {
  Geologia: ["unidades"],
  Geomorfologia: ["unidades"],
  Suelos: ["tipo"],
  ZonificacionSismica: ["zona"],
  CapacidadPortante: ["capac_port"],
  Geodinamica: ["eventos"],
};

/**
 * Campos secundarios: dato técnico útil pero no la descripción legible.
 * `capac_port` ya trae unidad ("2.80 kg/cm²"), por eso CapacidadPortante no
 * lista un secundario propio — el valor principal ya es autoexplicativo.
 */
const IGP_SECONDARY_FIELDS: Record<string, readonly string[]> = {
  Geologia: ["simbolo"],
  Suelos: ["sucs"],
  CapacidadPortante: ["tipo"],
};

/**
 * Ruido de GIS que nunca debe llegar a pantalla: coordenadas de área/longitud
 * de PostGIS, ids internos, metadata ya mostrada por otra vía (`fecha` sale
 * como `studyYear`, `ciudad`/`departamento` ya están en el encabezado).
 */
const NOISE_FIELDS = new Set([
  "st_area_sh",
  "st_length_",
  "objectid",
  "id",
  "fecha",
  "ciudad",
  "departamento",
]);

function readString(
  properties: Record<string, unknown>,
  field: string,
): string | null {
  const value = properties[field];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function firstPresent(
  properties: Record<string, unknown>,
  fields: readonly string[],
): string | null {
  for (const field of fields) {
    const value = readString(properties, field);
    if (value) return value;
  }
  return null;
}

export interface IgpDescription {
  /** Descripción legible del terreno para esa dimensión, o null si no se pudo elegir. */
  primary: string | null;
  /** Dato técnico secundario (código, clasificación), o null si no aplica. */
  secondary: string | null;
}

/**
 * Elige el campo descriptivo de un match del IGP según su `dimension`.
 * Nunca hardcodea una sola llave: cada dimensión define su propio campo
 * primario (y opcionalmente uno secundario) arriba, medido contra la base real.
 */
export function describeIgpMatch(
  dimension: string,
  properties: Record<string, unknown>,
): IgpDescription {
  const primaryFields = IGP_DESCRIPTIVE_FIELDS[dimension];
  const primary = primaryFields
    ? firstPresent(properties, primaryFields)
    : null;

  const secondaryFields = IGP_SECONDARY_FIELDS[dimension];
  const secondary = secondaryFields
    ? firstPresent(properties, secondaryFields)
    : null;

  return { primary, secondary };
}

/**
 * Descripción legible de un match de INGEMMET. Geomorfología publica
 * `SUBUNIDAD`, fallas publica `DESCRIP` — mismo problema que el IGP, campo
 * distinto por capa.
 */
const INGEMMET_DESCRIPTIVE_FIELDS: Record<string, readonly string[]> = {
  "ingemmet-geomorfologia": ["SUBUNIDAD"],
  "ingemmet-fallas": ["DESCRIP"],
};

export function describeIngemmetMatch(
  layer: string,
  properties: Record<string, unknown>,
): string | null {
  const fields = INGEMMET_DESCRIPTIVE_FIELDS[layer];
  return fields ? firstPresent(properties, fields) : null;
}

/** True si el campo es ruido de GIS/metadata que ya se muestra por otra vía. */
export function isNoiseField(field: string): boolean {
  return NOISE_FIELDS.has(field);
}
