import { TERRAIN_TILE_BASE_URL } from "../tile-config.ts";

/**
 * Tiles del mapa de riesgo de Lima, en el mismo bucket de R2 que la capa
 * nacional pero bajo su propio prefijo. Generados con tippecanoe desde el
 * GeoJSON extraído del PDF (z9-z15, 1489 tiles, 25 MB).
 *
 * z15 es el techo porque a ese zoom cada polígono ya es una manzana en
 * pantalla: bajar más no revela información nueva del estudio.
 */
export const LIMA_RISK_TILE_URL_TEMPLATE = `${TERRAIN_TILE_BASE_URL}/lima/riesgo/{z}/{x}/{y}.mvt`;

export const LIMA_RISK_SOURCE_LAYER = "riesgo";
export const LIMA_RISK_MIN_ZOOM = 9;
export const LIMA_RISK_MAX_ZOOM = 15;

/** Centro de Lima Metropolitana, medido del bbox real de la capa. */
export const LIMA_CENTER: [number, number] = [-76.99, -12.05];

export const LIMA_RISK_ATTRIBUTION =
  "CISMID-UNI · Mapa de riesgo sísmico de Lima";
