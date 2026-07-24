import { expect, test } from "@playwright/test";

const KNOWN_EVENT = "ran-20260468";
const KNOWN_STATION = "SCHYO";

test.describe("V1: último sismo trazable", () => {
  test("la portada muestra el último evento oficial con fuente y hora de consulta", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("latest-event")).toBeVisible();
    await expect(page.getByTestId("source-badge").first()).toContainText(
      "Fuente:",
    );
    await expect(page.getByTestId("source-badge").first()).toContainText(
      "Consultado:",
    );
    await expect(page.getByTestId("peru-map").first()).toBeVisible();
  });

  test("la tarjeta del último evento navega a un detalle permanente", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("latest-event-link").click();
    await expect(page).toHaveURL(/\/sismos\/(ran-|censis-)/);
    await expect(page.getByTestId("event-header")).toBeVisible();
  });
});

test.describe("V2: del evento a las ondas", () => {
  test("un evento M4.5+ muestra estaciones y abre el visor Z/N/E", async ({
    page,
  }) => {
    await page.goto(`/sismos/${KNOWN_EVENT}`);
    await expect(page.getByTestId("event-header")).toContainText("M 5.1");
    await expect(page.getByTestId("station-table")).toBeVisible();
    await page.getByRole("link", { name: "Ver Z, N y E →" }).first().click();
    await expect(page.getByTestId("waveform-viewer")).toBeVisible();
    await expect(page.getByTestId("station-summary")).toContainText(
      "muestras/s",
    );
    await expect(page.getByTestId("raw-source-link")).toHaveAttribute(
      "href",
      /api-acelerometrica\/ran\/file/,
    );
  });

  test("el visor ofrece alternativa tabular accesible con PGA oficial y calculado", async ({
    page,
  }) => {
    await page.goto(`/sismos/${KNOWN_EVENT}/estaciones/${KNOWN_STATION}`);
    await page.getByText("Alternativa tabular accesible").click();
    const table = page.getByTestId("waveform-table");
    await expect(table).toBeVisible();
    await expect(table).toContainText("43.7949");
    await expect(table).toContainText("64.7735");
  });
});

test.describe("V3: catálogo reproducible", () => {
  test("el catálogo abre con el resumen del año y su procedencia", async ({
    page,
  }) => {
    await page.goto("/sismos");
    const summary = page.getByTestId("activity-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("Actividad en cifras");
    await expect(summary).toContainText("DERIVADO");
    await expect(summary.getByTestId("source-badge")).toContainText(
      "Consultado:",
    );
    await expect(page.getByLabel("Este año")).toBeChecked();
  });

  test("una URL con filtros restaura exactamente la consulta", async ({
    page,
  }) => {
    await page.goto("/sismos?since=2026-07-14&minMagnitude=4");
    await expect(page.getByTestId("catalog-table")).toBeVisible();
    await expect(page.locator('input[type="date"][name="since"]')).toHaveValue(
      "2026-07-14",
    );
    await expect(page.locator('input[name="minMagnitude"]')).toHaveValue("4");
    const count = await page
      .getByTestId("catalog-table")
      .locator("tbody tr")
      .count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("V4: API ejecutable", () => {
  test("la referencia Scalar renderiza el contrato OpenAPI", async ({
    page,
  }) => {
    await page.goto("/api");
    await expect(page.getByTestId("api-reference")).toContainText(
      "/v1/events/latest",
      {
        timeout: 30_000,
      },
    );
    await expect(page.getByTestId("api-reference")).toContainText(
      "Sismo Abierto API",
    );
  });

  test("la API responde con procedencia y valida el mismo contrato", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/events/latest");
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.event.provenance.fetchedAt).toBeTruthy();
    expect(payload.event.provenance.source.url).toContain("igp.gob.pe");
  });
});

test.describe("V6-V7: Aula Sísmica", () => {
  test("la lección usa un evento real, evalúa la respuesta y guarda progreso local", async ({
    page,
  }) => {
    await page.goto("/aula/magnitud-no-es-intensidad");
    await expect(page.getByTestId("lesson-event")).toBeVisible();
    await page.getByLabel("La intensidad").check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("answer-feedback")).toContainText("Correcto");
    await page.getByTestId("complete-lesson").click();
    await page.goto("/aula");
    await expect(page.getByTestId("aula-progress")).toContainText("1/4");
  });

  test("el laboratorio compara dos estaciones desde una URL compartible", async ({
    page,
  }) => {
    await page.goto(`/aula/laboratorio?evento=${KNOWN_EVENT}&a=SCHYO&b=PNEG`);
    await expect(page.getByTestId("lab-comparison")).toBeVisible();
    await expect(page.getByTestId("guided-explanation")).toContainText(
      "EXPLICACIÓN",
    );
    await expect(page.getByTestId("lab-comparison")).toContainText("SCHYO");
    await expect(page.getByTestId("lab-comparison")).toContainText("PNEG");
  });
});

test.describe("V8-V9: Verifica Sismos", () => {
  test("el registro muestra las 8 afirmaciones congeladas en PENDING", async ({
    page,
  }) => {
    await page.goto("/verifica");
    await expect(
      page.getByTestId("claim-list").locator("tbody tr"),
    ).toHaveCount(8);
    await expect(page.getByTestId("audit-summary")).toContainText("PENDING 8");
  });

  test("una afirmación muestra criterios congelados, tasa base y evidencia", async ({
    page,
  }) => {
    await page.goto("/verifica/P1");
    await expect(page.getByTestId("frozen-claim")).toContainText("Michoacán");
    await expect(page.getByTestId("criteria-table")).toContainText(
      "[3.9, 4.4] inclusivo",
    );
    await expect(page.getByTestId("verdict")).toContainText("PENDING");
    await expect(page.getByTestId("baseline-chart")).toContainText(
      "Control contra azar",
    );
    await expect(page.getByTestId("evidence-links")).toContainText(
      "Consulta de tasa base",
    );
  });
});

test.describe("VA1-VA2: Volcanes Abiertos", () => {
  test("el índice lista los 16 registros publicados con aviso de vigencia", async ({
    page,
  }) => {
    await page.goto("/volcanes");
    await expect(page.getByTestId("scope-notice")).toContainText(
      "no publica fecha",
    );
    await expect(
      page.getByTestId("volcano-list").locator("tbody tr"),
    ).toHaveCount(16);
  });

  test("la ficha distingue dato publicado, frescura desconocida y explicación", async ({
    page,
  }) => {
    await page.goto("/volcanes/sabancaya");
    await expect(page.getByTestId("published-state")).toContainText(
      "PUBLISHED_STATE",
    );
    await expect(page.getByTestId("freshness-state")).toContainText(
      "FRESHNESS_UNKNOWN",
    );
    await expect(page.getByTestId("level-explainer")).toBeVisible();
    await expect(page.getByTestId("bulletin-timeline-blocked")).toContainText(
      "bloqueada",
    );
  });
});

test.describe("EF: Estado de Fuentes (interno en dev/preview)", () => {
  test("el resumen muestra estados observados con el disclaimer de alcance", async ({
    page,
  }) => {
    await page.goto("/fuentes");
    await expect(page.getByTestId("scope-disclaimer")).toContainText(
      "No representa el estado interno",
    );
    await expect(
      page.getByTestId("source-grid").locator("tbody tr"),
    ).toHaveCount(8);
    await expect(page.getByTestId("status-legend")).toContainText(
      "OPERATIONAL",
    );
  });
});
