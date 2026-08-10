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

test.describe("Perú y Colombia", () => {
  test("las rutas canónicas cambian país, bandera y fuente", async ({
    page,
  }) => {
    await page.goto("/peru");
    await expect(
      page.getByRole("heading", { name: "Últimos sismos en Perú" }),
    ).toBeVisible();
    await expect(page.getByLabel("Bandera de Perú").first()).toBeVisible();

    await page
      .getByRole("link", { name: /Colombia/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/colombia$/);
    await expect(
      page.getByRole("heading", { name: "Últimos sismos en Colombia" }),
    ).toBeVisible();
    await expect(page.getByLabel("Bandera de Colombia").first()).toBeVisible();
    await expect(page.getByTestId("source-badge").first()).toContainText(
      "Servicio Geológico Colombiano",
    );
  });

  test("robots y sitemap publican las rutas de ambos países", async ({
    request,
  }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("/sitemap.xml");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const body = await sitemap.text();
    expect(body).toContain("/peru");
    expect(body).toContain("/colombia");
  });
});

test.describe("V2: del evento a las ondas", () => {
  test("un evento M4.5+ muestra estaciones y abre el visor Z/N/E", async ({
    page,
  }) => {
    await page.goto(`/sismos/${KNOWN_EVENT}`);
    await expect(page.getByTestId("event-header")).toContainText(/M \d+\.\d/);
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
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      const cells = rows.nth(index).locator("td");
      const official = Number(await cells.nth(0).innerText());
      const calculated = Number(await cells.nth(1).innerText());
      expect(Math.abs(official - calculated)).toBeLessThanOrEqual(0.0001);
    }
    await expect(
      page.getByRole("heading", { name: "Análisis de frecuencia" }),
    ).toBeVisible();
    await expect(page.getByTestId("frequency-spectrum")).toContainText(
      "Espectro de Fourier",
    );
    await expect(page.getByTestId("spectrogram")).toContainText(
      "Espectrograma",
    );
    await page.getByText("Alternativa tabular del análisis").click();
    await expect(page.getByTestId("frequency-table")).toContainText(
      "Frecuencia dominante",
    );
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

  test("Colombia abre el año completo y conserva meses sin resultados", async ({
    page,
  }) => {
    await page.goto("/colombia/sismos");
    await expect(page.getByLabel("Este año")).toBeChecked();
    await expect(page.locator('input[name="minMagnitude"]')).toHaveValue("3");
    const summary = page.getByTestId("activity-summary");
    await expect(summary).toContainText("Ene");
    await expect(summary).toContainText("Feb");
    await expect(summary).toContainText("Mar");
    await expect(summary).toContainText(
      "Los meses sin resultados en la consulta se muestran en cero.",
    );
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

  test("la API rechaza filtros SGC no numéricos antes de consultar el origen", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/v1/events?provider=sgc&since=ytd&minMagnitude=abc",
    );
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_INPUT" },
    });
  });
});

