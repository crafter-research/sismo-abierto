#!/usr/bin/env bun
import { writeFile } from "node:fs/promises";
import { type NormalizedEvent, responseJsonSchemaFor } from "@sismo/contracts";
import {
  buildEventDetailResponse,
  buildEventListResponse,
  buildLatestEventResponse,
  buildStationListResponse,
  buildVolcanoDetailResponse,
  buildVolcanoListResponse,
  fetchAceldatEventDetail,
  fetchAceldatRawFile,
  fetchAceldatReports,
  isSourceError,
  parseRanEventId,
  waveformFileUrl,
} from "@sismo/data";
import {
  getSourceHistory,
  getSourceOverview,
  runSourceChecks,
} from "@sismo/source-health";
import {
  buildWaveformResponse,
  computePga,
  parseAceldatFile,
} from "@sismo/waveforms";
import { numberFlag, type ParsedArgs, parseArgs, stringFlag } from "./args.ts";
import { CliError, EXIT_CODES, renderTable, toCsv } from "./output.ts";
import {
  colorizeStatus,
  dim,
  maybeOpen,
  readSkillDocument,
  withSpinner,
} from "./ux.ts";

const HELP = `sismo — datos sísmicos y volcánicos públicos del IGP, con procedencia

Uso:
  sismo latest [--json] [--open]
  sismo events [--since 7d] [--until YYYY-MM-DD] [--min-magnitude N] [--max-magnitude N] [--format table|json|geojson|csv] [--output archivo]
  sismo inspect EVENT_ID [--json] [--open]
  sismo stations EVENT_ID [--sort distance|pga] [--json]
  sismo waveform EVENT_ID STATION_ID [--format csv|json] [--output archivo] [--open]
  sismo volcanoes [--json]
  sismo volcano VOLCANO_SLUG [--json] [--open]
  sismo sources [--probe] [--json]
  sismo source SOURCE_ID [--evidence] [--json]
  sismo schema COMMAND
  sismo skill

--open abre la fuente oficial (provenance) en el navegador.
Sin TTY o con --json la salida es máquina pura: sin colores ni spinners.

Proyecto comunitario. Fuente de datos: IGP. No es un sistema de alerta ni de predicción.`;

function eventRow(event: NormalizedEvent): string[] {
  return [
    event.id,
    event.timeLocal ?? "—",
    `M ${event.magnitude.toFixed(1)}`,
    `${event.depthKm} km`,
    `${event.latitude}, ${event.longitude}`,
    event.reference ?? "—",
  ];
}

function eventsToGeoJson(
  events: NormalizedEvent[],
  metadata: Record<string, unknown>,
) {
  return {
    type: "FeatureCollection",
    metadata,
    features: events.map((event) => ({
      type: "Feature",
      id: event.id,
      geometry: {
        type: "Point",
        coordinates: [event.longitude, event.latitude],
      },
      properties: {
        timeUtc: event.timeUtc,
        timeLocal: event.timeLocal,
        magnitude: event.magnitude,
        depthKm: event.depthKm,
        reference: event.reference,
        source: event.provenance.source.name,
        fetchedAt: event.provenance.fetchedAt,
      },
    })),
  };
}

async function writeOutput(content: string, args: ParsedArgs): Promise<void> {
  const output = stringFlag(args, "output");
  if (output) {
    await writeFile(output, `${content}\n`);
    console.log(`Exportado a ${output}`);
  } else {
    console.log(content);
  }
}

async function commandLatest(args: ParsedArgs): Promise<void> {
  const response = await withSpinner(
    args,
    "Consultando último sismo oficial",
    () => buildLatestEventResponse(),
  );
  await maybeOpen(args, response.event.provenance.source.url);
  if (args.flags.get("json")) {
    console.log(JSON.stringify(response, null, 2));
    return;
  }
  const event = response.event;
  console.log(
    renderTable(
      ["Campo", "Valor"],
      [
        ["Evento", event.id],
        ["Magnitud", `M ${event.magnitude.toFixed(1)}`],
        ["Hora local", event.timeLocal ?? "—"],
        ["Profundidad", `${event.depthKm} km`],
        ["Referencia", event.reference ?? "—"],
        ["Intensidad", event.intensity ?? "—"],
        ["Fuente", event.provenance.source.name],
        ["Consultado", event.provenance.fetchedAt],
      ],
    ),
  );
}

