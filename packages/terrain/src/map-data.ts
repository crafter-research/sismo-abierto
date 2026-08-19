import snapshot from "../data/zonificacion-sismica.json";
import { TERRAIN_PROVENANCE } from "./zonification.ts";

/** Familia de suelo S1–S4 derivada de la etiqueta larga del IGP. */
export type SoilClass = "S1" | "S2" | "S3" | "S4" | "amplificacion" | "otro";

export function soilClassOf(zone: string): SoilClass {
  const match = zone.match(/Suelo Tipo\s+(S[1-4])/i);
  if (match?.[1]) return match[1].toUpperCase() as SoilClass;
  // La capa nombra dos condiciones fuera de la escala S1-S4: roca, que es el
  // extremo rígido, y zonas de amplificación alta, que el estudio marca como
  // el caso más desfavorable. Ninguna es "sin clasificar".
  if (/^roca$/i.test(zone.trim())) return "S1";
  if (/amplificaci/i.test(zone)) return "amplificacion";
  return "otro";
}

/**
 * Paleta del mapa oficial: de suelo rígido a suelo flexible.
 *
 * El color ordena rigidez y período de vibración, no peligro. Un suelo
 * flexible no significa que una construcción vaya a fallar, y la leyenda
 * nombra el criterio real para que el color no se lea como alarma.
 *
 * Los valores están muestreados de la leyenda del mapa oficial de riesgo
 * sísmico de Lima (UNI/CISMID, 2021), exportado desde ArcMap. Se toma su
 * rampa verde→rojo por continuidad visual con la cartografía peruana, pero
 * **rotula tipo de suelo, no nivel de daño**: aquel mapa clasifica daño
 * esperado a edificaciones (I sin daño … V colapso) y esta capa clasifica
 * respuesta del terreno (S1 rígido … S4 flexible). Son variables distintas.
 */
export const SOIL_COLORS: Record<SoilClass, string> = {
  S1: "#38A800",
  S2: "#55FF00",
  S3: "#FFBF00",
  S4: "#FF0000",
  amplificacion: "#FFFF69",
  otro: "#868e96",
};

export const SOIL_LEGEND: { soil: SoilClass; label: string }[] = [
  { soil: "S1", label: "S1 · Rígido o roca" },
  { soil: "S2", label: "S2 · Medianamente rígido" },
  { soil: "S3", label: "S3 · Blando" },
  { soil: "S4", label: "S4 · Excepcionalmente flexible" },
  { soil: "amplificacion", label: "Amplificación > 2.5 veces" },
  { soil: "otro", label: "Otras condiciones descritas" },
];

const COORDINATE_DECIMALS = 5;

function roundCoordinates(input: unknown): unknown {
  if (Array.isArray(input) && typeof input[0] === "number") {
    return (input as number[])
      .slice(0, 2)
      .map((value) => Number(value.toFixed(COORDINATE_DECIMALS)));
  }
  return (input as unknown[]).map(roundCoordinates);
}

/**
 * GeoJSON listo para el cliente: coordenadas a ~1 m y sin campos derivados
 * del GIS de origen, lo que baja la capa de 3.7MB a menos de 600KB con gzip.
 */
export function buildMapCollection() {
  const features = (
    snapshot as {
      features: {
        geometry: { type: string; coordinates: unknown } | null;
        properties: Record<string, unknown>;
      }[];
    }
  ).features
    .filter((feature) => feature.geometry)
    .map((feature, index) => {
      const zone = String(feature.properties.zona ?? "");
      return {
        type: "Feature" as const,
        id: index,
        geometry: {
          type: feature.geometry?.type,
          coordinates: roundCoordinates(feature.geometry?.coordinates),
        },
        properties: {
          ciudad: feature.properties.ciudad ?? "",
          departamento: feature.properties.departamento ?? "",
          zona: zone,
          suelo: soilClassOf(zone),
        },
      };
    });

  return {
    type: "FeatureCollection" as const,
    capturedAt: TERRAIN_PROVENANCE.capturedAt,
    sourceUrl: TERRAIN_PROVENANCE.sourceUrl,
    features,
  };
}