test.describe("V6-V7: Aula Sísmica", () => {
  test("el Aula publica las cuatro lecciones del roadmap", async ({ page }) => {
    await page.goto("/aula");
    const list = page.getByTestId("lesson-list");
    await expect(list.getByRole("link")).toHaveCount(4);
    await expect(list).toContainText("Profundidad, distancia y sacudida");
    await expect(list).toContainText("Qué representan Z, N, E y PGA");
    await expect(list).toContainText(
      "Predicción, pronóstico y alerta temprana",
    );
    await expect(list).not.toContainText("Próximamente");
  });

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

  test("la lección de alerta distingue información posterior de predicción", async ({
    page,
  }) => {
    await page.goto("/aula/prediccion-pronostico-y-alerta-temprana");
    await expect(
      page.getByRole("heading", {
        name: "Predicción, pronóstico y alerta temprana",
      }),
    ).toBeVisible();
    await expect(page.getByTestId("lesson-event")).toContainText(
      "después de ocurrir",
    );
    await expect(
      page.getByRole("link", { name: /Abrir laboratorio/ }),
    ).toHaveCount(0);
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

  test("el comparador pone dos eventos trazables lado a lado", async ({
    page,
  }) => {
    await page.goto("/aula/comparador?a=ran-20260468&b=ran-20260447");
    const comparison = page.getByTestId("event-comparison");
    await expect(comparison).toBeVisible();
    await expect(comparison).toContainText("Chupaca");
    await expect(comparison).toContainText("Ica");
    await expect(comparison).toContainText("Magnitud");
    await expect(comparison).toContainText("Profundidad");
    await expect(
      page.getByTestId("event-comparison-explanation"),
    ).toContainText("EXPLICACIÓN");
  });
});

test.describe("V8-V9: Verifica Sismos", () => {
  test("el header móvil mantiene la marca y agrupa la navegación", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/verifica");

    const header = page.getByTestId("site-header");
    await expect(header.getByText("Sismo Abierto")).toBeVisible();
    await expect(page.getByTestId("desktop-nav")).toBeHidden();

    const menu = page.getByTestId("mobile-nav-toggle");
    await expect(menu).toBeVisible();
    await menu.click();

    const mobileNav = page.getByTestId("mobile-nav");
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByText("Developers")).toBeVisible();
    await expect(mobileNav.getByText("GitHub")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth === window.innerWidth,
      ),
    ).toBe(true);
  });

  test("el índice separa los reportes de sus tablas", async ({ page }) => {
    await page.goto("/verifica");
    await expect(page.getByTestId("claim-ledger")).toHaveCount(0);
    const panoramas = page.getByTestId("panorama-report-list");
    await expect(panoramas.getByTestId("panorama-report-row")).toHaveCount(6);
    await expect(panoramas).toContainText("3 al 11 de agosto");
    await expect(page.getByText("44 predicciones")).toBeVisible();
    await expect(
      page.getByTestId("prediction-interpretation-note"),
    ).toContainText(
      "Ninguna coincidencia aislada establece capacidad predictiva",
    );
  });

  test("un panorama muestra su tabla y permite cambiar de reporte", async ({
    page,
  }) => {
    await page.goto("/verifica/panoramas/2026-07-20");
    const ledger = page.getByTestId("claim-ledger");
    await expect(ledger.locator("tbody tr")).toHaveCount(8);
    await expect(ledger).toContainText("Coincidencia estricta");
    await expect(ledger).toContainText("Geografía ambigua");
    await expect(ledger).toContainText(/\d+\.\d%/);
    await expect(ledger).toContainText("26 jul 2026");
    await expect(ledger).not.toContainText("T23:59:59");
    await expect(ledger).not.toContainText("STRICT_HIT");

    const p4 = page.getByTestId("claim-row").filter({ hasText: "P4" });
    await expect(p4).toContainText("+3 destinos");
    await p4.getByText("+3 destinos").click();
    await expect(p4).toContainText("Japón, Filipinas o Indonesia");

    await page
      .getByRole("combobox", { name: "Cambiar reporte" })
      .selectOption("/verifica/panoramas/2026-07-27");
    await expect(page).toHaveURL(/\/verifica\/panoramas\/2026-07-27$/);
    await expect(page.getByTestId("claim-row")).toHaveCount(8);
    await expect(page.getByTestId("panorama-report")).toContainText(
      "Tayikistán",
    );
  });

  test("el panorama vigente conserva fuente, siete puntos y registro prospectivo", async ({
    page,
  }) => {
    await page.goto("/verifica/panoramas/2026-08-03");
    await expect(page.getByTestId("claim-row")).toHaveCount(7);
    await expect(page.getByTestId("panorama-report")).toContainText(
      "antes del cierre de sus ventanas",
    );
    await expect(page.getByTestId("panorama-report")).toContainText(
      "DbkO0JMpRXs",
    );
    await expect(page.getByTestId("claim-ledger")).toContainText("12 ago 2026");
  });

  test("una afirmación muestra criterios congelados, tasa base y evidencia", async ({
    page,
  }) => {
    await page.goto("/verifica/P1");
    await expect(page.getByTestId("frozen-claim")).toContainText("Michoacán");
    await expect(page.getByTestId("criteria-table")).toContainText(
      "[3.9, 4.4] inclusivo",
    );
    await expect(page.getByTestId("verdict")).toContainText(
      "Resultado de coincidencia: Coincidencia estricta",
    );
    await expect(page.getByTestId("combined-interpretation")).toContainText(
      "7.4%",
    );
    await expect(page.getByTestId("combined-interpretation")).toContainText(
      "Poco esperable según el histórico",
    );
    await expect(page.getByTestId("baseline-chart")).toContainText(
      "Control contra azar",
    );
    await expect(page.getByTestId("evidence-links")).toContainText(
      "Consulta de tasa base",
    );
  });

  test("una coincidencia muy esperable no parece una predicción validada", async ({
    page,
  }) => {
    await page.goto("/verifica/P6");
    const interpretation = page.getByTestId("combined-interpretation");
    await expect(interpretation).toContainText(/\d+\.\d%/);
    await expect(interpretation).toContainText("Esperable sin predicción");
    await expect(interpretation).toContainText(
      "Capacidad predictiva: no establecida",
    );
    await expect(page.getByTestId("verdict")).not.toContainText("STRICT_HIT");
  });

  test("el registro lista diez informes históricos aparte de los panoramas", async ({
    page,
  }) => {
    await page.goto("/verifica");
    const reports = page.getByTestId("historical-report-list");
    await expect(reports.getByTestId("historical-report-row")).toHaveCount(10);
    await expect(reports).toContainText("Informe 244");
    await expect(reports).toContainText("Informe 256");
    await expect(reports).toContainText("4 puntos pendientes");
    await expect(reports).toContainText("coincidencias");
  });

  test("se puede navegar entre informes y revisar la evidencia de cada punto", async ({
    page,
  }) => {
    await page.goto("/verifica/informes/246");
    await expect(page.getByTestId("historical-report")).toContainText(
      "Informe 246",
    );
    await expect(page.getByTestId("claim-row")).toHaveCount(4);
    const evidence = page.getByText("Ver evidencia").first();
    await evidence.click();
    await expect(page.getByText("Geografía ambigua:").first()).toBeVisible();

    await page
      .getByRole("combobox", { name: "Cambiar reporte" })
      .selectOption("/verifica/informes/249");
    await expect(page).toHaveURL(/\/verifica\/informes\/249$/);
    await expect(
      page.getByRole("heading", { name: "Informe 249" }),
    ).toBeVisible();
    await expect(page.getByTestId("claim-row")).toHaveCount(4);
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
    ).toHaveCount(9);
    await expect(page.getByTestId("status-legend")).toContainText(
      "OPERATIONAL",
    );
  });
});
