/**
 * Configuración de los vector tiles de geomorfología nacional (INGEMMET).
 *
 * Por qué tiles pregenerados y no un endpoint que corre ST_AsMVT por
 * request: medido 2026-08-20 contra el tile que contiene Lima, un z6 sin
 * simplificar tarda 17.5s y pesa 3.3MB. Ningún request de usuario puede
 * esperar eso. La alternativa es generar los tiles una vez (offline, con
 * `scripts/build-terrain-tiles.ts`) y servirlos como archivos estáticos.
 */

/** Bounding box del Perú continental, con margen. No se generan tiles de océano vacío fuera de este rango. */
export const PERU_BBOX = {
  minLon: -81.4,
  minLat: -18.4,
  maxLon: -68.6,
  maxLat: 0.0,
} as const;

/**
 * Rango de zoom, medido 2026-08-20 sobre el tile que contiene Lima
 * (z, x, y) con `ST_Simplify` en metros (proyección 3857):
 *
 *   z5  tol=2000m   43,425 features  298 KB
 *   z6  tol=800m    15,412 features  326 KB
 *   z7  tol=400m     2,539 features  104 KB
 *   z8  tol=150m     1,889 features  124 KB
 *   z9  tol=60m        397 features   41 KB
 *
 * z5 es el zoom mínimo donde el país entero cabe en pantalla (4 tiles
 * cubren todo el bbox). z9 es el techo: a partir de ahí el peso por tile ya
 * es chico (<50KB) y seguir hasta z10+ solo agrega ~2000 tiles más por una
 * ganancia de detalle marginal — el estudio de INGEMMET es geomorfología
 * regional, no catastro, así que no hay información nueva que revelar zoom
 * adentro de z9. La tolerancia de simplificación baja con el zoom porque a
 * mayor acercamiento hay menos área por tile y el usuario espera más detalle.
 *
 * Corrida real sobre el bbox completo (`build-terrain-tiles.ts`,
 * 2026-08-20): z5 (3 tiles, 511 KB), z6 (9 tiles, 1.4 MB), z7 (28 tiles,
 * 2.6 MB), z8 (84 tiles, 4.7 MB). z5-z8 suman ~9.5 MB — muy por debajo del
 * límite de deployment de Vercel, confirma que servir desde `public/` (sin
 * R2) alcanza para este tamaño.
 */
export const TILE_MIN_ZOOM = 5;
export const TILE_MAX_ZOOM = 9;

/** Tolerancia de ST_Simplify en metros (proyección 3857), por nivel de zoom. */
export const SIMPLIFY_TOLERANCE_BY_ZOOM: Record<number, number> = {
  5: 2000,
  6: 800,
  7: 400,
  8: 150,
  9: 60,
};

export const TILE_LAYER_ID = "ingemmet-geomorfologia";
export const TILE_SOURCE_LAYER = "geomorfologia";
export const TILE_EXTENT = 4096;

/** Ruta relativa a `public/` donde `build-terrain-tiles.ts` escribe cada tile. */
export function tileRelativePath(z: number, x: number, y: number): string {
  return `tiles/terreno/geomorfologia/${z}/${x}/${y}.mvt`;
}

/** Plantilla de URL que consume MapLibre (`{z}/{x}/{y}`) para la capa nacional. */
export const TERRAIN_TILE_URL_TEMPLATE =
  "/tiles/terreno/geomorfologia/{z}/{x}/{y}.mvt";

export const INGEMMET_TILE_ATTRIBUTION = "INGEMMET · GEOCATMIN";
