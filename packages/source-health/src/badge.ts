import type { SourceStatus } from "@sismo/contracts";

export const SOURCE_BADGE_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=3600";

const STATUS_COLORS = {
  OPERATIONAL: "#1f883d",
  DEGRADED: "#9a6700",
  UNAVAILABLE: "#cf222e",
  SCHEMA_CHANGED: "#8250df",
  FRESHNESS_UNKNOWN: "#656d76",
} satisfies Record<SourceStatus, string>;

const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) => XML_ENTITIES[character] ?? "",
  );
}

function badgeWidth(value: string, minimum: number): number {
  return Math.max(minimum, Math.ceil(value.length * 7.1 + 20));
}

function renderBadge(
  sourceId: string,
  status: string,
  color: string,
  title: string,
  description: string,
): string {
  const sourceWidth = badgeWidth(sourceId, 96);
  const statusWidth = badgeWidth(status, 104);
  const totalWidth = sourceWidth + statusWidth;
  const safeSourceId = escapeXml(sourceId);
  const safeStatus = escapeXml(status);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" viewBox="0 0 ${totalWidth} 28" role="img" aria-labelledby="title desc" data-status="${safeStatus}">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(description)}</desc>
  <clipPath id="badge-clip"><rect width="${totalWidth}" height="28" rx="4"/></clipPath>
  <g clip-path="url(#badge-clip)">
    <rect width="${sourceWidth}" height="28" fill="#24292f"/>
    <rect x="${sourceWidth}" width="${statusWidth}" height="28" fill="${color}"/>
  </g>
  <g fill="#fff" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" font-weight="600" text-anchor="middle">
    <text x="${sourceWidth / 2}" y="18">${safeSourceId}</text>
    <text x="${sourceWidth + statusWidth / 2}" y="18">${safeStatus}</text>
  </g>
</svg>`;
}

export function renderSourceBadgeSvg(input: {
  sourceId: string;
  sourceName: string;
  status: SourceStatus;
  disclaimer: string;
}): string {
  return renderBadge(
    input.sourceId,
    input.status,
    STATUS_COLORS[input.status],
    `Estado observado de ${input.sourceName}: ${input.status}`,
    input.disclaimer,
  );
}

export function renderUnknownSourceBadgeSvg(sourceId: string): string {
  return renderBadge(
    sourceId,
    "NOT_FOUND",
    "#cf222e",
    `Fuente desconocida: ${sourceId}`,
    "La fuente solicitada no forma parte del registro público de Sismo Abierto.",
  );
}
