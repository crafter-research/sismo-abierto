/**
 * Ingesta capas de INGEMMET (GEOCATMIN) a Neon.
 *
 *   DATABASE_URL=... bun scripts/ingest-ingemmet.ts ingemmet-fallas
 *   bun scripts/ingest-ingemmet.ts ingemmet-geomorfologia --dry-run
 *
 * Licencia: INGEMMET autorizó por escrito (2026-08-20) la descarga,
 * almacenamiento, procesamiento, transformación, integración y publicación de
 * su información geoespacial pública, incluido su uso en proyectos de código
 * abierto, con tres condiciones: atribución visible, no atribuirle
 * responsabilidad sobre productos derivados, y trazabilidad con fecha de
 * consulta. Las tres viajan con el dato (`attribution`, `fetched_at`).
 */
import {
  INGEMMET_LAYERS,
  IngemmetStore,
  ingestLayer,
} from "../packages/terrain/src/index.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const wanted = args.find((arg) => !arg.startsWith("--"));

const layer = INGEMMET_LAYERS.find((candidate) => candidate.id === wanted);
if (!layer) {
  console.error(
    `Uso: bun scripts/ingest-ingemmet.ts <${INGEMMET_LAYERS.map((l) => l.id).join("|")}> [--dry-run]`,
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && !dryRun) {
  console.error("Falta DATABASE_URL. Para probar sin base: --dry-run");
  process.exit(1);
}

const store = databaseUrl && !dryRun ? new IngemmetStore(databaseUrl) : null;
const capturedAt = new Date().toISOString();
const runId = `${layer.id}-${capturedAt}`;

console.log(`${layer.label} (${layer.id})`);
if (store) {
  await store.migrate();
  // El id lleva el timestamp: cada corrida queda como fila propia en vez de
  // pisar la anterior, así el historial de ingestas sobrevive.
  await store.startRun({ id: runId, layerId: layer.id, startedAt: capturedAt });
  await store.clearLayer(layer.id);
}

let written = 0;
let declared = 0;
try {
  const result = await ingestLayer(layer, async (features, done, total) => {
    declared = total;
    if (store) await store.insertBatch(features, capturedAt);
    written += features.length;
    if (done % 5_000 < features.length || done === total) {
      console.log(`  ${done}/${total}`);
    }
  });
  declared = result.total;
} catch (error) {
  const note = error instanceof Error ? error.message : String(error);
  if (store) {
    await store.finishRun(runId, {
      finishedAt: new Date().toISOString(),
      declaredCount: declared,
      featureCount: written,
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
    declaredCount: declared,
    featureCount: written,
    status: "ok",
  });
}

console.log(
  `\n${written}/${declared} features ${dryRun ? "(dry-run, nada escrito)" : "escritos en Neon"}`,
);
console.log(`Fuente: INGEMMET · consultado ${capturedAt}`);
