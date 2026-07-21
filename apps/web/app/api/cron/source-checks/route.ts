import {
  buildProbeConfigs,
  getDefaultStore,
  runSourceChecks,
} from "@sismo/source-health";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const checks = await runSourceChecks(getDefaultStore(), buildProbeConfigs());
  return NextResponse.json({
    ranAt: new Date().toISOString(),
    checked: checks.length,
    statuses: Object.fromEntries(
      checks.map((check) => [check.sourceId, check.status]),
    ),
  });
}
