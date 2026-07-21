import { buildEventDetailResponse } from "@sismo/data";
import { handleApi } from "../../../../../lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  return handleApi(() => buildEventDetailResponse(eventId));
}
