import { humanitarianSubmissionSchema } from "@sismo/contracts";
import {
  listPendingHumanitarianVersions,
  submitHumanitarianSnapshot,
} from "@sismo/incidents";
import { NextResponse } from "next/server";
import { authorizeIncidentAdmin } from "@/lib/incident-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ incidentId: string }> },
) {
  const unauthorized = authorizeIncidentAdmin(request);
  if (unauthorized) return unauthorized;
  const { incidentId } = await params;
  const versions = await listPendingHumanitarianVersions(incidentId);
  return NextResponse.json({ versions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ incidentId: string }> },
) {
  const unauthorized = authorizeIncidentAdmin(request);
  if (unauthorized) return unauthorized;
  const parsed = humanitarianSubmissionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { incidentId } = await params;
  const version = await submitHumanitarianSnapshot(incidentId, parsed.data);
  return NextResponse.json({ version }, { status: 201 });
}
