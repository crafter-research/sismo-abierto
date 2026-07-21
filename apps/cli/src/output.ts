export function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => (row[index] ?? "").length)),
  );
  const line = (cells: string[]) =>
    cells.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join("  ");
  return [
    line(headers),
    line(widths.map((width) => "-".repeat(width))),
    ...rows.map((row) => line(row)),
  ].join("\n");
}

export function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null>>,
): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      row.map((cell) => csvEscape(cell === null ? "" : String(cell))).join(","),
    );
  }
  return lines.join("\n");
}

export class CliError extends Error {
  readonly exitCode: number;
  constructor(message: string, exitCode: number) {
    super(message);
    this.exitCode = exitCode;
  }
}

export const EXIT_CODES = {
  ok: 0,
  invalidInput: 2,
  notFound: 3,
  sourceUnavailable: 4,
} as const;
