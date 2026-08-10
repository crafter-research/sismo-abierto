import { NextResponse } from "next/server";

export function authorizeIncidentAdmin(request: Request): NextResponse | null {
  const secret = process.env.INCIDENT_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INCIDENT_ADMIN_SECRET no está configurado" },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
