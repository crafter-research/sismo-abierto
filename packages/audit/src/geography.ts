import { classifyDepartmentPoint } from "@sismo/geo";

export interface RegionMatcher {
  key: string;
  label: string;
  kind: "peru-department" | "country" | "vague";
  departments?: string[];
  bbox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } | null;
}

const BOUNDARY_MARGIN_DEG = 0.25;

const REGION_CATALOG: Record<string, RegionMatcher> = {
  ica: {
    key: "ica",
    departments: ["Ica"],
    label: "Ica (departamento)",
    kind: "peru-department",
    bbox: { minLat: -15.7, maxLat: -12.9, minLon: -76.6, maxLon: -74.6 },
  },
  "lima-callao": {
    key: "lima-callao",
    departments: ["Lima", "Callao"],
    label: "Lima y Callao (departamentos)",
    kind: "peru-department",
    bbox: { minLat: -13.6, maxLat: -10.2, minLon: -78.0, maxLon: -75.4 },
  },
  tumbes: {
    key: "tumbes",
    departments: ["Tumbes"],
    label: "Tumbes (departamento)",
    kind: "peru-department",
    bbox: { minLat: -4.3, maxLat: -3.4, minLon: -81.1, maxLon: -80.1 },
  },
  piura: {
    key: "piura",
    departments: ["Piura"],
    label: "Piura (departamento)",
    kind: "peru-department",
    bbox: { minLat: -6.6, maxLat: -4.0, minLon: -81.4, maxLon: -79.1 },
  },
  loreto: {
    key: "loreto",
    departments: ["Loreto"],
    label: "Loreto (departamento)",
    kind: "peru-department",
    bbox: { minLat: -8.7, maxLat: -0.03, minLon: -77.9, maxLon: -69.9 },
  },
  "la-libertad": {
    key: "la-libertad",
    departments: ["La Libertad"],
    label: "La Libertad (departamento)",
    kind: "peru-department",
    bbox: { minLat: -8.99, maxLat: -6.9, minLon: -79.7, maxLon: -76.8 },
  },
  ancash: {
    key: "ancash",
    departments: ["Ancash"],
    label: "Áncash (departamento)",
    kind: "peru-department",
    bbox: { minLat: -10.8, maxLat: -8.0, minLon: -78.7, maxLon: -76.7 },
  },
  arequipa: {
    key: "arequipa",
    departments: ["Arequipa"],
    label: "Arequipa (departamento)",
    kind: "peru-department",
    bbox: { minLat: -17.3, maxLat: -14.6, minLon: -75.1, maxLon: -70.8 },
  },
  tacna: {
    key: "tacna",
    departments: ["Tacna"],
    label: "Tacna (departamento)",
    kind: "peru-department",
    bbox: { minLat: -18.35, maxLat: -16.9, minLon: -71.2, maxLon: -69.5 },
  },
  venezuela: {
    key: "venezuela",
    label: "Venezuela (país)",
    kind: "country",
    bbox: { minLat: 0.6, maxLat: 12.2, minLon: -73.4, maxLon: -59.8 },
  },
  mexico: {
    key: "mexico",
    label: "México (país)",
    kind: "country",
    bbox: { minLat: 14.5, maxLat: 32.7, minLon: -118.4, maxLon: -86.7 },
  },
  panama: {
    key: "panama",
    label: "Panamá (país)",
    kind: "country",
    bbox: { minLat: 7.2, maxLat: 9.6, minLon: -83.05, maxLon: -77.2 },
  },
  japon: {
    key: "japon",
    label: "Japón (país)",
    kind: "country",
    bbox: { minLat: 24.0, maxLat: 45.6, minLon: 122.9, maxLon: 146.0 },
  },
  filipinas: {
    key: "filipinas",
    label: "Filipinas (país)",
    kind: "country",
    bbox: { minLat: 4.6, maxLat: 21.1, minLon: 116.9, maxLon: 126.6 },
  },
  indonesia: {
    key: "indonesia",
    label: "Indonesia (país)",
    kind: "country",
    bbox: { minLat: -11.0, maxLat: 6.1, minLon: 95.0, maxLon: 141.0 },
  },
  "nueva-zelanda": {
    key: "nueva-zelanda",
    label: "Nueva Zelanda (país)",
    kind: "country",
    bbox: { minLat: -47.3, maxLat: -34.4, minLon: 166.4, maxLon: 178.6 },
  },
  vanuatu: {
    key: "vanuatu",
    label: "Vanuatu (país)",
    kind: "country",
    bbox: { minLat: -20.3, maxLat: -13.1, minLon: 166.5, maxLon: 170.2 },
  },
  fiji: {
    key: "fiji",
    label: "Fiji (país)",
    kind: "country",
    bbox: { minLat: -19.2, maxLat: -15.7, minLon: 176.8, maxLon: 180.0 },
  },
  tonga: {
    key: "tonga",
    label: "Tonga (país)",
    kind: "country",
    bbox: { minLat: -22.4, maxLat: -15.5, minLon: -176.2, maxLon: -173.7 },
  },
  "papua-nueva-guinea": {
    key: "papua-nueva-guinea",
    label: "Papúa Nueva Guinea (país)",
    kind: "country",
    bbox: { minLat: -11.7, maxLat: -1.0, minLon: 140.8, maxLon: 155.9 },
  },
  "republica-dominicana": {
    key: "republica-dominicana",
    label: "República Dominicana (país)",
    kind: "country",
    bbox: { minLat: 17.5, maxLat: 19.9, minLon: -72.0, maxLon: -68.3 },
  },
  "puerto-rico": {
    key: "puerto-rico",
    label: "Puerto Rico (territorio)",
    kind: "country",
    bbox: { minLat: 17.9, maxLat: 18.5, minLon: -67.3, maxLon: -65.2 },
  },
  "costa-rica": {
    key: "costa-rica",
    label: "Costa Rica (país)",
    kind: "country",
    bbox: { minLat: 8.0, maxLat: 11.2, minLon: -85.95, maxLon: -82.55 },
  },
};

