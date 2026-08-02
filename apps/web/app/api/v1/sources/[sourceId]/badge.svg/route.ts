import {
  getSourceHistory,
  renderSourceBadgeSvg,
  renderUnknownSourceBadgeSvg,
  SOURCE_BADGE_CACHE_CONTROL,
} from "@sismo/source-health";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": SOURCE_BADGE_CACHE_CONTROL,
  "Content-Type": "image/svg+xml; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  const { sourceId } = await params;
  const history = await getSourceHistory(sourceId);
  if (!history) {
    return new Response(renderUnknownSourceBadgeSvg(sourceId), {
      status: 404,
      headers,
    });
  }

  return new Response(
    renderSourceBadgeSvg({
      sourceId,
      sourceName: history.source.source.name,
      status: history.source.status,
      disclaimer: history.disclaimer,
    }),
    { headers },
  );
}
