import { LimaRiskStore } from "@sismo/terrain";

export const dynamic = "force-dynamic";

/**
 * Busca una dirección de Lima y devuelve el riesgo sísmico de esa manzana.
 *
 * El geocoding va contra Nominatim (OpenStreetMap), que es abierto y no pide
 * credenciales. Se hace del lado del servidor por tres razones: su política de
 * uso exige un User-Agent identificable, pide no más de una consulta por
 * segundo, y así la respuesta se puede cachear para todos los visitantes en
 * vez de que cada navegador repita la misma búsqueda.
 *
 * `snapMeters: 120` no es arbitrario. Un geocoder devuelve el centro de la
 * calle, y las calles son exactamente los huecos entre manzanas: medido contra
 * Nominatim con cuatro direcciones reales de Lima, tres caían a 2, 13 y 90 m
 * del polígono más cercano en vez de adentro. Con intersección estricta la
 * búsqueda fallaría en la mayoría de los casos. 120 m cubre lo medido con
 * margen y sigue siendo menos que una manzana limeña típica, así que no
 * inventa una respuesta para un punto que de verdad está fuera del estudio.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "sismo-abierto/1.0 (+https://sismo.crafter.run)";
const SNAP_METERS = 120;

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  return url;
}

/** Recorta el display_name de Nominatim, que llega con el país y el código postal. */
function shortLabel(displayName: string): string {
  const parts = displayName.split(",").map((part) => part.trim());
  return parts.slice(0, 3).join(", ");
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query || query.length < 3) {
    return Response.json(
      { results: [], error: "Escribí al menos tres caracteres." },
      { status: 400 },
    );
  }

  const url = new URL(NOMINATIM);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "pe");
  // Sesga hacia Lima Metropolitana y Callao sin excluir el resto del país:
  // una dirección fuera de la bbox igual aparece, solo que más abajo.
  url.searchParams.set("viewbox", "-77.25,-11.55,-76.65,-12.55");

  let geocoded: NominatimResult[];
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "es" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      return Response.json(
        { results: [], error: "El buscador de direcciones no respondió." },
        { status: 502 },
      );
    }
    geocoded = (await response.json()) as NominatimResult[];
  } catch {
    return Response.json(
      { results: [], error: "El buscador de direcciones no respondió." },
      { status: 502 },
    );
  }

  const store = new LimaRiskStore(requireDatabaseUrl());
  const results = await Promise.all(
    geocoded.map(async (entry) => {
      const lon = Number(entry.lon);
      const lat = Number(entry.lat);
      const risk = await store.atPoint(lon, lat, {
        snapMeters: SNAP_METERS,
      });
      return {
        label: shortLabel(entry.display_name),
        fullLabel: entry.display_name,
        lon,
        lat,
        risk,
      };
    }),
  );

  return Response.json(
    { results },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
