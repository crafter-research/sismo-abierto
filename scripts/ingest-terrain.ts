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

const SOURCE_ID = "igp-wfs-capacidad-portante";

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
    sourceId: SOURCE_ID,
    startedAt,
    layersExpected: layers.length,
  });
}

let featureCount = 0;
let ingested = 0;
try {
  const results = await ingestDimension(layers, fetch, (result) => {
    console.log(`  ${result.city}: ${result.features.length}`);
  });
  for (const result of results) {
    if (store) {
      await store.replaceLayer(
        result.layer,
        result.features,
        SOURCE_ID,
        new Date().toISOString(),
      );
    }
    featureCount += result.features.length;
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

if (store) {
  await store.finishRun(runId, {
    finishedAt: new Date().toISOString(),
    layersIngested: ingested,
    featureCount,
    status: "ok",
  });
}

console.log(
  `\n${ingested}/${layers.length} capas · ${featureCount} features` +
    (dryRun || !store ? " (dry-run, nada escrito)" : " escritos en Neon"),
);