function vague(key: string, label: string): RegionMatcher {
  return { key, label, kind: "vague", bbox: null };
}

export interface TargetMapping {
  targetText: string;
  matchers: RegionMatcher[];
}

export const TARGET_MAPPINGS: Record<string, RegionMatcher[]> = {
  Ica: [REGION_CATALOG.ica as RegionMatcher],
  "Lima-Callao": [REGION_CATALOG["lima-callao"] as RegionMatcher],
  "Chile central y frontera con Argentina": [
    vague(
      "chile-central",
      "Chile central y frontera con Argentina (sin límites definidos)",
    ),
  ],
  "Perú central": [
    vague("peru-central", "Perú central (sin límites definidos)"),
  ],
  "Tumbes o Piura, incluyendo Loreto": [
    REGION_CATALOG.tumbes as RegionMatcher,
    REGION_CATALOG.piura as RegionMatcher,
    REGION_CATALOG.loreto as RegionMatcher,
  ],
  "La Libertad o Áncash": [
    REGION_CATALOG["la-libertad"] as RegionMatcher,
    REGION_CATALOG.ancash as RegionMatcher,
  ],
  "Norte de Colombia o Venezuela": [
    vague("norte-de-colombia", "Norte de Colombia (sin límites definidos)"),
    REGION_CATALOG.venezuela as RegionMatcher,
  ],
  "norte de Perú y sur de Ecuador": [
    vague(
      "norte-peru-sur-ecuador",
      "Norte de Perú y sur de Ecuador (sin límites definidos)",
    ),
  ],
  "México o Panamá e islas del Caribe": [
    REGION_CATALOG.mexico as RegionMatcher,
    REGION_CATALOG.panama as RegionMatcher,
    vague("islas-del-caribe", "Islas del Caribe (sin límites definidos)"),
  ],
  "Japón, Filipinas o Indonesia": [
    REGION_CATALOG.japon as RegionMatcher,
    REGION_CATALOG.filipinas as RegionMatcher,
    REGION_CATALOG.indonesia as RegionMatcher,
  ],
  "Arequipa-Tacna": [
    REGION_CATALOG.arequipa as RegionMatcher,
    REGION_CATALOG.tacna as RegionMatcher,
  ],
  "frontera Cusco-Puno": [
    vague(
      "frontera-cusco-puno",
      "Frontera Cusco-Puno (zona limítrofe sin límites definidos)",
    ),
  ],
  "norte de Chile": [
    vague("norte-de-chile", "Norte de Chile (sin límites definidos)"),
  ],
  "Norte de Chile y sur de Perú": [
    vague(
      "norte-chile-sur-peru",
      "Norte de Chile y sur de Perú (sin límites definidos)",
    ),
  ],
  "Nueva Zelanda, Vanuatu, Fiji o Tonga": [
    REGION_CATALOG["nueva-zelanda"] as RegionMatcher,
    REGION_CATALOG.vanuatu as RegionMatcher,
    REGION_CATALOG.fiji as RegionMatcher,
    REGION_CATALOG.tonga as RegionMatcher,
  ],
  "Filipinas, Indonesia o Papúa Nueva Guinea": [
    REGION_CATALOG.filipinas as RegionMatcher,
    REGION_CATALOG.indonesia as RegionMatcher,
    REGION_CATALOG["papua-nueva-guinea"] as RegionMatcher,
  ],
  "Norte de Venezuela o norte de Colombia": [
    vague("norte-venezuela", "Norte de Venezuela (sin límites definidos)"),
    vague("norte-de-colombia", "Norte de Colombia (sin límites definidos)"),
  ],
  "República Dominicana o Puerto Rico": [
    REGION_CATALOG["republica-dominicana"] as RegionMatcher,
    REGION_CATALOG["puerto-rico"] as RegionMatcher,
  ],
  "Panamá o Costa Rica": [
    REGION_CATALOG.panama as RegionMatcher,
    REGION_CATALOG["costa-rica"] as RegionMatcher,
  ],
};

