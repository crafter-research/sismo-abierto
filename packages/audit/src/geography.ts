import { classifyCountryPoint, classifyDepartmentPoint } from "@sismo/geo";

export interface RegionMatcher {
  key: string;
  label: string;
  kind: "peru-department" | "country" | "vague";
  departments?: string[];
  countryIds?: string[];
  boundaryMarginDeg?: number;
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
    countryIds: ["862"],
    bbox: { minLat: 0.6, maxLat: 12.2, minLon: -73.4, maxLon: -59.8 },
  },
  mexico: {
    key: "mexico",
    label: "México (país)",
    kind: "country",
    countryIds: ["484"],
    bbox: { minLat: 14.5, maxLat: 32.7, minLon: -118.4, maxLon: -86.7 },
  },
  panama: {
    key: "panama",
    label: "Panamá (país)",
    kind: "country",
    countryIds: ["591"],
    bbox: { minLat: 7.2, maxLat: 9.6, minLon: -83.05, maxLon: -77.2 },
  },
  japon: {
    key: "japon",
    label: "Japón (país)",
    kind: "country",
    countryIds: ["392"],
    bbox: { minLat: 24.0, maxLat: 45.6, minLon: 122.9, maxLon: 146.0 },
  },
  filipinas: {
    key: "filipinas",
    label: "Filipinas (país)",
    kind: "country",
    countryIds: ["608"],
    bbox: { minLat: 4.6, maxLat: 21.1, minLon: 116.9, maxLon: 126.6 },
  },
  indonesia: {
    key: "indonesia",
    label: "Indonesia (país)",
    kind: "country",
    countryIds: ["360"],
    bbox: { minLat: -11.0, maxLat: 6.1, minLon: 95.0, maxLon: 141.0 },
  },
  "indonesia-sumatra": {
    key: "indonesia-sumatra",
    label: "Indonesia (Sumatra)",
    kind: "country",
    countryIds: ["360"],
    bbox: { minLat: -6.2, maxLat: 6.2, minLon: 94.5, maxLon: 106.5 },
  },
  "indonesia-java-nusa": {
    key: "indonesia-java-nusa",
    label: "Indonesia (Java, Bali y Nusa Tenggara)",
    kind: "country",
    countryIds: ["360"],
    bbox: { minLat: -11.5, maxLat: -5.0, minLon: 105.0, maxLon: 125.0 },
  },
  "indonesia-kalimantan": {
    key: "indonesia-kalimantan",
    label: "Indonesia (Kalimantan)",
    kind: "country",
    countryIds: ["360"],
    bbox: { minLat: -4.5, maxLat: 4.5, minLon: 108.0, maxLon: 119.0 },
  },
  "indonesia-sulawesi": {
    key: "indonesia-sulawesi",
    label: "Indonesia (Sulawesi)",
    kind: "country",
    countryIds: ["360"],
    bbox: { minLat: -6.0, maxLat: 2.5, minLon: 118.0, maxLon: 125.5 },
  },
  "indonesia-maluku": {
    key: "indonesia-maluku",
    label: "Indonesia (Maluku)",
    kind: "country",
    countryIds: ["360"],
    bbox: { minLat: -9.0, maxLat: 2.5, minLon: 124.0, maxLon: 135.0 },
  },
  "indonesia-papua": {
    key: "indonesia-papua",
    label: "Indonesia (Papúa occidental)",
    kind: "country",
    countryIds: ["360"],
    bbox: { minLat: -10.0, maxLat: 1.5, minLon: 130.0, maxLon: 141.1 },
  },
  "nueva-zelanda": {
    key: "nueva-zelanda",
    label: "Nueva Zelanda (país)",
    kind: "country",
    countryIds: ["554"],
    bbox: { minLat: -47.3, maxLat: -34.4, minLon: 166.4, maxLon: 178.6 },
  },
  vanuatu: {
    key: "vanuatu",
    label: "Vanuatu (país)",
    kind: "country",
    countryIds: ["548"],
    bbox: { minLat: -20.3, maxLat: -13.1, minLon: 166.5, maxLon: 170.2 },
  },
  fiji: {
    key: "fiji",
    label: "Fiji (país)",
    kind: "country",
    countryIds: ["242"],
    bbox: { minLat: -19.2, maxLat: -15.7, minLon: 176.8, maxLon: 180.0 },
  },
  tonga: {
    key: "tonga",
    label: "Tonga (país)",
    kind: "country",
    countryIds: ["776"],
    bbox: { minLat: -22.4, maxLat: -15.5, minLon: -176.2, maxLon: -173.7 },
  },
  "papua-nueva-guinea": {
    key: "papua-nueva-guinea",
    label: "Papúa Nueva Guinea (país)",
    kind: "country",
    countryIds: ["598"],
    bbox: { minLat: -11.7, maxLat: -1.0, minLon: 140.8, maxLon: 155.9 },
  },
  "republica-dominicana": {
    key: "republica-dominicana",
    label: "República Dominicana (país)",
    kind: "country",
    countryIds: ["214"],
    bbox: { minLat: 17.5, maxLat: 19.9, minLon: -72.0, maxLon: -68.3 },
  },
  "puerto-rico": {
    key: "puerto-rico",
    label: "Puerto Rico y región sísmica inmediata",
    kind: "country",
    countryIds: ["630"],
    boundaryMarginDeg: 0.5,
    bbox: { minLat: 17.8, maxLat: 19.0, minLon: -67.5, maxLon: -65.2 },
  },
  "costa-rica": {
    key: "costa-rica",
    label: "Costa Rica (país)",
    kind: "country",
    countryIds: ["188"],
    bbox: { minLat: 8.0, maxLat: 11.2, minLon: -85.95, maxLon: -82.55 },
  },
  guatemala: {
    key: "guatemala",
    label: "Guatemala (país)",
    kind: "country",
    countryIds: ["320"],
    bbox: { minLat: 13.7, maxLat: 17.9, minLon: -92.3, maxLon: -88.1 },
  },
  nicaragua: {
    key: "nicaragua",
    label: "Nicaragua (país)",
    kind: "country",
    countryIds: ["558"],
    bbox: { minLat: 10.7, maxLat: 15.1, minLon: -87.7, maxLon: -82.5 },
  },
  china: {
    key: "china",
    label: "China (país)",
    kind: "country",
    countryIds: ["156"],
    bbox: { minLat: 18.0, maxLat: 53.6, minLon: 73.5, maxLon: 135.1 },
  },
  taiwan: {
    key: "taiwan",
    label: "Taiwán",
    kind: "country",
    countryIds: ["158"],
    bbox: { minLat: 21.8, maxLat: 25.4, minLon: 119.3, maxLon: 122.1 },
  },
  corea: {
    key: "corea",
    label: "Península de Corea",
    kind: "country",
    countryIds: ["408", "410"],
    bbox: { minLat: 33.0, maxLat: 43.1, minLon: 124.0, maxLon: 131.1 },
  },
  india: {
    key: "india",
    label: "India (país)",
    kind: "country",
    countryIds: ["356"],
    bbox: { minLat: 6.5, maxLat: 35.7, minLon: 68.0, maxLon: 97.4 },
  },
  afganistan: {
    key: "afganistan",
    label: "Afganistán (país)",
    kind: "country",
    countryIds: ["004"],
    bbox: { minLat: 29.4, maxLat: 38.5, minLon: 60.5, maxLon: 74.9 },
  },
  iran: {
    key: "iran",
    label: "Irán (país)",
    kind: "country",
    countryIds: ["364"],
    bbox: { minLat: 24.4, maxLat: 39.8, minLon: 44.0, maxLon: 63.3 },
  },
  grecia: {
    key: "grecia",
    label: "Grecia (país)",
    kind: "country",
    countryIds: ["300"],
    bbox: { minLat: 34.7, maxLat: 41.8, minLon: 19.4, maxLon: 28.3 },
  },
  turquia: {
    key: "turquia",
    label: "Turquía (país)",
    kind: "country",
    countryIds: ["792"],
    bbox: { minLat: 35.8, maxLat: 42.2, minLon: 25.6, maxLon: 44.9 },
  },
  alaska: {
    key: "alaska",
    label: "Alaska",
    kind: "country",
    countryIds: ["840"],
    bbox: { minLat: 51.2, maxLat: 71.5, minLon: -180.0, maxLon: -129.0 },
  },
  "rusia-oriental-este": {
    key: "rusia-oriental-este",
    label: "Rusia oriental (hemisferio este)",
    kind: "country",
    countryIds: ["643"],
    bbox: { minLat: 41.0, maxLat: 82.0, minLon: 129.0, maxLon: 180.0 },
  },
  "rusia-oriental-oeste": {
    key: "rusia-oriental-oeste",
    label: "Rusia oriental (cruce del meridiano 180°)",
    kind: "country",
    countryIds: ["643"],
    bbox: { minLat: 41.0, maxLat: 72.0, minLon: -180.0, maxLon: -169.0 },
  },
  "islas-sandwich": {
    key: "islas-sandwich",
    label: "Islas Sandwich del Sur",
    kind: "country",
    countryIds: ["239"],
    bbox: { minLat: -60.5, maxLat: -53.5, minLon: -30.0, maxLon: -24.0 },
  },
};

