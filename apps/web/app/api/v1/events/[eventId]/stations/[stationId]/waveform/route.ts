import { buildWaveformResponse } from "@sismo/waveforms";
import { handleApi } from "../../../../../../../../lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string; stationId: string }> },
) {
  const { eventId, stationId } = await params;
  return handleApi(() => buildWaveformResponse(eventId, stationId));
}
