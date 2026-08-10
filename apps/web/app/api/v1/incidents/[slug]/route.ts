import { getIncidentView } from "@sismo/incidents";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const view = await getIncidentView(slug);
  if (!view) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Incidente no encontrado",
          sourceId: null,
        },
      },
      { status: 404 },
    );
  }
  return NextResponse.json(view, {
    headers: {
      "cache-control":
        "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
