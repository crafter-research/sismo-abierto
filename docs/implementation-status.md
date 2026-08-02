# Implementation status

Última actualización: 2026-08-02 00:38 aprox. (America/Lima). Implementación completa; ver checklist. Este documento separa Evidence, Inference y Unknown, y lleva el checklist de slices.

## Evidence (observado en vivo, 2026-07-20/21 UTC)

Todas las observaciones crudas viven en `docs/evidence/live-observations/`.

| Fuente | Observación | HTTP | Latencia | Archivo |
|--------|-------------|------|----------|---------|
| ArcGIS UltimoSismo | FeatureCollection, 1 feature (M4.3, 20/07/2026 06:51:15 local, 44 km al S de Ica, prof. 59 km) | 200 | 0.54s | `arcgis-latest.json` |
| WFS ultimo_sismo | Mismo evento, incluye `timeStamp` de respuesta del GeoServer | 200 | 0.43s | `wfs-latest.json` |
| WFS catalogo_instrumental | 3 features de muestra, datos terminan en 2024 (`year: 2024`) | 200 | 0.34s | `wfs-instrumental-sample.json` |
| CENSIS XLSX | XLSX válido, hoja "IGP - Datos sísmicos", header `fecha UTC, hora UTC, latitud (º), longitud (º), profundidad (km), magnitud (M)`, 85 filas jul 1-20 | 200 | 0.41s | `censis-jul2026.xlsx` |
| ACELDAT `POST /ran/reportes2` | JSON array de reportes: `numeroReporte`, `fechaHora` (Mongo extended JSON `$date.$numberLong`), `magnitud`, `referencia` | 200 | — | `aceldat-reportes2.json` |
| ACELDAT `POST /ran/breadcrumbstations2` body `{"datetime":"20260719_022434"}` | Evento (`num`, `fec` UTC ISO, `pos` GeoJSON, `mag`, `pro`, `int`, `ref`) + `stats[]` con `net`, `cod`, `nom`, `pos`, `typ` (`acc` = acelerométrica con archivo, `sis` = sísmica), `order` | 200 | — | `aceldat-breadcrumbstations2.json` |
| ACELDAT `GET /ran/file/{num}_{datetime}_{cod}_{net}.txt` | Texto: 3 secciones de header (estación, sismo, registro con PGA Z/N/E, muestreo 200/s, unidades cm/s2, nº muestras) + tabla de 3 columnas Z N E | 200 | 1.0s (2 MB) | `aceldat-schyo-raw.txt` |
| WFS Actividad_volcanica | 16 features. Campos: `objectid, longitud, latitud, nivel, alerta, region, resena, volcan, name`. SIN timestamp por feature | 200 | 0.41s | `volcano-wfs.json` |
| WFS Actividad_volcanica DescribeFeatureType | Confirma el esquema: NINGÚN campo de fecha. El namespace `CTS_alertavolcan` expone solo esa capa | 200 | — | `volcano-describe.json`, `volcano-capabilities.xml` |
| REGEN DSpace | 2,953 objetos, `dc.title` y `dc.date.issued` presentes | 200 | 1.2s | `regen-sample.json` |
| USGS FDSN | GeoJSON válido, 32 eventos M4+ el 19 jul | 200 | 3.9s | `usgs-sample.json` |

Notas de evidencia:

- La base de ACELDAT es `https://www.igp.gob.pe/servicios/api-acelerometrica`. Los endpoints `reportes2` y `breadcrumbstations2` son POST con JSON; fueron descubiertos en el bundle público de la SPA (`aceldat-app.js` guardado como evidencia). No están documentados: tratar como contrato inestable.
- El `datetime` de ACELDAT es la hora UTC del evento con formato `YYYYMMDD_HHmmss`.
- El listado HTML de ACELDAT es una SPA Vue; el HTML no contiene datos (server-side scraping de HTML no sirve, la API sí).
- CENSIS XLSX entrega valores como strings; celdas inline, sin estilos complejos.

## Inference

- `typ: "acc"` en `breadcrumbstations2` indica estaciones con archivo crudo descargable; `sis` son estaciones sísmicas de contexto sin archivo ACELDAT. Se infiere del patrón de nombres de archivo (`{num}_{datetime}_{cod}_{net}.txt` con la estación `acc` SCHYO_SC verificada) y se valida por HTTP al construir enlaces.
- El PGA del header de ACELDAT corresponde al máximo absoluto de cada componente de la serie; el parser lo recalcula y compara (test de tolerancia).
- Los endpoints pueden cambiar sin aviso: cada adapter registra `observedAt` y valida esquema con errores tipados.

## Unknown (bloqueantes explícitos, no inventar)

- Términos exactos de redistribución de cada fuente → publicación source-only, caché técnica solamente.
- SLA y rate limits → frecuencias conservadoras, timeouts, user-agent identificable.
- Fuente autoritativa y fecha del nivel volcánico → `FRESHNESS_UNKNOWN`; VA3 BLOQUEADO (spike corrido: DescribeFeatureType sin campo de fecha; no existe mapeo determinista registro→boletín).
- Revisión científica del lenguaje y de las gráficas ACELDAT → el paquete de revisión técnica externa se mantiene fuera del repositorio hasta su envío.
- Outcomes de predicciones: las ocho ventanas cerraron. La auditoría final reproducible está publicada en `data/audits/`.

