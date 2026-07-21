import { unzipSync } from "fflate";

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siMatches = xml.matchAll(/<si>([\s\S]*?)<\/si>/g);
  for (const si of siMatches) {
    const content = si[1] ?? "";
    const texts = [...content.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((m) => decodeXmlEntities(m[1] ?? ""))
      .join("");
    strings.push(texts);
  }
  return strings;
}

function columnIndex(cellRef: string): number {
  const letters = cellRef.match(/^[A-Z]+/)?.[0] ?? "A";
  let index = 0;
  for (const char of letters) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

export function parseXlsxRows(bytes: Uint8Array): string[][] {
  const files = unzipSync(bytes);
  const sheetEntry = Object.keys(files).find((name) =>
    name.match(/^xl\/worksheets\/sheet1\.xml$/),
  );
  if (!sheetEntry) {
    throw new Error("El XLSX no contiene xl/worksheets/sheet1.xml");
  }
  const decoder = new TextDecoder();
  const sheetXml = decoder.decode(files[sheetEntry]);
  const sharedEntry = files["xl/sharedStrings.xml"];
  const sharedStrings = sharedEntry
    ? parseSharedStrings(decoder.decode(sharedEntry))
    : [];

  const rows: string[][] = [];
  for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of (rowMatch[1] ?? "").matchAll(
      /<c([^>]*)>([\s\S]*?)<\/c>/g,
    )) {
      const attrs = cellMatch[1] ?? "";
      const inner = cellMatch[2] ?? "";
      const ref = attrs.match(/r="([A-Z]+\d+)"/)?.[1];
      const type = attrs.match(/t="([a-z]+)"/)?.[1];
      let value = "";
      if (type === "inlineStr") {
        value = decodeXmlEntities(
          inner.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "",
        );
      } else {
        const raw = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        value =
          type === "s"
            ? (sharedStrings[Number(raw)] ?? "")
            : decodeXmlEntities(raw);
      }
      const index = ref ? columnIndex(ref) : cells.length;
      cells[index] = value;
    }
    rows.push(cells);
  }
  return rows;
}