export function matchersForTarget(targetText: string): RegionMatcher[] {
  const matchers = TARGET_MAPPINGS[targetText];
  if (!matchers) {
    return [
      vague(
        `sin-mapa-${targetText}`,
        `${targetText} (destino sin mapeo congelado)`,
      ),
    ];
  }
  return matchers;
}

export type GeoMatch = "inside" | "boundary" | "outside" | "vague";

export function matchRegion(
  matcher: RegionMatcher,
  latitude: number,
  longitude: number,
): GeoMatch {
  if (matcher.kind === "vague" || !matcher.bbox) return "vague";
  if (matcher.kind === "peru-department" && matcher.departments) {
    return classifyDepartmentPoint(
      matcher.departments,
      longitude,
      latitude,
      BOUNDARY_MARGIN_DEG,
    );
  }
  const { minLat, maxLat, minLon, maxLon } = matcher.bbox;
  const inside =
    latitude >= minLat &&
    latitude <= maxLat &&
    longitude >= minLon &&
    longitude <= maxLon;
  if (!inside) return "outside";
  const nearBoundary =
    latitude - minLat < BOUNDARY_MARGIN_DEG ||
    maxLat - latitude < BOUNDARY_MARGIN_DEG ||
    longitude - minLon < BOUNDARY_MARGIN_DEG ||
    maxLon - longitude < BOUNDARY_MARGIN_DEG;
  return nearBoundary ? "boundary" : "inside";
}

export const GEOGRAPHY_METHOD_NOTE =
  "Los departamentos del Perú se evalúan con punto-en-polígono sobre límites INEI simplificados; un epicentro a menos de 0.25° (~25 km) del límite, hacia adentro o hacia afuera, se trata como coincidencia de frontera y no cuenta como acierto estricto. Los países se aproximan con cajas geográficas documentadas en el código, con el mismo margen de frontera. Las expresiones territoriales vagas del texto original no reciben una frontera inventada.";
