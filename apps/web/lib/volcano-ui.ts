const LEVEL_STYLES: Record<string, string> = {
  verde: "bg-[#ecfdec] text-[#107d32] dark:bg-[#0f2e17] dark:text-[#4ce15e]",
  amarillo: "bg-[#fff6de] text-[#aa4d00] dark:bg-[#332100] dark:text-[#ffc543]",
  naranja: "bg-[#ffe8d9] text-[#b34700] dark:bg-[#331400] dark:text-[#ff9300]",
  rojo: "bg-[#ffeeef] text-[#d8001b] dark:bg-[#2a1214] dark:text-[#ff6166]",
};

export function levelChip(level: string): string {
  return (
    LEVEL_STYLES[level.trim().toLowerCase()] ?? "bg-missing-soft text-missing"
  );
}
