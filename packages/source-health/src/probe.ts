import { parseXlsxRows, USER_AGENT } from "@sismo/data";
import {
  checkCensisHeader,
  checkExternalContract,
} from "./external-contracts.ts";
import type { ProbeObservation } from "./observation.ts";
import type { ProbeConfig } from "./probe-configs.ts";

interface ValidationResult {
  schemaValid: boolean;
  recordCount: number | null;
  detail: string;
}

function validatePayload(
  config: ProbeConfig,
  bytes: Uint8Array,
): ValidationResult {
  try {
    if (config.contract === "censis-xlsx") {
      const result = checkCensisHeader(parseXlsxRows(bytes));
      return {
        schemaValid: result.valid,
        recordCount: result.recordCount,
        detail: result.detail,
      };
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    const result = checkExternalContract(config.contract, payload);
    return {
      schemaValid: result.valid,
      recordCount: result.recordCount,
      detail: result.detail,
    };
  } catch (error) {
    return {
      schemaValid: false,
      recordCount: null,
      detail: `Payload ilegible: ${error instanceof Error ? error.message : "error"}`,
    };
  }
}

export async function probeSource(
  config: ProbeConfig,
  nowIso: () => string = () => new Date().toISOString(),
): Promise<ProbeObservation> {
  const checkedAt = nowIso();
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        "user-agent": USER_AGENT,
        ...(config.body ? { "content-type": "application/json" } : {}),
      },
      ...(config.body ? { body: config.body } : {}),
      signal: controller.signal,
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const durationMs = Math.round(performance.now() - startedAt);
    const contentType = response.headers.get("content-type");
    const contentTypeOk = config.expectedContentTypes.some((expected) =>
      (contentType ?? "").includes(expected),
    );
    if (!response.ok) {
      return {
        sourceId: config.sourceId,
        checkedAt,
        httpStatus: response.status,
        durationMs,
        contentType,
        responded: true,
        schemaValid: null,
        recordCount: null,
        freshnessKnown: config.freshnessKnown,
        latencyDegradedMs: config.latencyDegradedMs,
        errorKind: "http",
        evidence: `HTTP ${response.status} en ${durationMs} ms`,
      };
    }
    const validation = validatePayload(config, bytes);
    const schemaValid = contentTypeOk && validation.schemaValid;
    return {
      sourceId: config.sourceId,
      checkedAt,
      httpStatus: response.status,
      durationMs,
      contentType,
      responded: true,
      schemaValid,
      recordCount: validation.recordCount,
      freshnessKnown: config.freshnessKnown,
      latencyDegradedMs: config.latencyDegradedMs,
      errorKind: schemaValid ? null : "schema",
      evidence: contentTypeOk
        ? `HTTP ${response.status} en ${durationMs} ms · ${validation.detail}`
        : `HTTP ${response.status} en ${durationMs} ms · content-type inesperado "${contentType}"`,
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);
    const aborted =
      error instanceof DOMException && error.name === "AbortError";
    return {
      sourceId: config.sourceId,
      checkedAt,
      httpStatus: null,
      durationMs,
      contentType: null,
      responded: false,
      schemaValid: null,
      recordCount: null,
      freshnessKnown: config.freshnessKnown,
      latencyDegradedMs: config.latencyDegradedMs,
      errorKind: aborted ? "timeout" : "network",
      evidence: aborted
        ? `Timeout tras ${config.timeoutMs} ms`
        : `Fallo de red en ${durationMs} ms`,
    };
  } finally {
    clearTimeout(timeout);
  }
}