## Slice checklist

| Slice | Estado | Evidencia | Gap conocido |
|-------|--------|-----------|--------------|
| V1 Último sismo trazable | DONE | `docs/evidence/v1-v2/home-*.png`; verificado en vivo con el M3.5 de Sullana-Piura (21 jul UTC) resuelto vía CENSIS y estado honesto "sin reporte ACELDAT" | El id del último evento depende de que CENSIS ya liste el evento del día |
| V2 Del evento a las ondas | DONE | `docs/evidence/v1-v2/event-ran-20260468-*.png`, `waveform-schyo-*.png`; PGA header = PGA recalculado sobre serie completa (43.7949/64.7735/53.1026) | Escala vertical compartida entre componentes pendiente de validación científica (pregunta 2 del review package) |
| V3 Catálogo reproducible | DONE | `docs/evidence/v3-v5/catalog-filtered-desktop.png`; URL `?since=2026-07-14&minMagnitude=4` restaura la consulta (16 eventos reales) | La referencia geográfica no existe en el XLSX de CENSIS (columna ausente en la fuente) |
| V4 API y CLI para eventos | DONE | `docs/evidence/v3-v5/api-explorer-executed.png`, `cli-events-table.txt`; 9 rutas /v1 vivas; OpenAPI 3.1 en `/api/v1/openapi.json`; contract tests con respuestas reales capturadas | — |
| V5 CLI científico exportable | DONE | `docs/evidence/v3-v5/cli-stations-pga.txt`; GeoJSON con metadatos y CSV de onda con serie completa (39,635 líneas) verificados | `--sort pga` descarga los archivos crudos de las estaciones acc (costo de red alto la primera vez) |
| V6 Primera lección real | DONE | `docs/evidence/v6-v7/lesson-answered-completed.png`; lección con evento real M5.1 Chupaca, pregunta evaluada y completada | Contenido marcado EXPLICACIÓN pendiente de revisión científica |
| V7 Laboratorio sísmico | DONE | `docs/evidence/v6-v7/lab-comparison.png`, `aula-progress.png`; SCHYO (9.7 km, PGA 64.77) vs PNEG (166.5 km, PGA 3.76), URL compartible, progreso local 1/4 | — |
| V8 Registro de afirmaciones | DONE | `docs/evidence/v8-v9/registry.png`; CSV congelado importado sin alterar (sha256 a8cb2aea…), 8 afirmaciones evaluadas | — |
| V9 Auditoría contra evidencia y azar | DONE | `data/audits/`; 4 `STRICT_HIT`, 3 `AMBIGUOUS_GEOGRAPHY`, 1 `NO_MATCH`, 0 `SOURCE_DISAGREEMENT`, 0 `PENDING`; P6 tiene 7 candidatos y tasa base de 98.1% | Un acierto estricto no demuestra capacidad predictiva, especialmente con una tasa base alta |
| VA1 Mapa publicado | DONE | `docs/evidence/va1-va3/volcano-index.png`; 16 registros en vivo con aviso de vigencia | — |
| VA2 Ficha segura | DONE | `docs/evidence/va1-va3/volcano-sabancaya.png`; PUBLISHED_STATE + FRESHNESS_UNKNOWN + explicación EXPLICACIÓN separada | Lenguaje científico sin revisar (paquete de revisión externo, fuera del repo) |
| VA3 Historia documentada | BLOCKED | `docs/spike-volcano-freshness-results.md`, `volcano-describe.json` | Sin timestamp autoritativo ni mapeo determinista de boletines; estado honesto visible en la ficha |
| EF1 Estado interno visible | DONE | `docs/evidence/ef1-ef3/sources-overview.png`, `cli-sources-probe.txt`; 8 probes en vivo con estados deterministas | — |
| EF2 Historia explicable | DONE | `docs/evidence/ef1-ef3/source-aceldat-history.png`, `cli-source-aceldat-evidence.txt`; 10 tests de transiciones y cambios observados | — |
| EF3 Contrato público | CODE-COMPLETE (flag OFF) | `/fuentes` + `/v1/sources` + CLI + Neon store + jobs Trigger.dev | Publicación requiere revisión institucional del lenguaje; `SISMO_FUENTES_PUBLIC` apagado en producción |

## Verificación final (2026-08-02)

- `bun run check` → biome + tsc limpios (root y apps/web).
- `bun run test` → 107 tests, 0 fallos.
- `bun run test:e2e` → 18 journeys Playwright, 0 fallos.
- `bun run build` → Next.js build en verde.
- `bun packages/audit/src/run.ts` → 8 veredictos finales y cinco artefactos reproducibles en `data/audits/`.
- CLI verificado en vivo: latest, events (tabla/json/geojson/csv), inspect, stations --sort pga, waveform (CSV serie completa 39,635 líneas), volcanoes, volcano, sources --probe, source --evidence. Exit codes 0/2/3/4.

## Deuda y gates abiertos

1. VA3 bloqueado (ver spike). EF3 tras flag. Revisión científica pendiente (paquete de revisión externo al repo).
2. Términos de redistribución sin confirmar → publicación source-only se mantiene.
