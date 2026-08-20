/**
 * Ingesta una dimensión de terreno del WFS del IGP a Neon.
 *
 *   DATABASE_URL=... bun scripts/ingest-terrain.ts CapacidadPortante
 *   bun scripts/ingest-terrain.ts CapacidadPortante --dry-run
 *
 * Licencia: el GetCapabilities del IGP declara `Fees: NONE` y
 * `AccessConstraints: NONE` (verificado 2026-08-19), así que almacenar y
 * republicar esta capa está autorizado por la propia fuente.
 */
import {
  buildGetCapabilitiesUrl,
  ingestDimension,
  layersForDimension,
  NeonTerrainStore,
  TERRAIN_DIMENSIONS,
  type TerrainDimension,
} from "../packages/terrain/src/index.ts";

/**
 * Un id de procedencia por dimensión. Estaba fijo en `capacidad-portante`, así
 * que toda dimensión ingerida quedaba etiquetada con la fuente equivocada.
 */
const SOURCE_IDS: Record<TerrainDimension, string> = {
  CapacidadPortante: "igp-wfs-capacidad-portante",
  ZonificacionSismica: "igp-wfs-zonificacion",
  Suelos: "igp-wfs-suelos",
  Geologia: "igp-wfs-geologia",
  Geomorfologia: "igp-wfs-geomorfologia",
  Geodinamica: "igp-wfs-geodinamica",
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dimension = args.find((arg) => !arg.startsWith("--")) as
  | TerrainDimension
  | undefined;

if (!dimension || !TERRAIN_DIMENSIONS.includes(dimension)) {
  console.error(
    `Uso: bun scripts/ingest-terrain.ts <${TERRAIN_DIMENSIONS.join("|")}> [--dry-run]`,
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && !dryRun) {
  console.error("Falta DATABASE_URL. Para probar sin base: --dry-run");
  process.exit(1);
}

const capabilities = await (await fetch(buildGetCapabilitiesUrl())).text();
const layers = layersForDimension(capabilities, dimension);
console.log(`${dimension}: ${layers.length} capas por ciudad`);

const store = databaseUrl ? new NeonTerrainStore(databaseUrl) : null;
const runId = `${dimension}-${new Date().toISOString()}`;
const startedAt = new Date().toISOString();

if (store) {
  await store.migrate();
  await store.startRun({
    id: runId,
    dimension,
    sourceId: SOURCE_IDS[dimension],
    startedAt,
    layersExpected: layers.length,
  });
}

let featureCount = 0;
let ingested = 0;
let shortfall = 0;
try {
  const results = await ingestDimension(layers, fetch, (result) => {
    const gap =
      result.shortfall > 0 ? ` (faltan ${result.shortfall} en la fuente)` : "";
    console.log(`  ${result.city}: ${result.features.length}${gap}`);
  });
  for (const result of results) {
    if (store) {
      await store.replaceLayer(
        result.layer,
        result.features,
        SOURCE_IDS[dimension],
        new Date().toISOString(),
      );
    }
    featureCount += result.features.length;
    shortfall += result.shortfall;
    ingested++;
  }
} catch (error) {
  const note = error instanceof Error ? error.message : String(error);
  if (store) {
    await store.finishRun(runId, {
      finishedAt: new Date().toISOString(),
      layersIngested: ingested,
      featureCount,
      status: "failed",
      note,
    });
  }
  console.error(`\nCorrida abortada: ${note}`);
  process.exit(1);
}

if (shortfall > 0) {
  console.warn(
    `\nAviso: la fuente declaró ${shortfall} feature(s) que nunca entregó (ver LAYERS_WITH_SOURCE_SHORTFALL).`,
  );
}

if (store) {
  await store.finishRun(runId, {
    finishedAt: new Date().toISOString(),
    layersIngested: ingested,
    featureCount,
    status: "ok",
    ...(shortfall > 0
      ? {
          note: `${shortfall} feature(s) declarados y no entregados por la fuente`,
        }
      : {}),
  });
}

console.log(
  `\n${ingested}/${layers.length} capas · ${featureCount} features` +
    (dryRun || !store ? " (dry-run, nada escrito)" : " escritos en Neon"),
);
