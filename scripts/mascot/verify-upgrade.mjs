#!/usr/bin/env node
/**
 * Verification gate for the character/musical/Strumrise upgrade layered on
 * top of the base mascot spec. Same discipline as scripts/mascot/verify.mjs
 * (package-manager detection, mascot-scoped typecheck/lint so pre-existing
 * repo-wide issues don't block this gate, --fast to skip the production
 * build), extended to cover the upgrade's new paths:
 * lib/mascot/appearance, lib/mascot/music, lib/mascot/game,
 * components/strumrise, tests/mascot/{appearance,music,game}.
 *
 * Usage:
 *   node scripts/mascot/verify-upgrade.mjs          full run, including build
 *   node scripts/mascot/verify-upgrade.mjs --fast   skip the production build
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const fast = args.includes("--fast");

const UPGRADE_PATH_PATTERN =
  /^(\.\/)?(lib\/mascot|components\/mascot|components\/strumrise|app\/motion-lab|tests\/mascot|tests\/e2e\/mascot|tests\/e2e\/strumrise)/;

function isUpgradePath(p) {
  return UPGRADE_PATH_PATTERN.test(p.replace(/\\/g, "/"));
}

function detectRunner() {
  if (existsSync(path.join(root, "package-lock.json"))) return "npm";
  if (existsSync(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(root, "yarn.lock"))) return "yarn";
  return "npm";
}

const runner = detectRunner();
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const scripts = pkg.scripts ?? {};

function runCaptured(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    shell: false,
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(output);
  return { status: result.status, error: result.error, output };
}

function runInherited(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });
  return { status: result.status, error: result.error };
}

/** tsc default output: "path/to/file.ts(12,34): error TS2345: message" */
function findScopedTypeErrors(output) {
  return output.split("\n").filter((line) => {
    const match = line.match(/^([^\s(:][^(:]*\.tsx?)\(\d+,\d+\): error TS/);
    return match !== null && isUpgradePath(match[1]);
  });
}

/** next lint output: "./path/to/file.tsx" header, then indented "line:col  Error: ..." rows. */
function findScopedLintErrors(output) {
  const lines = output.split("\n");
  let currentFile = null;
  const errors = [];
  for (const line of lines) {
    const fileMatch = line.match(/^\.\/(\S+)$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }
    if (currentFile && isUpgradePath(currentFile) && /\bError:/.test(line)) {
      errors.push(`${currentFile} ${line.trim()}`);
    }
  }
  return errors;
}

const results = [];

console.log(`Package manager: ${runner}\n`);

console.log("▶ typecheck: npx tsc --noEmit -p tsconfig.json");
{
  const { output, error } = runCaptured("npx", [
    "tsc",
    "--noEmit",
    "-p",
    "tsconfig.json",
  ]);
  const scopedErrors = findScopedTypeErrors(output);
  const ok = !error && scopedErrors.length === 0;
  if (!ok) {
    console.error(
      `\n✘ typecheck: ${scopedErrors.length} upgrade-scoped error(s):`,
    );
    scopedErrors.forEach((line) => console.error(`  ${line}`));
  }
  results.push({ name: "typecheck", ok });
}

if (scripts.lint) {
  console.log(`\n▶ lint: ${runner} run lint`);
  const { output, error } = runCaptured(runner, ["run", "lint"]);
  const scopedErrors = findScopedLintErrors(output);
  const ok = !error && scopedErrors.length === 0;
  if (!ok) {
    console.error(`\n✘ lint: ${scopedErrors.length} upgrade-scoped error(s):`);
    scopedErrors.forEach((line) => console.error(`  ${line}`));
  }
  results.push({ name: "lint", ok });
}

if (existsSync(path.join(root, "node_modules", ".bin", "prettier"))) {
  const candidateDirs = [
    "lib/mascot",
    "components/mascot",
    "components/strumrise",
    "app/motion-lab",
    "tests/mascot",
    "scripts/mascot",
  ];
  // Some of these (components/strumrise, in particular) may not exist yet
  // depending on which upgrade phases have landed — prettier errors on a
  // missing path rather than treating it as "nothing to check."
  const existingDirs = candidateDirs.filter((dir) =>
    existsSync(path.join(root, dir)),
  );
  console.log(`\n▶ format: npx prettier --check ${existingDirs.join(" ")}`);
  const { status, error } = runInherited("npx", [
    "prettier",
    "--check",
    ...existingDirs,
  ]);
  results.push({ name: "format", ok: status === 0 && !error });
}

console.log(
  "\n▶ test:mascot (appearance/music/game/base): npx tsx --test tests/mascot/**/*.test.ts",
);
{
  const { status, error } = runInherited("npx", [
    "tsx",
    "--test",
    "tests/mascot/**/*.test.ts",
  ]);
  results.push({ name: "test:mascot", ok: status === 0 && !error });
}

if (!fast) {
  console.log(`\n▶ build: ${runner} run build`);
  const { status, error } = runInherited(runner, ["run", "build"]);
  results.push({ name: "build", ok: status === 0 && !error });
} else {
  console.log("\n--fast: skipping the production build step.");
}

console.log("\n--- Upgrade verification summary ---");
for (const result of results) {
  console.log(`${result.ok ? "✔" : "✘"} ${result.name}`);
}

const failed = results.some((result) => !result.ok);

if (failed) {
  console.error("\nUpgrade verification FAILED.");
  process.exit(1);
}

console.log(
  "\nUpgrade verification passed (pre-existing non-upgrade issues, if any, were ignored).",
);
process.exit(0);
