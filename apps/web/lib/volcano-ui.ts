const LEVEL_STYLES: Record<string, string> = {
  verde: "bg-official-soft text-official",
  amarillo: "bg-explanation-soft text-explanation",
  naranja: "bg-explanation-soft text-explanation",
  rojo: "bg-missing-soft text-missing",
};

export function levelChip(level: string): string {
  return (
    LEVEL_STYLES[level.trim().toLowerCase()] ?? "bg-missing-soft text-missing"
  );
}
