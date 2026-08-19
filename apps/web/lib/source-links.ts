export interface SourceLink {
  href: string;
  label: string;
  precision: "event" | "catalog";
}

const CENSIS_REPOSITORY =
  "https://censis.igp.gob.pe/repositorio/datos-sismicos";

function isoDay(eventTimeUtc: string): string {
  return eventTimeUtc.slice(0, 10);
}

function nextDay(eventTimeUtc: string): string {
  const day = new Date(`${isoDay(eventTimeUtc)}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

/**
 * Devuelve dónde se verifica un evento según su fuente.
 *
 * El USGS acepta una consulta acotada por fecha, magnitud y área, así que se
 * enlaza esa consulta y el lector cae sobre el evento. El catálogo del IGP no
 * publica un identificador por evento ni acepta parámetros en la URL, así que se
 * enlaza su repositorio: es el lugar real donde se comprueba el dato. Nunca se
 * fabrica un enlace por evento para una fuente que no lo ofrece.
 */
export function sourceLinksFor(
  sourceId: string,
  eventTimeUtc: string,
  magnitude: number,
): SourceLink[] {
  // Un candidato confirmado por dos catálogos llega como "a+b". Cada fuente
  // recibe su propio enlace en vez de perder una de las dos.
  return sourceId
    .split("+")
    .map((id) => sourceLinkFor(id, eventTimeUtc, magnitude))
    .filter((link): link is SourceLink => link !== null);
}

export function sourceLinkFor(
  sourceId: string,
  eventTimeUtc: string,
  magnitude: number,
): SourceLink | null {
  if (sourceId === "usgs-fdsn") {
    const params = new URLSearchParams({
      format: "geojson",
      starttime: isoDay(eventTimeUtc),
      endtime: nextDay(eventTimeUtc),
      minmagnitude: Math.max(0, magnitude - 0.3).toFixed(1),
    });
    return {
      href: `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`,
      label: "Consultar en USGS",
      precision: "event",
    };
  }
  if (sourceId === "igp-censis-catalogo") {
    return {
      href: CENSIS_REPOSITORY,
      label: "Repositorio IGP CENSIS",
      precision: "catalog",
    };
  }
  return null;
}
