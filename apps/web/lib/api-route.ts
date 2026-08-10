import { isSourceError } from "@sismo/data";
import { NextResponse } from "next/server";

const KIND_TO_STATUS: Record<string, { http: number; code: string }> = {
  not_found: { http: 404, code: "NOT_FOUND" },
  disabled: { http: 503, code: "PROVIDER_DISABLED" },
  timeout: { http: 502, code: "SOURCE_UNAVAILABLE" },
  network: { http: 502, code: "SOURCE_UNAVAILABLE" },
  http: { http: 502, code: "SOURCE_UNAVAILABLE" },
  empty: { http: 502, code: "SOURCE_UNAVAILABLE" },
  content_type: { http: 502, code: "SOURCE_SCHEMA_CHANGED" },
  schema: { http: 502, code: "SOURCE_SCHEMA_CHANGED" },
  invalid: { http: 400, code: "INVALID_INPUT" },
};

export function apiError(error: unknown): NextResponse {
  if (isSourceError(error)) {
    const mapping = KIND_TO_STATUS[error.kind] ?? {
      http: 500,
      code: "INTERNAL",
    };
    return NextResponse.json(
      {
        error: {
          code: mapping.code,
          message: error.message,
          sourceId: error.sourceId,
        },
      },
      { status: mapping.http },
    );
  }
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL",
        message: "Error interno del proyecto (no de las fuentes oficiales).",
        sourceId: null,
      },
    },
    { status: 500 },
  );
}

export async function handleApi(
  loader: () => Promise<unknown>,
): Promise<NextResponse> {
  try {
    const payload = await loader();
    if (payload === null) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Recurso no encontrado.",
            sourceId: null,
          },
        },
        { status: 404 },
      );
    }
    return NextResponse.json(payload);
  } catch (error) {
    return apiError(error);
  }
}
