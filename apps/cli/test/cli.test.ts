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
  env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string; code: number }> {
  const proc = Bun.spawn(["bun", cliPath, ...args], {
    env: { ...process.env, ...env },
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

  test("provider inválido sale con código 2 sin consultar la red", async () => {
    const result = await runCli(["latest", "--provider", "otro"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Provider desconocido");
  });

  test("provider SGC deshabilitado sale como fuente no disponible", async () => {
    const result = await runCli(["latest", "--provider", "sgc", "--json"], {
      NODE_ENV: "production",
      SISMO_SGC_PROVIDER: "false",
    });
    expect(result.code).toBe(4);
    expect(result.stderr).toContain("deshabilitado en producción");
  });

  test("events acepta --json como alias de --format json", async () => {
    const result = Bun.spawnSync({
      cmd: ["bun", "apps/cli/src/main.ts", "events", "--since", "7d", "--json"],
      cwd: new URL("../../..", import.meta.url).pathname,
      env: { ...process.env, NO_COLOR: "1" },
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(() => JSON.parse(result.stdout.toString())).not.toThrow();
  });

  test("help sale con código 0", async () => {
    const result = await runCli(["help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("sismo latest");
    expect(result.stdout).toContain("sismo schema COMMAND");
  });

  test("schema expone el contrato JSON del comando", async () => {
    const result = await runCli(["schema", "latest"]);
    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    const schema = JSON.parse(result.stdout);
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.properties.event).toBeDefined();
  });

  test("schema rechaza comandos sin contrato", async () => {
    const result = await runCli(["schema", "skill"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Uso: sismo schema COMMAND");
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
