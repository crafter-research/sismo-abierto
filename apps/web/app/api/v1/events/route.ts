import { buildEventListResponse, resolveEventProvider } from "@sismo/data";
import type { NextRequest } from "next/server";
import { handleApi } from "../../../../lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const numberOrUndefined = (key: string) => {
    const value = params.get(key);
    return value === null || value === "" ? undefined : Number(value);
  };
  return handleApi(() =>
    buildEventListResponse({
      provider: resolveEventProvider(params.get("provider") ?? undefined),
      since: params.get("since") ?? undefined,
      until: params.get("until") ?? undefined,
      minMagnitude: numberOrUndefined("minMagnitude"),
      maxMagnitude: numberOrUndefined("maxMagnitude"),
      minDepthKm: numberOrUndefined("minDepthKm"),
      maxDepthKm: numberOrUndefined("maxDepthKm"),
    }),
  );
}
