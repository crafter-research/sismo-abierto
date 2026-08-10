import { describe, expect, test } from "bun:test";
import { cached, clearCache } from "../src/cache.ts";

describe("cache", () => {
  test("agrupa solicitudes simultáneas para no repetir la consulta al origen", async () => {
    clearCache();
    let calls = 0;
    const loader = async () => {
      calls += 1;
      await Promise.resolve();
      return 42;
    };
    const values = await Promise.all([
      cached("same-key", 60_000, loader),
      cached("same-key", 60_000, loader),
      cached("same-key", 60_000, loader),
    ]);
    expect(values).toEqual([42, 42, 42]);
    expect(calls).toBe(1);
    clearCache();
  });
});
