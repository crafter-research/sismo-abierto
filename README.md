<div align="center">
  <img src="assets/logo.svg" alt="Sismo Abierto" width="80" height="80" />

  <h1>Sismo Abierto</h1>

  <p><strong>Del epicentro oficial a cómo se movió realmente el suelo.</strong></p>

  <p>
    Ecosistema open source sobre los datos sísmicos, acelerométricos y volcánicos
    públicos del Instituto Geofísico del Perú (IGP).
  </p>

  <p>
    <a href="https://github.com/crafter-research/sismo-abierto/actions/workflows/ci.yml"><img src="https://github.com/crafter-research/sismo-abierto/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="https://github.com/crafter-research/sismo-abierto/actions/workflows/source-drift.yml"><img src="https://github.com/crafter-research/sismo-abierto/actions/workflows/source-drift.yml/badge.svg" alt="Source Drift" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-black" alt="MIT" /></a>
  </p>

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/screenshot-dark.png" />
    <img src="assets/screenshot-light.png" alt="Sismo Abierto: último sismo oficial sobre el mapa del Perú" width="820" />
  </picture>
</div>

> [!IMPORTANT]
> Proyecto comunitario, **no oficial**. Fuente de datos: IGP. No es un sistema de
> alerta ni de predicción, y no reemplaza los canales oficiales.

## Qué incluye

Seis productos sobre un mismo núcleo de datos normalizado y trazable:

| Producto | Ruta | Qué hace |
|----------|------|----------|
| **Sismos** | `/`, `/sismos/*` | Último sismo oficial, catálogo filtrable, estaciones acelerométricas y ondas Z/N/E |
| **API** | `/api` | Contrato OpenAPI 3.1 con referencia interactiva (Scalar) |
| **CLI** | `sismo` | Los mismos datos desde terminal, con exports JSON/GeoJSON/CSV |
| **Aula** | `/aula/*` | Lecciones y laboratorios construidos sobre eventos reales |
| **Verifica** | `/verifica/*` | Afirmaciones virales congeladas y auditadas contra catálogos oficiales y azar |
| **Volcanes** | `/volcanes/*` | Los 16 registros volcánicos publicados, con frescura explícita |
| **Fuentes** | `/fuentes/*` | Confiabilidad observada de cada fuente pública, desde el consumidor |

## Principios de confianza

- Cada valor se clasifica: `OFICIAL`, `DERIVADO`, `EXPLICACIÓN` o `NO DISPONIBLE`.
- Cada respuesta incluye fuente, URL oficial, hora de consulta con zona horaria y limitaciones.
- Si una fuente no publica fecha de actualización, se muestra `FRESHNESS_UNKNOWN` — nunca se
  infiere vigencia.
- Un fallo de fuente es un estado visible, nunca datos vacíos que parecen válidos.
- Los datasets se consultan en origen y no se redistribuyen; la caché es solo técnica.
- Las afirmaciones de Verifica se congelan **antes** de conocer el resultado, con protocolo
  y tasa base publicados.

## Quickstart

Requiere [Bun](https://bun.sh).

```bash
git clone https://github.com/crafter-research/sismo-abierto
cd sismo-abierto
bun install
bun run dev        # web en http://localhost:3000
```

```bash
bun run check      # biome + typecheck
bun run test       # tests de unidades y contrato
bun run test:e2e   # journeys de Playwright
bun run build      # build de producción
bun run drift      # linter de contratos contra las fuentes en vivo
```

### CLI

```bash
bun apps/cli/src/main.ts latest
bun apps/cli/src/main.ts events --since 7d --min-magnitude 4 --format geojson
bun apps/cli/src/main.ts stations ran-20260468 --sort pga
bun apps/cli/src/main.ts waveform ran-20260468 SCHYO --format csv --output onda.csv
bun apps/cli/src/main.ts sources --probe
bun apps/cli/src/main.ts schema events
```

Salida humana en tablas; `--json`, `--geojson`, `--csv` y `schema` sin decoración. Errores a stderr
con códigos de salida estables (`0` ok · `2` input inválido · `3` no encontrado · `4` fuente
caída o contrato roto). `--open` abre la fuente oficial del dato en el navegador.

### Coding agents

```bash
npx skills add crafter-research/sismo-abierto
```

Instala la skill [`sismo-cli`](skills/sismo-cli/SKILL.md) para que tu agente (Claude Code,
Cursor, Codex…) sepa operar cada vertical con salida JSON, exit codes estables y procedencia
en cada respuesta. En runtime, `sismo skill` imprime la misma documentación.

## Linter de contratos externos

Las fuentes del IGP no publican SLA ni changelog. El paquete `@sismo/source-health` valida
cada respuesta campo por campo contra el contrato observado (esquemas zod por fuente) y
distingue:

- `ROTO` — un campo requerido desapareció o cambió de tipo → estado `SCHEMA_CHANGED`.
- `NUEVO` — la fuente agregó campos → no rompe, pero queda reportado en la evidencia.

El workflow [`source-drift.yml`](.github/workflows/source-drift.yml) lo corre cada 6 horas
contra las fuentes reales; si un contrato se rompe, el workflow falla y lo ves antes que tus
usuarios.

Cada fuente expone un badge SVG cacheable en
`/api/v1/sources/{sourceId}/badge.svg`, por ejemplo:

![Estado observado de ACELDAT](https://sismo.crafter.run/api/v1/sources/igp-aceldat/badge.svg)

## Arquitectura

```text
apps/web                 Next.js (App Router, Server Components, Tailwind)
apps/cli                 paquete canónico `@crafter/sismo-cli`
apps/cli-alias           release preparado del alias no scoped `sismo`
packages/contracts       modelo normalizado, esquemas zod y documento OpenAPI
packages/data            adaptadores server-side con timeouts, retries y caché
packages/waveforms       parser ACELDAT, métricas sobre serie completa, reducción visual
packages/audit           afirmaciones congeladas, geografía, ventanas, tasa base, veredictos
packages/volcanoes       contenido educativo de niveles volcánicos
packages/source-health   probes, linter de contratos, estados deterministas, stores
content/aula             lecciones versionadas
data/predictions         afirmaciones congeladas (inmutables; cambios auditados en git)
```

Fuentes consumidas: IDE ArcGIS/GeoServer del IGP, catálogo CENSIS, ACELDAT-PERÚ, REGEN y
USGS FDSN (solo contraste global). El comportamiento observado de cada una está documentado
en [`docs/implementation-status.md`](docs/implementation-status.md).

## Roadmap

Ver [ROADMAP.md](ROADMAP.md).

## Contribuir

¿Eres especialista y algo está mal interpretado? Abre un issue con la etiqueta
`corrección-científica` — la exactitud y la atribución al IGP van primero. Las nuevas
afirmaciones para Verifica entran por PR con evidencia temporal previa al resultado.

## Licencia

[MIT](LICENSE) © Crafter Research. Los datos pertenecen a sus fuentes oficiales y se
consultan en origen.
