const LEVEL_STYLES: Record<string, string> = {
  verde: "bg-sem-green-soft text-sem-green",
  amarillo: "bg-sem-amber-soft text-sem-amber",
  naranja: "bg-sem-orange-soft text-sem-orange",
  rojo: "bg-sem-red-soft text-sem-red",
};

export function levelChip(level: string): string {
  return (
    LEVEL_STYLES[level.trim().toLowerCase()] ?? "bg-missing-soft text-missing"
  );
}
