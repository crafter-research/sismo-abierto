export function formatLimaDateTime(iso: string | null): string {
  if (!iso) return "No disponible";
  const parsed = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!parsed) return iso;
  const [, year, month, day, hour, minute, second] = parsed;
  return `${day}/${month}/${year} ${hour}:${minute}:${second} (hora de Lima, UTC-5)`;
}

export function formatFetchedAt(iso: string): string {
  const parsed = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!parsed) return iso;
  const [, , month, day, hour, minute] = parsed;
  return `${day}/${month} ${hour}:${minute} (Lima, UTC-5)`;
}

export function formatMagnitude(magnitude: number): string {
  return `M ${magnitude.toFixed(1)}`;
}
