import { queryEventCatalog } from "@sismo/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const since = new Date(Date.now() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const { events } = await queryEventCatalog({ provider: "igp", since });
  const collection = {
    type: "FeatureCollection" as const,
    features: events.map((event) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [event.longitude, event.latitude],
      },
      properties: {
        magnitude: event.magnitude,
        reference: event.reference,
        timeLocal: event.timeLocal,
      },
    })),
  };
  return new Response(JSON.stringify(collection), {
    headers: {
      "content-type": "application/geo+json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=600",
    },
  });
}
