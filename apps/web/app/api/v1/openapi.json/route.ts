import { buildOpenApiDocument } from "@sismo/contracts";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(buildOpenApiDocument());
}
