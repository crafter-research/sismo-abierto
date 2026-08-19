/**
 * El IGP publica seis dimensiones de terreno en el mismo WFS, cada una partida
 * en una capa por ciudad más una capa nacional agregada.
 *
 * La capa nacional agregada topa en 100 features: es un límite del servidor, no
 * un conteo real (medido 2026-08-19). Las capas por ciudad devuelven su conteo
 * verdadero, así que la ingesta va siempre ciudad por ciudad.
 */
export const TERRAIN_WFS_URL = "https://ide.igp.gob.pe/geoserver/ows";

export const TERRAIN_DIMENSIONS = [
  "CapacidadPortante",
  "Suelos",
  "Geologia",
  "Geomorfologia",
  "Geodinamica",
  "ZonificacionSismica",
] as const;

export type TerrainDimension = (typeof TERRAIN_DIMENSIONS)[number];

/**
 * Capas agregadas nacionales: se excluyen de la ingesta porque el servidor las
 * trunca en 100 sin avisar. Sus datos ya vienen completos por ciudad.
 */
export const AGGREGATE_LAYERS = new Set([
  "CapacidadPortante:capacidad_portante",
]);

/**
 * El WFS del IGP no documenta rate limit, pero lo aplica: 58 peticiones
 * seguidas devolvieron 32 respuestas sin `numberMatched` (medido 2026-08-19).
 * Con esta pausa y los reintentos, 58 de 58 respondieron.
 *
 * El modo de falla es silencioso: no llega un error HTTP, llega un cuerpo sin
 * el conteo. Por eso el ingestor falla ruidoso en lugar de asumir cero.
 */
export const WFS_REQUEST_DELAY_MS = 1_200;
export const WFS_MAX_ATTEMPTS = 3;
export const WFS_RETRY_BACKOFF_MS = 3_000;
