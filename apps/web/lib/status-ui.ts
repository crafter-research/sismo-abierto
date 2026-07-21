const STATUS_STYLES: Record<string, string> = {
  OPERATIONAL: "bg-sem-green-soft text-sem-green",
  DEGRADED: "bg-sem-amber-soft text-sem-amber",
  UNAVAILABLE: "bg-sem-red-soft text-sem-red",
  SCHEMA_CHANGED: "bg-sem-red-soft text-sem-red",
  FRESHNESS_UNKNOWN: "bg-missing-soft text-missing",
};

export function statusChip(status: string): string {
  return STATUS_STYLES[status] ?? "bg-missing-soft text-missing";
}
