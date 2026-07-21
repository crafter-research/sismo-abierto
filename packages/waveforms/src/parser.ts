import type { WaveformHeader } from "@sismo/contracts";

export class WaveformParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WaveformParseError";
  }
}

export interface ParsedWaveform {
  header: WaveformHeader;
  components: { z: number[]; n: number[]; e: number[] };
}

function requireMatch(text: string, pattern: RegExp, label: string): string {
  const match = text.match(pattern);
  if (!match?.[1]) {
    throw new WaveformParseError(
      `No se encontró "${label}" en el archivo ACELDAT`,
    );
  }
  return match[1].trim();
}

function requireNumber(text: string, pattern: RegExp, label: string): number {
  const value = Number(requireMatch(text, pattern, label));
  if (Number.isNaN(value)) {
    throw new WaveformParseError(`"${label}" no es numérico`);
  }
  return value;
}

export function parseAceldatFile(text: string): ParsedWaveform {
  if (!text.includes("INSTITUTO GEOFISICO DEL PERU")) {
    throw new WaveformParseError(
      "El archivo no tiene el encabezado institucional esperado",
    );
  }

  const stationSection = text.slice(0, text.indexOf("2. SISMO"));
  const eventSection = text.slice(
    text.indexOf("2. SISMO"),
    text.indexOf("3. REGISTRO"),
  );
  const recordSectionStart = text.indexOf("3. REGISTRO");
  if (recordSectionStart === -1) {
    throw new WaveformParseError("Falta la sección 3. REGISTRO DE ACELERACION");
  }
  const recordSection = text.slice(recordSectionStart);

  const pgaLine = requireMatch(recordSection, /PGA\s*:\s*(.+)/, "PGA");
  const pgaParts = pgaLine.split(/\s+/).map(Number);
  if (pgaParts.length < 3 || pgaParts.some((value) => Number.isNaN(value))) {
    throw new WaveformParseError(`Línea PGA ilegible: "${pgaLine}"`);
  }

  const header: WaveformHeader = {
    stationName: requireMatch(stationSection, /NOMBRE\s*:\s*(.+)/, "NOMBRE"),
    stationCode: requireMatch(stationSection, /CODIGO\s*:\s*(.+)/, "CODIGO"),
    stationLatitude: requireNumber(
      stationSection,
      /LATITUD\s*:\s*(-?[\d.]+)/,
      "LATITUD estación",
    ),
    stationLongitude: requireNumber(
      stationSection,
      /LONGITUD\s*:\s*(-?[\d.]+)/,
      "LONGITUD estación",
    ),
    eventDateLocal: requireMatch(
      eventSection,
      /FECHA LOCAL\s*:\s*(.+)/,
      "FECHA LOCAL",
    ),
    eventTimeLocal: requireMatch(
      eventSection,
      /HORA LOCAL\s*:\s*(.+)/,
      "HORA LOCAL",
    ),
    eventLatitude: requireNumber(
      eventSection,
      /LATITUD\s*:\s*(-?[\d.]+)/,
      "LATITUD sismo",
    ),
    eventLongitude: requireNumber(
      eventSection,
      /LONGITUD\s*:\s*(-?[\d.]+)/,
      "LONGITUD sismo",
    ),
    eventDepthKm: requireNumber(
      eventSection,
      /PROFUNDIDAD\s*:\s*([\d.]+)/,
      "PROFUNDIDAD",
    ),
    eventMagnitude: requireNumber(
      eventSection,
      /MAGNITUD\s*:\s*M?([\d.]+)/,
      "MAGNITUD",
    ),
    epicentralDistanceKm: requireNumber(
      eventSection,
      /DIST\. EPICENTRAL\s*:\s*([\d.]+)/,
      "DIST. EPICENTRAL",
    ),
    startTimeUtc: requireMatch(
      recordSection,
      /TIEMPO DE INICIO\s*:\s*(.+)/,
      "TIEMPO DE INICIO",
    ),
    sampleCount: requireNumber(
      recordSection,
      /NUMERO DE MUESTRAS\s*:\s*(\d+)/,
      "NUMERO DE MUESTRAS",
    ),
    sampleRateHz: requireNumber(
      recordSection,
      /MUESTREO\s*:\s*([\d.]+)/,
      "MUESTREO",
    ),
    units: requireMatch(recordSection, /UNIDADES\s*:\s*(.+)/, "UNIDADES"),
    baselineCorrected: /CORRECCION POR LINEA BASE\s*:\s*Si/i.test(
      recordSection,
    ),
    pga: {
      z: pgaParts[0] as number,
      n: pgaParts[1] as number,
      e: pgaParts[2] as number,
    },
  };

  const dataHeaderIndex = recordSection.search(
    /^[ \t]*Z[ \t]+N[ \t]+E[ \t]*$/m,
  );
  if (dataHeaderIndex === -1) {
    throw new WaveformParseError(
      "No se encontró la cabecera de columnas Z N E",
    );
  }
  const dataText = recordSection.slice(dataHeaderIndex);
  const z: number[] = [];
  const n: number[] = [];
  const e: number[] = [];
  const lines = dataText.split("\n").slice(1);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length !== 3) {
      throw new WaveformParseError(
        `Línea de datos ilegible: "${trimmed.slice(0, 60)}"`,
      );
    }
    const [zv, nv, ev] = parts.map(Number);
    if (Number.isNaN(zv) || Number.isNaN(nv) || Number.isNaN(ev)) {
      throw new WaveformParseError(
        `Valores no numéricos en línea: "${trimmed.slice(0, 60)}"`,
      );
    }
    z.push(zv as number);
    n.push(nv as number);
    e.push(ev as number);
  }
  if (z.length === 0) {
    throw new WaveformParseError("El archivo no contiene muestras");
  }

  return { header, components: { z, n, e } };
}
