export type ValueClass = "official" | "derived" | "explanation" | "unavailable";

export type FreshnessState = "FRESH" | "STALE" | "FRESHNESS_UNKNOWN";

export interface SourceRef {
  id: string;
  name: string;
  url: string;
}

export interface Provenance {
  source: SourceRef;
  fetchedAt: string;
  timezone: string;
  sourceUpdatedAt: string | null;
  freshness: FreshnessState;
  classification: ValueClass;
  note?: string;
}

export interface FieldProvenance {
  [field: string]: ValueClass;
}

export function officialProvenance(
  source: SourceRef,
  fetchedAt: string,
  options?: {
    sourceUpdatedAt?: string | null;
    freshness?: FreshnessState;
    note?: string;
  },
): Provenance {
  return {
    source,
    fetchedAt,
    timezone: "America/Lima",
    sourceUpdatedAt: options?.sourceUpdatedAt ?? null,
    freshness:
      options?.freshness ??
      (options?.sourceUpdatedAt ? "FRESH" : "FRESHNESS_UNKNOWN"),
    classification: "official",
    ...(options?.note ? { note: options.note } : {}),
  };
}

export function derivedProvenance(base: Provenance, note: string): Provenance {
  return { ...base, classification: "derived", note };
}
