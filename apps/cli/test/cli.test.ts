import { describe, expect, test } from "bun:test";
import {
  eventListResponseSchema,
  latestEventResponseSchema,
} from "@sismo/contracts";
import { numberFlag, parseArgs, stringFlag } from "../src/args.ts";
import { CliError, renderTable, toCsv } from "../src/output.ts";

const cliPath = new URL("../src/main.ts", import.meta.url).pathname;

async function runCli(
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  const proc = Bun.spawn(["bun", cliPath, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, code };
}

describe("parser de argumentos", () => {
  test("separa posicionales y flags con valor", () => {
    const args = parseArgs(["events", "--since", "7d", "--json"]);
    expect(args.positional).toEqual(["events"]);
    expect(stringFlag(args, "since")).toBe("7d");
    expect(args.flags.get("json")).toBe(true);
  });

  test("flag numérico inválido dispara CliError con exit 2", () => {
    const args = parseArgs(["events", "--min-magnitude", "abc"]);
    expect(() => numberFlag(args, "min-magnitude")).toThrow(CliError);
  });
});

describe("render de salida", () => {
  test("tabla alinea columnas", () => {
    const table = renderTable(["a", "bb"], [["x", "y"]]);
    expect(table.split("\n").length).toBe(3);
  });

  test("csv escapa comas y comillas", () => {
    expect(toCsv(["v"], [['ho,la "x"']])).toBe('v\n"ho,la ""x"""');
  });
});

describe("errores del binario", () => {
  test("comando desconocido sale con código 2 y escribe a stderr", async () => {
    const result = await runCli(["nada"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Comando desconocido");
    expect(result.stdout).toBe("");
  });

  test("formato inválido sale con código 2", async () => {
    const result = await runCli(["events", "--format", "yaml"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("no soportado");
  });

  test("help sale con código 0", async () => {
    const result = await runCli(["help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("sismo latest");
  });
});

describe.skipIf(process.env.SISMO_OFFLINE === "true")(
  "paridad CLI ↔ contrato (red en vivo)",
  () => {
    test("sismo latest --json valida contra el mismo esquema que la API", async () => {
      const result = await runCli(["latest", "--json"]);
      expect(result.code).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(latestEventResponseSchema.safeParse(payload).success).toBe(true);
    }, 30_000);

    test("sismo events --json valida contra el mismo esquema que la API", async () => {
      const result = await runCli([
        "events",
        "--since",
        "7d",
        "--min-magnitude",
        "4",
        "--format",
        "json",
      ]);
      expect(result.code).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(eventListResponseSchema.safeParse(payload).success).toBe(true);
    }, 60_000);
  },
);
