import { buildMapCollection } from "@sismo/terrain";

export const dynamic = "force-static";

export function GET() {
  const collection = buildMapCollection();
  return new Response(JSON.stringify(collection), {
    headers: {
      "content-type": "application/geo+json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
