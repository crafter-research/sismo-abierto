import { publishHumanitarianVersion } from "@sismo/incidents";
import { NextResponse } from "next/server";
import { authorizeIncidentAdmin } from "@/lib/incident-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ incidentId: string; versionId: string }> },
) {
  const unauthorized = authorizeIncidentAdmin(request);
  if (unauthorized) return unauthorized;
  const { incidentId, versionId } = await params;
  const version = await publishHumanitarianVersion(incidentId, versionId);
  if (!version) {
    return NextResponse.json(
      { error: "pending_version_not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ version });
}
