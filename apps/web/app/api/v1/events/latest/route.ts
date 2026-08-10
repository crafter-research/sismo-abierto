import { buildLatestEventResponse, resolveEventProvider } from "@sismo/data";
import type { NextRequest } from "next/server";
import { handleApi } from "../../../../../lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleApi(() =>
    buildLatestEventResponse(
      resolveEventProvider(
        request.nextUrl.searchParams.get("provider") ?? undefined,
      ),
    ),
  );
}
