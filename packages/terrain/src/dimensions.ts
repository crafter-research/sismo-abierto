/**
 * El IGP publica seis dimensiones de terreno en el mismo WFS, cada una partida
 * en una capa por ciudad más una capa nacional agregada.
 *
 * El servidor sirve como máximo 100 features por petición, en cualquier capa.
 * No es un tope del dato: `numberMatched` trae el total verdadero y el resto se
 * alcanza paginando con `startIndex`. Medido 2026-08-20 sobre las 348 capas:
 * Geologia 436, Geomorfologia 424, Suelos 330, Geodinamica 286,
 * CapacidadPortante 174, ZonificacionSismica 544; las cuatro primeras llegan
 * truncadas a 100 sin avisar si se pide la capa nacional de una sola vez.
 *
 * Ojo con `resultType=hits`: ahí el propio `numberMatched` miente y devuelve
 * 100. El conteo verdadero sale de un GetFeature normal (`count=1` basta).
 *
 * Ninguna capa por ciudad pasa de 42 features, así que la ingesta ciudad por
 * ciudad esquiva el tope. La suma por ciudad reconcilia exacto con la nacional
 * en cinco de seis dimensiones.
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
 * Capas agregadas nacionales: se excluyen de la ingesta porque una petición sin
 * paginar las corta en 100 sin avisar. Sus datos ya vienen completos por ciudad.
 *
 * Excepción medida: `zon_barranca` declara `numberMatched=11` y sirve 10 en una
 * petición simple. El polígono que falta ("Suelo Tipo S4: Excepcionalmente
 * flexible") solo aparece paginando. La capa nacional sí lo trae, y es de ahí
 * que salió el snapshot en `data/`.
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