async function commandEvents(args: ParsedArgs): Promise<void> {
  const format = stringFlag(args, "format") ?? "table";
  const response = await withSpinner(args, "Consultando catálogo CENSIS", () =>
    buildEventListResponse({
      since: stringFlag(args, "since"),
      until: stringFlag(args, "until"),
      minMagnitude: numberFlag(args, "min-magnitude"),
      maxMagnitude: numberFlag(args, "max-magnitude"),
    }),
  );
  const metadata = {
    source: response.provenance.source.name,
    sourceUrl: response.provenance.source.url,
    fetchedAt: response.provenance.fetchedAt,
    timezone: response.provenance.timezone,
    limitations: response.limitations,
  };
  switch (format) {
    case "table":
      console.log(
        renderTable(
          ["ID", "Hora local", "Mag", "Prof", "Coordenadas", "Referencia"],
          response.events.map(eventRow),
        ),
      );
      console.log(
        dim(
          `\n${response.events.length} eventos · Fuente: ${metadata.source} · Consultado: ${metadata.fetchedAt}`,
        ),
      );
      return;
    case "json":
      await writeOutput(JSON.stringify(response, null, 2), args);
      return;
    case "geojson":
      await writeOutput(
        JSON.stringify(eventsToGeoJson(response.events, metadata), null, 2),
        args,
      );
      return;
    case "csv": {
      const header = [
        `# fuente: ${metadata.source}`,
        `# consultado: ${metadata.fetchedAt} (${metadata.timezone})`,
      ].join("\n");
      const csv = toCsv(
        [
          "id",
          "time_utc",
          "time_local",
          "magnitude",
          "depth_km",
          "latitude",
          "longitude",
        ],
        response.events.map((event) => [
          event.id,
          event.timeUtc,
          event.timeLocal,
          event.magnitude,
          event.depthKm,
          event.latitude,
          event.longitude,
        ]),
      );
      await writeOutput(`${header}\n${csv}`, args);
      return;
    }
    default:
      throw new CliError(
        `Formato "${format}" no soportado. Usa table, json, geojson o csv.`,
        EXIT_CODES.invalidInput,
      );
  }
}

async function commandInspect(args: ParsedArgs): Promise<void> {
  const eventId = args.positional[1];
  if (!eventId)
    throw new CliError(
      "Falta EVENT_ID. Uso: sismo inspect EVENT_ID",
      EXIT_CODES.invalidInput,
    );
  const response = await withSpinner(args, "Consultando evento", () =>
    buildEventDetailResponse(eventId),
  );
  await maybeOpen(args, response.event.provenance.source.url);
  if (args.flags.get("json")) {
    console.log(JSON.stringify(response, null, 2));
    return;
  }
  const event = response.event;
  console.log(
    renderTable(
      ["Campo", "Valor", "Clase"],
      [
        ["Evento", event.id, ""],
        [
          "Magnitud",
          `M ${event.magnitude.toFixed(1)}`,
          event.fieldClasses.magnitude ?? "",
        ],
        ["Hora UTC", event.timeUtc ?? "—", event.fieldClasses.timeUtc ?? ""],
        [
          "Hora local",
          event.timeLocal ?? "—",
          event.fieldClasses.timeLocal ?? "",
        ],
        [
          "Profundidad",
          `${event.depthKm} km`,
          event.fieldClasses.depthKm ?? "",
        ],
        [
          "Coordenadas",
          `${event.latitude}, ${event.longitude}`,
          event.fieldClasses.latitude ?? "",
        ],
        [
          "Referencia",
          event.reference ?? "—",
          event.fieldClasses.reference ?? "",
        ],
        ["Reporte ACELDAT", event.aceldatReportNumber?.toString() ?? "—", ""],
        ["Fuente", event.provenance.source.name, "official"],
        ["Consultado", event.provenance.fetchedAt, ""],
      ],
    ),
  );
}

