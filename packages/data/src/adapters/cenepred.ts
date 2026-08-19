import { officialProvenance, type Provenance, SOURCES } from "@sismo/contracts";
import { SourceError } from "../errors.ts";
import { fetchJson } from "../http.ts";
import { nowLimaIso } from "../lima-time.ts";

export const CENEPRED_MAPSERVER =
  "https://sig.cenepred.gob.pe/arcgis_server/rest/services/sigrid/Cartografia_Peligros/MapServer";

/** Microzonificación sísmica del CISMID publicada en SIGRID: Lima con detalle urbano. */
export const CENEPRED_CISMID_LAYER = 5030402;

/** El servicio valida el token contra este origen exacto. */
export const CENEPRED_REFERER = "https://sigrid.cenepred.gob.pe/";

export interface CenepredZone {
  department: string;
  province: string;
  district: string;
  zoneId: string | null;
  zoneDescription: string | null;
  study: string | null;
}

/**
 * El provider está apagado salvo que exista un token institucional.
 *
 * SIGRID no publica licencia ni términos de uso: ni en el visor, ni en el sitio
 * de CENEPRED, ni en su portal de transparencia. El visor emite un token
 * server-side atado al header Referer, así que la capa es técnicamente
 * alcanzable sin credenciales, pero ausencia de licencia no es permiso. Este
 * adaptador solo se activa con un token entregado por la institución.
 */
export function isCenepredProviderEnabled(): boolean {
  return Boolean(process.env.SISMO_CENEPRED_TOKEN);
}

export function assertCenepredProviderEnabled(): void {
  if (isCenepredProviderEnabled()) return;
  throw new SourceError({
    kind: "disabled",
    sourceId: "cenepred-sigrid",
    message:
      "El provider CENEPRED está implementado pero deshabilitado: SIGRID no publica licencia de reutilización y la capa requiere un token institucional.",
  });
}

function requireToken(): string {
  assertCenepredProviderEnabled();
  const token = process.env.SISMO_CENEPRED_TOKEN;
  if (!token) {
    throw new SourceError({
      kind: "disabled",
      sourceId: "cenepred-sigrid",
      message: "SISMO_CENEPRED_TOKEN vacío",
    });
  }
  return token;
}

interface EsriQueryResponse {
  features?: { attributes: Record<string, unknown> }[];
  count?: number;
  error?: { code: number; message: string };
}

function assertNoEsriError(payload: EsriQueryResponse): void {
  if (!payload.error) return;
  const { code, message } = payload.error;
  throw new SourceError({
    kind: code === 499 || code === 498 ? "disabled" : "invalid",
    sourceId: "cenepred-sigrid",
    message:
      code === 498
        ? "El token de CENEPRED expiró o no corresponde al origen autorizado"
        : `SIGRID respondió ${code}: ${message}`,
  });
}

async function query(
  params: Record<string, string>,
): Promise<EsriQueryResponse> {
  const search = new URLSearchParams({
    f: "json",
    token: requireToken(),
    ...params,
  });
  const payload = await fetchJson<EsriQueryResponse>(
    `${CENEPRED_MAPSERVER}/${CENEPRED_CISMID_LAYER}/query?${search.toString()}`,
    {
      sourceId: "cenepred-sigrid",
      headers: { Referer: CENEPRED_REFERER },
      timeoutMs: 20_000,
    },
  );
  assertNoEsriError(payload);
  return payload;
}

/** Cuántos polígonos publica la capa. Sirve como sonda de contrato. */
export async function fetchCenepredZoneCount(): Promise<number> {
  const payload = await query({ where: "1=1", returnCountOnly: "true" });
  if (typeof payload.count !== "number") {
    throw new SourceError({
      kind: "schema",
      sourceId: "cenepred-sigrid",
      message: "La respuesta de conteo no trae `count`",
    });
  }
  return payload.count;
}

export async function fetchCenepredZones(
  district?: string,
): Promise<{ zones: CenepredZone[]; provenance: Provenance }> {
  const payload = await query({
    where: district ? `distrito='${district.replace(/'/g, "''")}'` : "1=1",
    outFields: "departamen,provincia,distrito,id_zona,desc_zona,elaborac",
    returnGeometry: "false",
  });
  const zones = (payload.features ?? []).map((feature) => ({
    department: String(feature.attributes.departamen ?? ""),
    province: String(feature.attributes.provincia ?? ""),
    district: String(feature.attributes.distrito ?? ""),
    zoneId: feature.attributes.id_zona
      ? String(feature.attributes.id_zona)
      : null,
    zoneDescription: feature.attributes.desc_zona
      ? String(feature.attributes.desc_zona)
      : null,
    study: feature.attributes.elaborac
      ? String(feature.attributes.elaborac)
      : null,
  }));
  return {
    zones,
    provenance: officialProvenance(SOURCES["cenepred-sigrid"], nowLimaIso(), {
      freshness: "FRESHNESS_UNKNOWN",
      note: "SIGRID no publica fecha de actualización por registro ni licencia de reutilización.",
    }),
  };
}
