const STATUS_STYLES: Record<string, string> = {
  OPERATIONAL:
    "bg-[#ecfdec] text-[#107d32] dark:bg-[#0f2e17] dark:text-[#4ce15e]",
  DEGRADED: "bg-[#fff6de] text-[#aa4d00] dark:bg-[#332100] dark:text-[#ffc543]",
  UNAVAILABLE:
    "bg-[#ffeeef] text-[#d8001b] dark:bg-[#2a1214] dark:text-[#ff6166]",
  SCHEMA_CHANGED:
    "bg-[#ffeeef] text-[#d8001b] dark:bg-[#2a1214] dark:text-[#ff6166]",
  FRESHNESS_UNKNOWN: "bg-missing-soft text-missing",
};

export function statusChip(status: string): string {
  return STATUS_STYLES[status] ?? "bg-missing-soft text-missing";
}
