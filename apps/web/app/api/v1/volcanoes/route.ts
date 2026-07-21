import { buildVolcanoListResponse } from "@sismo/data";
import { handleApi } from "../../../../lib/api-route";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleApi(() => buildVolcanoListResponse());
}