async function commandStations(args: ParsedArgs): Promise<void> {
  const eventId = args.positional[1];
  if (!eventId)
    throw new CliError(
      "Falta EVENT_ID. Uso: sismo stations EVENT_ID",
      EXIT_CODES.invalidInput,
    );
  const sort = stringFlag(args, "sort") ?? "distance";
  const response = await withSpinner(
    args,
    "Consultando estaciones ACELDAT",
    () => buildStationListResponse(eventId),
  );
  let stations = [...response.stations];
  const pgaByStation = new Map<string, number>();

  if (sort === "pga") {
    const reportNumber = parseRanEventId(response.eventId) ?? null;
    const { reports } = await fetchAceldatReports();
    const report = reports.find((entry) => entry.reportNumber === reportNumber);
    if (report) {
      const detail = await fetchAceldatEventDetail(report.timeUtcIso);
      for (const station of stations.filter((entry) => entry.hasWaveform)) {
        const url = waveformFileUrl(detail, station.code);
        if (!url) continue;
        try {
          const parsed = parseAceldatFile(await fetchAceldatRawFile(url));
          const pga = computePga(parsed.components);
          pgaByStation.set(station.code, Math.max(pga.z, pga.n, pga.e));
        } catch {
          // estación sin archivo legible: queda sin PGA y se ordena al final
        }
      }
    }
    stations = stations.sort(
      (a, b) =>
        (pgaByStation.get(b.code) ?? -1) - (pgaByStation.get(a.code) ?? -1),
    );
  } else if (sort === "distance") {
    stations = stations.sort(
      (a, b) =>
        (a.epicentralDistanceKm ?? Infinity) -
        (b.epicentralDistanceKm ?? Infinity),
    );
  } else {
    throw new CliError(
      `--sort "${sort}" no soportado. Usa distance o pga.`,
      EXIT_CODES.invalidInput,
    );
  }

  if (args.flags.get("json")) {
    console.log(
      JSON.stringify(
        {
          ...response,
          stations,
          pgaMaxByStation: Object.fromEntries(pgaByStation),
        },
        null,
        2,
      ),
    );
    return;
  }
  console.log(
    renderTable(
      [
        "Código",
        "Red",
        "Nombre",
        "Tipo",
        "Distancia",
        sort === "pga" ? "PGA máx (cm/s2)" : "Ondas",
      ],
      stations.map((station) => [
        station.code,
        station.network,
        station.name.slice(0, 42),
        station.kind,
        station.epicentralDistanceKm !== null
          ? `${station.epicentralDistanceKm} km`
          : "—",
        sort === "pga"
          ? (pgaByStation.get(station.code)?.toFixed(4) ?? "—")
          : station.hasWaveform
            ? "sí"
            : "no",
      ]),
    ),
  );
  console.log(
    dim(
      `\nFuente: ${response.provenance.source.name} · Consultado: ${response.provenance.fetchedAt}`,
    ),
  );
}

async function commandWaveform(args: ParsedArgs): Promise<void> {
  const eventId = args.positional[1];
  const stationId = args.positional[2];
  if (!eventId || !stationId) {
    throw new CliError(
      "Uso: sismo waveform EVENT_ID STATION_ID",
      EXIT_CODES.invalidInput,
    );
  }
  const format = stringFlag(args, "format") ?? "csv";
  const response = await withSpinner(args, "Descargando onda ACELDAT", () =>
    buildWaveformResponse(eventId, stationId),
  );
  await maybeOpen(args, response.waveform.sourceFileUrl);
  if (format === "json") {
    await writeOutput(JSON.stringify(response, null, 2), args);
    return;
  }
  if (format !== "csv") {
    throw new CliError(
      `Formato "${format}" no soportado. Usa csv o json.`,
      EXIT_CODES.invalidInput,
    );
  }
  const fullSeries = parseAceldatFile(
    await fetchAceldatRawFile(response.waveform.sourceFileUrl),
  );
  const { header } = fullSeries;
  const metadataLines = [
    `# estacion: ${header.stationCode} (${header.stationName})`,
    `# archivo_original: ${response.waveform.sourceFileUrl}`,
    `# inicio_registro: ${header.startTimeUtc}`,
    `# muestreo_hz: ${header.sampleRateHz}`,
    `# unidades: ${header.units}`,
    `# muestras: ${fullSeries.components.z.length}`,
    `# pga_oficial_zne: ${header.pga.z} ${header.pga.n} ${header.pga.e}`,
    `# consultado: ${response.waveform.provenance.fetchedAt} (${response.waveform.provenance.timezone})`,
    "# nota: serie completa del archivo oficial, sin reducción",
  ];
  const { z, n, e } = fullSeries.components;
  const rows: Array<Array<string | number | null>> = z.map((value, index) => [
    index,
    value,
    n[index] ?? null,
    e[index] ?? null,
  ]);
  const csv = toCsv(["index", "z", "n", "e"], rows);
  await writeOutput(`${metadataLines.join("\n")}\n${csv}`, args);
}

