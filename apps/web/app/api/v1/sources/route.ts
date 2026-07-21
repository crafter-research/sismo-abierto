import { getSourceOverview } from "@sismo/source-health";
import { handleApi } from "../../../../lib/api-route";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleApi(() => getSourceOverview());
}
