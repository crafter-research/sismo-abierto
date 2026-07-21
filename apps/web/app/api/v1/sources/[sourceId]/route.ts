import { getSourceHistory } from "@sismo/source-health";
import { handleApi } from "../../../../../lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  const { sourceId } = await params;
  return handleApi(async () => {
    const history = await getSourceHistory(sourceId);
    if (!history) return null;
    return {
      source: history.source,
      recentChecks: history.recentChecks,
      disclaimer: history.disclaimer,
    };
  });
}
