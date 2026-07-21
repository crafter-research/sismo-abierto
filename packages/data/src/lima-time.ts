const LIMA_OFFSET_HOURS = 5;

export const LIMA_TIMEZONE = "America/Lima";

export function limaLocalToUtcIso(
  dateLocal: string,
  timeLocal: string,
): string | null {
  const dateMatch = dateLocal.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const isoDateMatch = dateLocal.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let year: number;
  let month: number;
  let day: number;
  if (dateMatch) {
    day = Number(dateMatch[1]);
    month = Number(dateMatch[2]);
    year = Number(dateMatch[3]);
  } else if (isoDateMatch) {
    year = Number(isoDateMatch[1]);
    month = Number(isoDateMatch[2]);
    day = Number(isoDateMatch[3]);
  } else {
    return null;
  }
  const timeMatch = timeLocal.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (!timeMatch) return null;
  const utcMs = Date.UTC(
    year,
    month - 1,
    day,
    Number(timeMatch[1]) + LIMA_OFFSET_HOURS,
    Number(timeMatch[2]),
    Number(timeMatch[3]),
  );
  return new Date(utcMs).toISOString();
}

export function utcIsoToLimaIso(utcIso: string): string | null {
  const parsed = Date.parse(utcIso);
  if (Number.isNaN(parsed)) return null;
  const lima = new Date(parsed - LIMA_OFFSET_HOURS * 3_600_000);
  return `${lima.toISOString().slice(0, 19)}-05:00`;
}

export function utcIsoToAceldatDatetime(utcIso: string): string | null {
  const parsed = Date.parse(utcIso);
  if (Number.isNaN(parsed)) return null;
  const iso = new Date(parsed).toISOString();
  return `${iso.slice(0, 10).replaceAll("-", "")}_${iso.slice(11, 19).replaceAll(":", "")}`;
}

export function nowLimaIso(): string {
  return utcIsoToLimaIso(new Date().toISOString()) ?? new Date().toISOString();
}

export function utcDateOnly(utcIso: string): string {
  return utcIso.slice(0, 10);
}