async function commandVolcanoes(args: ParsedArgs): Promise<void> {
  const response = await withSpinner(args, "Consultando capa volcánica", () =>
    buildVolcanoListResponse(),
  );
  if (args.flags.get("json")) {
    console.log(JSON.stringify(response, null, 2));
    return;
  }
  console.log(
    renderTable(
      ["Slug", "Volcán", "Región", "Nivel publicado", "Frescura"],
      response.volcanoes.map((volcano) => [
        volcano.slug,
        volcano.name,
        volcano.region,
        volcano.publishedLevel,
        "FRESHNESS_UNKNOWN",
      ]),
    ),
  );
  console.log(
    dim(
      `\n${response.volcanoes.length} volcanes · Fuente: ${response.provenance.source.name} · Consultado: ${response.provenance.fetchedAt}`,
    ),
  );
  console.log(dim(`Aviso: ${response.limitations[0]}`));
}

async function commandVolcano(args: ParsedArgs): Promise<void> {
  const slug = args.positional[1];
  if (!slug)
    throw new CliError(
      "Uso: sismo volcano VOLCANO_SLUG",
      EXIT_CODES.invalidInput,
    );
  const response = await withSpinner(args, "Consultando volcán", () =>
    buildVolcanoDetailResponse(slug),
  );
  await maybeOpen(args, response?.volcano.provenance.source.url ?? null);
  if (!response) {
    throw new CliError(
      `No existe el volcán "${slug}" en la capa publicada`,
      EXIT_CODES.notFound,
    );
  }
  if (args.flags.get("json")) {
    console.log(JSON.stringify(response, null, 2));
    return;
  }
  const volcano = response.volcano;
  console.log(
    renderTable(
      ["Campo", "Valor"],
      [
        ["Volcán", volcano.name],
        ["Región", volcano.region],
        ["Coordenadas", `${volcano.latitude}, ${volcano.longitude}`],
        ["Nivel publicado", volcano.publishedLevel],
        ["Actividad publicada", volcano.publishedActivity.slice(0, 70)],
        ["Frescura", "FRESHNESS_UNKNOWN"],
        ["Fuente", volcano.provenance.source.name],
        ["Consultado", volcano.provenance.fetchedAt],
      ],
    ),
  );
  console.log(`\nAviso: ${response.limitations[0]}`);
}

async function commandSources(args: ParsedArgs): Promise<void> {
  if (args.flags.get("probe")) {
    await withSpinner(args, "Ejecutando probes contra las fuentes", () =>
      runSourceChecks(),
    );
  }
  const overview = await getSourceOverview();
  if (args.flags.get("json")) {
    console.log(JSON.stringify(overview, null, 2));
    return;
  }
  console.log(
    colorizeStatuses(
      renderTable(
        ["Fuente", "Estado", "Latencia", "Último chequeo"],
        overview.sources.map((source) => [
          source.sourceId,
          source.status,
          source.latencyMs !== null ? `${source.latencyMs} ms` : "—",
          source.lastCheckAt ?? "sin chequeos aún (usa --probe)",
        ]),
      ),
    ),
  );
  console.log(dim(`\n${overview.disclaimer}`));
}

