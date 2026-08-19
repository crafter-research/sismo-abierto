import { ZONIFICACION_TYPE_NAME, ZONIFICACION_WFS_URL } from "./constants.ts";

export function buildZonificacionRequestUrl(): string {
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: ZONIFICACION_TYPE_NAME,
    outputFormat: "application/json",
  });
  return `${ZONIFICACION_WFS_URL}?${params.toString()}`;
}
