/**
 * Pregenera vector tiles (MVT) de geomorfología nacional (INGEMMET) a disco.
 *
 *   DATABASE_URL=... bun scripts/build-terrain-tiles.ts
 *   DATABASE_URL=... bun scripts/build-terrain-tiles.ts --zoom 5-6   # subrango, para probar rapido
 *
 * Por qué pregenerar y no servir por request: medido 2026-08-20, un z6 sin
 * simplificar tarda 17.5s por tile. Ver `packages/terrain/src/tile-config.ts`
 * para la tabla completa de pesos y el razonamiento del rango de zoom
 * elegido (z5-z9).
 *
 * Los tiles se escriben a `apps/web/public/tiles/terreno/geomorfologia/` y
 * se sirven como archivos estáticos de Next (`public/`). Ese directorio está
 * en `.gitignore`: no se commitea contenido generado pesado. El total medido
 * (~29MB estimados para z5-z9) entra cómodo en el límite de deployment de
 * Vercel, así que no hace falta R2 para este tamaño.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  buildSubunidadCategoryLookup,
  PERU_BBOX,
  SIMPLIFY_TOLERANCE_BY_ZOOM,
  TerrainTileStore,
  TILE_MAX_ZOOM,
  TILE_MIN_ZOOM,
  tileRangeForBbox,
  tileRelativePath,
} from "../packages/terrain/src/index.ts";

const args = process.argv.slice(2);
const zoomArg =
  args.find((arg) => arg.startsWith("--zoom"))?.split("=")[1] ??
  (args.includes("--zoom") ? args[args.indexOf("--zoom") + 1] : undefined);

let minZoom = TILE_MIN_ZOOM;
let maxZoom = TILE_MAX_ZOOM;
if (zoomArg) {
  // Un argumento mal formado no puede caer al rango completo en silencio: son
  // ~45 minutos de generacion que nadie pidio. `--zoom 5,6,7` daba NaN y
  // terminaba corriendo z5-z9 entero.
  const parts = zoomArg.split("-").map(Number);
  const [lo, hi] = parts;
  if (parts.length > 2 || !parts.every((n) => Number.isInteger(n))) {
    console.error(
      `Rango de zoom invalido: "${zoomArg}". Se espera "8" o "5-7", no una lista.`,
    );
    process.exit(1);
  }
  minZoom = lo as number;
  maxZoom = hi === undefined ? (lo as number) : hi;
  if (minZoom > maxZoom) {
    console.error(`Rango de zoom invertido: "${zoomArg}".`);
    process.exit(1);
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Falta DATABASE_URL.");
  process.exit(1);
}

const OUTPUT_ROOT = join(import.meta.dir, "..", "apps", "web", "public");

const store = new TerrainTileStore(databaseUrl);

console.log(
  `Generando tiles de geomorfología z${minZoom}-${maxZoom}, bbox Perú (${PERU_BBOX.minLon},${PERU_BBOX.minLat}) a (${PERU_BBOX.maxLon},${PERU_BBOX.maxLat})`,
);

const subunidades = await store.distinctSubunidades();
const categoryBySubunidad = buildSubunidadCategoryLookup(subunidades);
console.log(
  `  ${subunidades.length} SUBUNIDAD distintas agrupadas en categorías legibles`,
);

let totalTiles = 0;
let totalBytes = 0;
let totalSkippedEmpty = 0;
const startedAt = performance.now();

for (let z = minZoom; z <= maxZoom; z++) {
  const tolerance = SIMPLIFY_TOLERANCE_BY_ZOOM[z];
  if (tolerance === undefined) {
    console.error(`Sin tolerancia definida para z${z}, saltando.`);
    continue;
  }
  const { xMin, xMax, yMin, yMax } = tileRangeForBbox(PERU_BBOX, z);
  const rangeTiles = (xMax - xMin + 1) * (yMax - yMin + 1);
  console.log(`\nz${z}: ${rangeTiles} tiles candidatos (tol=${tolerance}m)`);

  let zoomTiles = 0;
  let zoomBytes = 0;
  const zoomStart = performance.now();

  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      const mvt = await store.mvt(z, x, y, tolerance, categoryBySubunidad);
      if (!mvt) {
        totalSkippedEmpty += 1;
        continue;
      }
      const relPath = tileRelativePath(z, x, y);
      const fullPath = join(OUTPUT_ROOT, relPath);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, mvt);
      zoomTiles += 1;
      zoomBytes += mvt.length;
    }
  }

  totalTiles += zoomTiles;
  totalBytes += zoomBytes;
  const zoomSeconds = (performance.now() - zoomStart) / 1000;
  console.log(
    `  z${z} listo: ${zoomTiles} tiles escritos (${(zoomBytes / 1024).toFixed(1)} KB), ${zoomSeconds.toFixed(1)}s`,
  );
}

const totalSeconds = (performance.now() - startedAt) / 1000;
console.log(
  `\n${totalTiles} tiles escritos, ${(totalBytes / 1024 / 1024).toFixed(2)} MB, ${totalSkippedEmpty} vacíos saltados, ${totalSeconds.toFixed(1)}s total`,
);