async function commandSource(args: ParsedArgs): Promise<void> {
  const sourceId = args.positional[1];
  if (!sourceId)
    throw new CliError("Uso: sismo source SOURCE_ID", EXIT_CODES.invalidInput);
  if (args.flags.get("probe")) {
    await withSpinner(args, "Ejecutando probes contra las fuentes", () =>
      runSourceChecks(),
    );
  }
  const history = await getSourceHistory(sourceId);
  if (!history) {
    throw new CliError(
      `Fuente desconocida "${sourceId}". Usa: sismo sources`,
      EXIT_CODES.notFound,
    );
  }
  if (args.flags.get("json")) {
    console.log(JSON.stringify(history, null, 2));
    return;
  }
  console.log(
    colorizeStatuses(
      renderTable(
        ["Campo", "Valor"],
        [
          ["Fuente", history.source.source.name],
          ["Estado", history.source.status],
          [
            "Último chequeo",
            history.source.lastCheckAt ?? "sin chequeos aún (usa --probe)",
          ],
          [
            "Latencia",
            history.source.latencyMs !== null
              ? `${history.source.latencyMs} ms`
              : "—",
          ],
        ],
      ),
    ),
  );
  if (args.flags.get("evidence") && history.recentChecks.length > 0) {
    console.log("\nEvidencia de chequeos recientes:");
    console.log(
      colorizeStatuses(
        renderTable(
          ["Hora", "Estado", "HTTP", "ms", "Evidencia"],
          history.recentChecks.map((check) => [
            check.checkedAt,
            check.status,
            check.httpStatus?.toString() ?? "—",
            check.durationMs.toString(),
            check.evidence,
          ]),
        ),
      ),
    );
  }
  console.log(dim(`\n${history.disclaimer}`));
}

const STATUS_PATTERN =
  /\b(OPERATIONAL|DEGRADED|UNAVAILABLE|SCHEMA_CHANGED|FRESHNESS_UNKNOWN)\b/g;

function colorizeStatuses(text: string): string {
  return text.replace(STATUS_PATTERN, (status) => colorizeStatus(status));
}

async function commandSkill(): Promise<void> {
  const document = await readSkillDocument();
  if (!document) {
    throw new CliError(
      "No se encontró skills/sismo-cli/SKILL.md. Corre el comando dentro del repositorio o reinstala el paquete.",
      EXIT_CODES.notFound,
    );
  }
  console.log(document.trim());
}

const SCHEMA_PATHS: Record<string, string> = {
  latest: "/v1/events/latest",
  events: "/v1/events",
  inspect: "/v1/events/{eventId}",
  stations: "/v1/events/{eventId}/stations",
  waveform: "/v1/events/{eventId}/stations/{stationId}/waveform",
  volcanoes: "/v1/volcanoes",
  volcano: "/v1/volcanoes/{slug}",
  sources: "/v1/sources",
  source: "/v1/sources/{sourceId}",
};

async function commandSchema(args: ParsedArgs): Promise<void> {
  const target = args.positional[1];
  const path = target ? SCHEMA_PATHS[target] : null;
  const schema = path ? responseJsonSchemaFor(path) : null;
  if (!target || !schema) {
    throw new CliError(
      `Uso: sismo schema COMMAND\nComandos: ${Object.keys(SCHEMA_PATHS).join(", ")}`,
      EXIT_CODES.invalidInput,
    );
  }
  console.log(JSON.stringify(schema, null, 2));
}

const COMMANDS: Record<string, (args: ParsedArgs) => Promise<void>> = {
  latest: commandLatest,
  events: commandEvents,
  inspect: commandInspect,
  stations: commandStations,
  waveform: commandWaveform,
  volcanoes: commandVolcanoes,
  volcano: commandVolcano,
  sources: commandSources,
  source: commandSource,
  schema: commandSchema,
  skill: commandSkill,
};

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const command = args.positional[0];
  if (!command || command === "help" || args.flags.get("help")) {
    console.log(HELP);
    return EXIT_CODES.ok;
  }
  const handler = COMMANDS[command];
  if (!handler) {
    console.error(`Comando desconocido "${command}". Corre \`sismo help\`.`);
    return EXIT_CODES.invalidInput;
  }
  try {
    await handler(args);
    return EXIT_CODES.ok;
  } catch (error) {
    if (error instanceof CliError) {
      console.error(error.message);
      return error.exitCode;
    }
    if (isSourceError(error)) {
      console.error(error.message);
      return error.kind === "not_found"
        ? EXIT_CODES.notFound
        : EXIT_CODES.sourceUnavailable;
    }
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

process.exit(await main());
