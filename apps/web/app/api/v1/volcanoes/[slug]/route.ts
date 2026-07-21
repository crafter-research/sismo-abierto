import { buildVolcanoDetailResponse } from "@sismo/data";
import { handleApi } from "../../../../../lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return handleApi(() => buildVolcanoDetailResponse(slug));
}