const INDONESIA_MATCHERS = [
  REGION_CATALOG["indonesia-sumatra"],
  REGION_CATALOG["indonesia-java-nusa"],
  REGION_CATALOG["indonesia-kalimantan"],
  REGION_CATALOG["indonesia-sulawesi"],
  REGION_CATALOG["indonesia-maluku"],
  REGION_CATALOG["indonesia-papua"],
] as RegionMatcher[];

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
    ...INDONESIA_MATCHERS,
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
    ...INDONESIA_MATCHERS,
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
  "Nueva Zelanda o islas Kermadec": [
    REGION_CATALOG["nueva-zelanda"] as RegionMatcher,
    vague(
      "islas-kermadec",
      "Islas Kermadec y zonas aledañas (sin límites definidos)",
    ),
  ],
  "Frontera Ecuador-Colombia": [
    vague(
      "frontera-ecuador-colombia",
      "Frontera Ecuador-Colombia (sin límites definidos)",
    ),
  ],
  "México o Guatemala": [
    REGION_CATALOG.mexico as RegionMatcher,
    REGION_CATALOG.guatemala as RegionMatcher,
  ],
  "Guatemala, Costa Rica, Nicaragua, Panamá e islas colindantes": [
    REGION_CATALOG.guatemala as RegionMatcher,
    REGION_CATALOG["costa-rica"] as RegionMatcher,
    REGION_CATALOG.nicaragua as RegionMatcher,
    REGION_CATALOG.panama as RegionMatcher,
    vague(
      "islas-colindantes-mexico",
      "Islas colindantes a Centroamérica (sin límites definidos)",
    ),
  ],
  "Costa Rica, Nicaragua, Panamá e islas colindantes": [
    REGION_CATALOG["costa-rica"] as RegionMatcher,
    REGION_CATALOG.nicaragua as RegionMatcher,
    REGION_CATALOG.panama as RegionMatcher,
    vague(
      "islas-colindantes-mexico",
      "Islas colindantes a Centroamérica (sin límites definidos)",
    ),
  ],
  "Guatemala, Costa Rica, Nicaragua e islas colindantes": [
    REGION_CATALOG.guatemala as RegionMatcher,
    REGION_CATALOG["costa-rica"] as RegionMatcher,
    REGION_CATALOG.nicaragua as RegionMatcher,
    vague(
      "islas-colindantes-mexico",
      "Islas colindantes a Centroamérica (sin límites definidos)",
    ),
  ],
  "China, Japón, Taiwán, Corea, India, Filipinas o Indonesia": [
    REGION_CATALOG.china as RegionMatcher,
    REGION_CATALOG.japon as RegionMatcher,
    REGION_CATALOG.taiwan as RegionMatcher,
    REGION_CATALOG.corea as RegionMatcher,
    REGION_CATALOG.india as RegionMatcher,
    REGION_CATALOG.filipinas as RegionMatcher,
    ...INDONESIA_MATCHERS,
  ],
  "Norte de Perú, sur de Ecuador, sur de Colombia y parte de Venezuela": [
    vague(
      "norte-peru-sur-ecuador-colombia-venezuela",
      "Norte de Perú, sur de Ecuador, sur de Colombia y parte de Venezuela (sin límites definidos)",
    ),
  ],
  "Cinco Stanes, Afganistán, Irán, Grecia o Turquía": [
    vague(
      "cinco-stanes",
      "Zona fronteriza de los cinco Stanes (sin límites definidos)",
    ),
    REGION_CATALOG.afganistan as RegionMatcher,
    REGION_CATALOG.iran as RegionMatcher,
    REGION_CATALOG.grecia as RegionMatcher,
    REGION_CATALOG.turquia as RegionMatcher,
  ],
  "Japón, Rusia oriental, Alaska y corredor Vancouver-Baja California": [
    REGION_CATALOG.japon as RegionMatcher,
    REGION_CATALOG["rusia-oriental-este"] as RegionMatcher,
    REGION_CATALOG["rusia-oriental-oeste"] as RegionMatcher,
    REGION_CATALOG.alaska as RegionMatcher,
    vague(
      "vancouver-baja-california",
      "Corredor Vancouver-frontera con Baja California (sin límites definidos)",
    ),
  ],
  "Centro y sur de Perú, Chile central y norte, frontera con Argentina": [
    vague(
      "centro-sur-peru-chile-argentina",
      "Centro y sur de Perú, Chile central y norte, frontera con Argentina (sin límites definidos)",
    ),
  ],
  "Nueva Zelanda, Fiji, Vanuatu, Tonga e islas aledañas": [
    REGION_CATALOG["nueva-zelanda"] as RegionMatcher,
    REGION_CATALOG.fiji as RegionMatcher,
    REGION_CATALOG.vanuatu as RegionMatcher,
    REGION_CATALOG.tonga as RegionMatcher,
    vague(
      "islas-aledanas-pacifico-sur",
      "Islas aledañas del Pacífico sur (sin límites definidos)",
    ),
  ],
  "Islas Sandwich, Indonesia o Papúa Nueva Guinea": [
    REGION_CATALOG["islas-sandwich"] as RegionMatcher,
    ...INDONESIA_MATCHERS,
    REGION_CATALOG["papua-nueva-guinea"] as RegionMatcher,
  ],
  "Pasaje de Drake, Islas Sandwich, Indonesia o Papúa Nueva Guinea": [
    vague("pasaje-de-drake", "Pasaje de Drake (sin límites definidos)"),
    REGION_CATALOG["islas-sandwich"] as RegionMatcher,
    ...INDONESIA_MATCHERS,
    REGION_CATALOG["papua-nueva-guinea"] as RegionMatcher,
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
  const insideBbox =
    latitude >= minLat &&
    latitude <= maxLat &&
    longitude >= minLon &&
    longitude <= maxLon;
  if (!insideBbox) return "outside";
  if (matcher.kind === "country" && matcher.countryIds) {
    return classifyCountryPoint(
      matcher.countryIds,
      longitude,
      latitude,
      matcher.boundaryMarginDeg ?? BOUNDARY_MARGIN_DEG,
    );
  }
  return "outside";
}

export const GEOGRAPHY_METHOD_NOTE =
  "Los departamentos del Perú se evalúan con punto-en-polígono sobre límites INEI simplificados y los países con límites Natural Earth de World Atlas. Un epicentro a menos de 0.25° (~25 km) del límite, hacia adentro o hacia afuera, se trata como coincidencia de frontera y no cuenta como acierto estricto. Las cajas geográficas solo reducen el área de consulta. Las expresiones territoriales vagas del texto original no reciben una frontera inventada.";
