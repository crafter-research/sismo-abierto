import { SourceError } from "./errors.ts";

export const USER_AGENT =
  "sismo-abierto/0.1 (proyecto comunitario open source; contacto: railly@crafterstation.com)";

export interface FetchPolicy {
  sourceId: string;
  timeoutMs?: number;
  retries?: number;
  cacheSeconds?: number;
  method?: "GET" | "POST";
  body?: string;
  headers?: Record<string, string>;
  expectedContentType?: string;
}

async function attemptFetch(
  url: string,
  policy: FetchPolicy,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    policy.timeoutMs ?? 15_000,
  );
  try {
    const request: RequestInit & { next?: { revalidate: number } } = {
      method: policy.method ?? "GET",
      headers: {
        "user-agent": USER_AGENT,
        ...(policy.body ? { "content-type": "application/json" } : {}),
        ...policy.headers,
      },
      ...(policy.body ? { body: policy.body } : {}),
      signal: controller.signal,
    };
    if (policy.cacheSeconds !== undefined) {
      request.next = { revalidate: policy.cacheSeconds };
    }
    return await fetch(url, request);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSource(
  url: string,
  policy: FetchPolicy,
): Promise<Response> {
  const maxAttempts = 1 + (policy.retries ?? 1);
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await attemptFetch(url, policy);
      if (response.status >= 500 && attempt < maxAttempts) {
        lastError = new SourceError({
          kind: "http",
          sourceId: policy.sourceId,
          message: `HTTP ${response.status} desde ${policy.sourceId}`,
          httpStatus: response.status,
        });
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        continue;
      }
      if (!response.ok) {
        throw new SourceError({
          kind: response.status === 404 ? "not_found" : "http",
          sourceId: policy.sourceId,
          message: `HTTP ${response.status} desde ${policy.sourceId} (${url})`,
          httpStatus: response.status,
        });
      }
      if (policy.expectedContentType) {
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes(policy.expectedContentType)) {
          throw new SourceError({
            kind: "content_type",
            sourceId: policy.sourceId,
            message: `Content-type inesperado "${contentType}" desde ${policy.sourceId}; se esperaba ${policy.expectedContentType}`,
            httpStatus: response.status,
          });
        }
      }
      return response;
    } catch (error) {
      if (error instanceof SourceError && error.kind !== "http") throw error;
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }
  }

  if (lastError instanceof SourceError) throw lastError;
  const aborted =
    lastError instanceof DOMException && lastError.name === "AbortError";
  throw new SourceError({
    kind: aborted ? "timeout" : "network",
    sourceId: policy.sourceId,
    message: aborted
      ? `Timeout consultando ${policy.sourceId} (${url})`
      : `Fallo de red consultando ${policy.sourceId} (${url})`,
    cause: lastError,
  });
}

export async function fetchJson<T>(
  url: string,
  policy: FetchPolicy,
): Promise<T> {
  const response = await fetchSource(url, policy);
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new SourceError({
      kind: "schema",
      sourceId: policy.sourceId,
      message: `Respuesta no es JSON válido desde ${policy.sourceId}`,
      cause: error,
    });
  }
}
