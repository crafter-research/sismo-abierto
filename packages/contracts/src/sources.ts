import type { SourceRef } from "./provenance.ts";

export const SOURCES = {
  "igp-arcgis-ultimo-sismo": {
    id: "igp-arcgis-ultimo-sismo",
    name: "IGP · IDE ArcGIS · Último sismo",
    url: "https://ide.igp.gob.pe/arcgis/rest/services/monitoreocensis/UltimoSismo/MapServer",
  },
  "igp-wfs-ultimo-sismo": {
    id: "igp-wfs-ultimo-sismo",
    name: "IGP · IDE GeoServer WFS · Último sismo",
    url: "https://ide.igp.gob.pe/geoserver/CTS_ultimosismo/ows",
  },
  "igp-censis-catalogo": {
    id: "igp-censis-catalogo",
    name: "IGP · CENSIS · Catálogo sísmico (XLSX)",
    url: "https://censis.igp.gob.pe/repositorio/datos-sismicos",
  },
  "igp-wfs-instrumental": {
    id: "igp-wfs-instrumental",
    name: "IGP · IDE GeoServer WFS · Catálogo instrumental (histórico, hasta 2024)",
    url: "https://ide.igp.gob.pe/geoserver/CTS_sismoinstrumental/wfs",
  },
  "igp-aceldat": {
    id: "igp-aceldat",
    name: "IGP · ACELDAT-PERÚ · Red Acelerométrica Nacional",
    url: "https://www.igp.gob.pe/servicios/aceldat-peru/reportes-registros-acelerometricos",
  },
  "igp-wfs-volcanes": {
    id: "igp-wfs-volcanes",
    name: "IGP · IDE GeoServer WFS · Actividad volcánica",
    url: "https://ide.igp.gob.pe/geoserver/CTS_alertavolcan/ows",
  },
  "igp-regen": {
    id: "igp-regen",
    name: "IGP · REGEN · Repositorio Geofísico Nacional (DSpace)",
    url: "https://repositorio.igp.gob.pe/",
  },
  "usgs-fdsn": {
    id: "usgs-fdsn",
    name: "USGS · FDSN Event API (contraste global)",
    url: "https://earthquake.usgs.gov/fdsnws/event/1/",
  },
  "sgc-sismos": {
    id: "sgc-sismos",
    name: "SGC · Servicio Geológico Colombiano · Sismos",
    url: "https://www.sgc.gov.co/sismos",
  },
} as const satisfies Record<string, SourceRef>;

export type SourceId = keyof typeof SOURCES;

export const SOURCE_IDS = Object.keys(SOURCES) as SourceId[];

export function sourceRef(id: SourceId): SourceRef {
  return SOURCES[id];
}
