#!/usr/bin/env bun
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const canonicalPackage = require.resolve("@crafter/sismo-cli/package.json");
await import(
  pathToFileURL(join(dirname(canonicalPackage), "dist/sismo.js")).href
);
