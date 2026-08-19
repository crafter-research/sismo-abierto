import { afterEach, describe, expect, test } from "bun:test";
import {
  assertCenepredProviderEnabled,
  CENEPRED_CISMID_LAYER,
  CENEPRED_REFERER,
  fetchCenepredZoneCount,
  isCenepredProviderEnabled,
} from "../src/adapters/cenepred.ts";

const original = process.env.SISMO_CENEPRED_TOKEN;

afterEach(() => {
  if (original === undefined) {
    delete process.env.SISMO_CENEPRED_TOKEN;
    return;
  }
  process.env.SISMO_CENEPRED_TOKEN = original;
});

describe("gate del provider CENEPRED", () => {
  test("está apagado cuando no hay token institucional", () => {
    delete process.env.SISMO_CENEPRED_TOKEN;
    expect(isCenepredProviderEnabled()).toBe(false);
  });

  test("no se enciende en tests, a diferencia del provider SGC", () => {
    delete process.env.SISMO_CENEPRED_TOKEN;
    expect(process.env.NODE_ENV).toBe("test");
    expect(isCenepredProviderEnabled()).toBe(false);
  });

  test("cualquier consulta falla explícitamente sin token", async () => {
    delete process.env.SISMO_CENEPRED_TOKEN;
    expect(() => assertCenepredProviderEnabled()).toThrow(/deshabilitado/);
    await expect(fetchCenepredZoneCount()).rejects.toThrow(/deshabilitado/);
  });

  test("el mensaje de error nombra la licencia como el bloqueante", () => {
    delete process.env.SISMO_CENEPRED_TOKEN;
    try {
      assertCenepredProviderEnabled();
      throw new Error("debía lanzar");
    } catch (error) {
      expect((error as Error).message).toContain("licencia");
    }
  });

  test("se enciende solo con un token presente", () => {
    process.env.SISMO_CENEPRED_TOKEN = "token-de-prueba";
    expect(isCenepredProviderEnabled()).toBe(true);
    expect(() => assertCenepredProviderEnabled()).not.toThrow();
  });
});

describe("contrato de la capa", () => {
  test("apunta a la microzonificación CISMID de SIGRID", () => {
    expect(CENEPRED_CISMID_LAYER).toBe(5030402);
  });

  test("declara el origen exacto que el servicio valida", () => {
    expect(CENEPRED_REFERER).toBe("https://sigrid.cenepred.gob.pe/");
  });
});
