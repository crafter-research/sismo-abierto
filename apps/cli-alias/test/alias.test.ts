import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";

const binPath = new URL("../bin/sismo.js", import.meta.url).pathname;

describe("alias sismo", () => {
  test("delega el contrato al paquete canónico", () => {
    const result = spawnSync("bun", [binPath, "schema", "latest"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).required).toContain("event");
  });

  test("propaga el exit code del CLI", () => {
    const result = spawnSync("bun", [binPath, "no-existe"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Comando desconocido");
  });
});
