/**
 * Capas de INGEMMET (GEOCATMIN) que Sismo Abierto ingiere.
 *
 * Reuso autorizado por escrito por INGEMMET el 2026-08-20. Condiciones que el
 * producto debe cumplir y que por eso viajan con el dato:
 *
 * 1. Atribución visible a INGEMMET en cualquier producto derivado.
 * 2. No atribuir a INGEMMET responsabilidad sobre productos derivados ni sobre
 *    interpretaciones de terceros.
 * 3. Trazabilidad: fuente original y **fecha de consulta**. Por eso cada fila
 *    guarda `fetched_at` y cada corrida su `captured_at`.
 */
export const INGEMMET_BASE =
  "https://geocatmin.ingemmet.gob.pe/arcgis/rest/services";

export const INGEMMET_ATTRIBUTION =
  "Instituto Geológico, Minero y Metalúrgico (INGEMMET)";

export const INGEMMET_DISCLAIMER =
  "INGEMMET es la fuente de los datos y no es responsable de los productos derivados ni de las interpretaciones hechas en esta plataforma.";

export interface IngemmetLayer {
  /** Id estable, usado como clave de reemplazo en la base. */
  id: string;
  service: string;
  layerId: number;
  /** Campos a traer. La geometría viene aparte. */
  outFields: string[];
  label: string;
}

export const INGEMMET_LAYERS: IngemmetLayer[] = [
  {
    id: "ingemmet-geomorfologia",
    service: "SERV_GEOMORFOLOGIA",
    layerId: 0,
    outFields: ["ETIQUETA", "SUBUNIDAD", "CODIGO"],
    label: "Geomorfología",
  },
  {
    id: "ingemmet-fallas",
    service: "SERV_GEOLOGIA_100K_INTEGRADA",
    layerId: 3,
    outFields: ["CODI", "DESCRIP"],
    label: "Fallas geológicas",
  },
];

/**
 * El ArcGIS de GEOCATMIN **no soporta paginación**: `resultRecordCount` devuelve
 * HTTP 400 "Pagination is not supported." y `maxRecordCount` es 1000.
 *
 * Lo que sí funciona, medido 2026-08-20: `returnIdsOnly=true` ignora ese tope y
 * devuelve la lista completa de OBJECTID (62,109 para geomorfología en una sola
 * respuesta). Con esa lista se pide por `objectIds` en lotes, así que no hay que
 * adivinar rangos ni asumir que los ids son contiguos — no lo son: Geología
 * declara 113,051 features con OBJECTID máximo 118,826.
 */
export const INGEMMET_BATCH_SIZE = 500;

/**
 * Piso al que se puede partir un lote antes de darse por vencido.
 *
 * El límite real de GEOCATMIN no es la cantidad de features sino el **peso de la
 * respuesta**: medido 2026-08-20 sobre geomorfología, un lote de 500 devolvió
 * 12.9MB y otro murió con HTTP 500 y `Error performing query operation`, mientras
 * el mismo rango en lotes de 100 respondió sin problema (6.3MB el más pesado).
 *
 * Los polígonos con muchos vértices son los que pesan, y no hay forma de saber
 * cuánto pesa un lote antes de pedirlo. Por eso el lote se parte al fallar en vez
 * de fijar un tamaño chico para todos: la mayoría entra bien en 500.
 */
export const INGEMMET_MIN_BATCH_SIZE = 25;

/**
 * Pausa entre lotes y política de reintento.
 *
 * Medido 2026-08-20: con 400ms de pausa, la corrida de geomorfología (62,109
 * features, 125 lotes) murió con HTTP 500 alrededor del lote 40. Los mismos
 * lotes pedidos aislados respondieron OK, así que no es el dato ni el tamaño:
 * es presión sostenida sobre el servicio. Con 1.2s y más reintentos completa.
 */
export const INGEMMET_REQUEST_DELAY_MS = 1_200;

export const INGEMMET_MAX_ATTEMPTS = 5;
export const INGEMMET_RETRY_BACKOFF_MS = 8_000;

export function idsUrl(layer: IngemmetLayer): string {
  return `${INGEMMET_BASE}/${layer.service}/MapServer/${layer.layerId}/query?where=1%3D1&returnIdsOnly=true&f=json`;
}

export function featuresBody(
  layer: IngemmetLayer,
  ids: number[],
): URLSearchParams {
  return new URLSearchParams({
    objectIds: ids.join(","),
    outFields: layer.outFields.join(","),
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });
}

export function featuresUrl(layer: IngemmetLayer): string {
  return `${INGEMMET_BASE}/${layer.service}/MapServer/${layer.layerId}/query`;
}
