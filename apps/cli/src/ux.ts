import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createSpinner } from "nanospinner";
import pc from "picocolors";
import type { ParsedArgs } from "./args.ts";
import { stringFlag } from "./args.ts";

export function isMachineMode(args: ParsedArgs): boolean {
  if (!process.stdout.isTTY) return true;
  if (args.flags.get("json")) return true;
  const format = args.flags.get("format");
  return typeof format === "string" && format !== "table";
}

export async function withSpinner<T>(
  args: ParsedArgs,
  label: string,
  loader: () => Promise<T>,
): Promise<T> {
  if (isMachineMode(args)) return loader();
  const spinner = createSpinner(label).start();
  try {
    const result = await loader();
    spinner.clear();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.error({ text: label });
    throw error;
  }
}

export function colorizeStatus(status: string): string {
  switch (status) {
    case "OPERATIONAL":
      return pc.green(status);
    case "DEGRADED":
      return pc.yellow(status);
    case "UNAVAILABLE":
    case "SCHEMA_CHANGED":
      return pc.red(status);
    case "FRESHNESS_UNKNOWN":
      return pc.dim(status);
    default:
      return status;
  }
}

export function dim(text: string): string {
  return pc.dim(text);
}

export function bold(text: string): string {
  return pc.bold(text);
}

export async function openUrl(url: string): Promise<void> {
  const opener =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  const [cmd, ...cmdArgs] = opener;
  await new Promise<void>((resolve) => {
    const proc = spawn(cmd as string, cmdArgs, { stdio: "ignore" });
    proc.on("exit", () => resolve());
    proc.on("error", () => resolve());
  });
}

export async function maybeOpen(
  args: ParsedArgs,
  url: string | null,
): Promise<void> {
  if (!args.flags.get("open") || !url) return;
  await openUrl(url);
  if (!isMachineMode(args)) {
    console.log(dim(`Abriendo fuente oficial: ${url}`));
  }
}

export function resolveRepoFile(relativePath: string): string | null {
  let dir = process.cwd();
  for (let depth = 0; depth < 7; depth++) {
    const candidate = join(dir, relativePath);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const moduleDir = dirname(new URL(import.meta.url).pathname);
  const candidates = [
    join(moduleDir, "../../..", relativePath),
    join(moduleDir, "..", "SKILL.md"),
    join(moduleDir, "SKILL.md"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export async function readSkillDocument(): Promise<string | null> {
  const path = resolveRepoFile("skills/sismo-cli/SKILL.md");
  if (!path) return null;
  return readFile(path, "utf8");
}

export { stringFlag };
