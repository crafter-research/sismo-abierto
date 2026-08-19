import type { SourceId } from "@sismo/contracts";

export interface ProbeConfig {
  sourceId: SourceId;
  url: string;
  method: "GET" | "POST";
  body?: string;
  timeoutMs: number;
  latencyDegradedMs: number;
  frequencyMinutes: number;
  expectedContentTypes: string[];
  kind:
    | "geojson-features"
    | "xlsx"
    | "aceldat-reports"
    | "dspace"
    | "usgs"
    | "sgc";
  contract: import("./external-contracts.ts").ExternalContract;
  freshnessKnown: boolean;
}

function censisProbeUrl(): string {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 2 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return `https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=${start}&fechaFin=${end}&minimaMagnitud=1.0&maximaMagnitud=9.0&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382`;
}

function sgcProbeUrl(): string {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    startdate: `${start}T00:00:00`,
    enddate: `${end}T23:59:59`,
  });
  return `https://api.sgc.gov.co/biweekly/biweekly_earthquakes?${params.toString()}`;
}

export function isSgcSourceEnabled(): boolean {
  return (
    process.env.SISMO_SGC_PROVIDER === "true" || process.env.NODE_ENV === "test"
  );
}

export function buildProbeConfigs(): ProbeConfig[] {
  const configs: ProbeConfig[] = [
    {
      sourceId: "igp-arcgis-ultimo-sismo",
      contract: "arcgis-latest",
      url: "https://ide.igp.gob.pe/arcgis/rest/services/monitoreocensis/UltimoSismo/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson",
      method: "GET",
      timeoutMs: 10_000,
      latencyDegradedMs: 4_000,
      frequencyMinutes: 10,
      expectedContentTypes: ["json"],
      kind: "geojson-features",
      freshnessKnown: true,
    },
    {
      sourceId: "igp-wfs-ultimo-sismo",
      contract: "wfs-latest",
      url: "https://ide.igp.gob.pe/geoserver/CTS_ultimosismo/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=CTS_ultimosismo%3Aultimo_sismo&outputFormat=application%2Fjson",
      method: "GET",
      timeoutMs: 10_000,
      latencyDegradedMs: 4_000,
      frequencyMinutes: 30,
      expectedContentTypes: ["json"],
      kind: "geojson-features",
      freshnessKnown: true,
    },
    {
      sourceId: "igp-wfs-zonificacion",
      contract: "wfs-zonificacion",
      url: "https://ide.igp.gob.pe/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=ZonificacionSismica%3Azonificacion_sismica&outputFormat=application%2Fjson&count=1",
      method: "GET",
      timeoutMs: 15_000,
      latencyDegradedMs: 6_000,
      frequencyMinutes: 1_440,
      expectedContentTypes: ["json"],
      kind: "geojson-features",
      freshnessKnown: false,
    },
    {
      sourceId: "igp-censis-catalogo",
      contract: "censis-xlsx",
      url: censisProbeUrl(),
      method: "GET",
      timeoutMs: 30_000,
      latencyDegradedMs: 10_000,
      frequencyMinutes: 60,
      expectedContentTypes: ["spreadsheet", "octet-stream", "sheet"],
      kind: "xlsx",
      freshnessKnown: true,
    },
    {
      sourceId: "igp-aceldat",
      contract: "aceldat-reports",
      url: "https://www.igp.gob.pe/servicios/api-acelerometrica/ran/reportes2",
      method: "POST",
      body: "{}",
      timeoutMs: 15_000,
      latencyDegradedMs: 8_000,
      frequencyMinutes: 30,
      expectedContentTypes: ["json"],
      kind: "aceldat-reports",
      freshnessKnown: true,
    },
    {
      sourceId: "igp-wfs-volcanes",
      contract: "volcanoes",
      url: "https://ide.igp.gob.pe/geoserver/CTS_alertavolcan/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=CTS_alertavolcan%3AActividad_volcanica&outputFormat=application%2Fjson",
      method: "GET",
      timeoutMs: 15_000,
      latencyDegradedMs: 5_000,
      frequencyMinutes: 60,
      expectedContentTypes: ["json"],
      kind: "geojson-features",
      freshnessKnown: false,
    },
    {
      sourceId: "igp-wfs-instrumental",
      contract: "instrumental",
      url: "https://ide.igp.gob.pe/geoserver/CTS_sismoinstrumental/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=CTS_sismoinstrumental%3Acatalogo_instrumental&count=1&outputFormat=application%2Fjson",
      method: "GET",
      timeoutMs: 15_000,
      latencyDegradedMs: 5_000,
      frequencyMinutes: 720,
      expectedContentTypes: ["json"],
      kind: "geojson-features",
      freshnessKnown: true,
    },
    {
      sourceId: "igp-regen",
      contract: "dspace",
      url: "https://repositorio.igp.gob.pe/server/api/discover/search/objects?size=1&sort=dc.date.issued,DESC",
      method: "GET",
      timeoutMs: 20_000,
      latencyDegradedMs: 8_000,
      frequencyMinutes: 720,
      expectedContentTypes: ["json"],
      kind: "dspace",
      freshnessKnown: true,
    },
    {
      sourceId: "usgs-fdsn",
      contract: "usgs",
      url: `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)}&minmagnitude=5`,
      method: "GET",
      timeoutMs: 20_000,
      latencyDegradedMs: 10_000,
      frequencyMinutes: 120,
      expectedContentTypes: ["json"],
      kind: "usgs",
      freshnessKnown: true,
    },
  ];
  if (isSgcSourceEnabled()) {
    configs.push({
      sourceId: "sgc-sismos",
      contract: "sgc-biweekly",
      url: sgcProbeUrl(),
      method: "GET",
      timeoutMs: 20_000,
      latencyDegradedMs: 8_000,
      frequencyMinutes: 10,
      expectedContentTypes: ["json"],
      kind: "sgc",
      freshnessKnown: false,
    });
  }
  return configs;
}
