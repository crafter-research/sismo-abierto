export function formatLimaDateTime(iso: string | null): string {
  return formatLocalDateTime(iso, "America/Lima");
}

export function formatLocalDateTime(
  iso: string | null,
  timezone: string,
): string {
  if (!iso) return "No disponible";
  const parsed = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!parsed) return iso;
  const [, year, month, day, hour, minute, second] = parsed;
  const place = timezone === "America/Bogota" ? "Bogotá" : "Lima";
  return `${day}/${month}/${year} ${hour}:${minute}:${second} (hora de ${place}, UTC-5)`;
}

export function formatFetchedAt(
  iso: string,
  timezone = "America/Lima",
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const place = timezone === "America/Bogota" ? "Bogotá" : "Lima";
  return `${value("day")}/${value("month")} ${value("hour")}:${value("minute")} (${place}, UTC-5)`;
}

export function formatMagnitude(magnitude: number): string {
  return `M ${magnitude.toFixed(1)}`;
}
