import { getDefaultIncidentStore, syncIncidentSeismic } from "@sismo/incidents";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!getDefaultIncidentStore()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }
  const version = await syncIncidentSeismic();
  return NextResponse.json({
    ranAt: new Date().toISOString(),
    versionId: version?.id ?? null,
    observedAt: version?.observedAt ?? null,
  });
}
