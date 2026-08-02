#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const canonicalPackage = require.resolve("@crafter/sismo-cli/package.json");
const canonicalDirectory = dirname(canonicalPackage);
const sourceEntry = join(canonicalDirectory, "src/main.ts");
const entry = existsSync(sourceEntry)
  ? sourceEntry
  : join(canonicalDirectory, "dist/sismo.js");

await import(pathToFileURL(entry).href);
