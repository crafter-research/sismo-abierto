import {
  type DatedPublication,
  officialProvenance,
  SOURCES,
} from "@sismo/contracts";
import { cached } from "../cache.ts";
import { fetchJson } from "../http.ts";
import { nowLimaIso } from "../lima-time.ts";

const REGEN_BASE = "https://repositorio.igp.gob.pe";

interface DspaceSearchResponse {
  _embedded?: {
    searchResult?: {
      _embedded?: {
        objects?: Array<{
          _embedded?: {
            indexableObject?: {
              id: string;
              handle?: string;
              metadata?: Record<string, Array<{ value: string }>>;
            };
          };
        }>;
      };
      page?: { totalElements?: number };
    };
  };
}

export async function searchRegenPublications(
  query: string,
  size = 10,
): Promise<DatedPublication[]> {
  const url = `${REGEN_BASE}/server/api/discover/search/objects?query=${encodeURIComponent(query)}&size=${size}&sort=dc.date.issued,DESC`;
  return cached(`regen:${url}`, 3_600_000, async () => {
    const data = await fetchJson<DspaceSearchResponse>(url, {
      sourceId: "igp-regen",
      timeoutMs: 20_000,
    });
    const objects = data._embedded?.searchResult?._embedded?.objects ?? [];
    const provenance = officialProvenance(SOURCES["igp-regen"], nowLimaIso());
    const publications: DatedPublication[] = [];
    for (const entry of objects) {
      const item = entry._embedded?.indexableObject;
      if (!item?.metadata) continue;
      const title = item.metadata["dc.title"]?.[0]?.value;
      const issued = item.metadata["dc.date.issued"]?.[0]?.value;
      if (!title || !issued) continue;
      publications.push({
        id: item.id,
        title,
        issuedDate: issued,
        url: item.handle
          ? `${REGEN_BASE}/handle/${item.handle}`
          : `${REGEN_BASE}/items/${item.id}`,
        provenance,
      });
    }
    return publications;
  });
}
