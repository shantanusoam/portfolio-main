#!/usr/bin/env node
/**
 * Runs the mascot verification suite: typecheck, lint, format check, unit
 * tests, and (unless --fast) a full production build. Detects the package
 * manager instead of hardcoding it — see docs/mascot/BASELINE_AUDIT.md for
 * why this repo has two lockfiles and npm is authoritative today.
 *
 * next.config.js sets typescript.ignoreBuildErrors and eslint.ignoreDuringBuilds,
 * so `npm run build` alone would not catch type/lint regressions. This
 * script runs `tsc --noEmit` and `next lint` explicitly instead.
 *
 * The repository has pre-existing type/lint errors outside lib/mascot,
 * components/mascot, app/motion-lab, and tests/mascot (see
 * docs/mascot/BASELINE_AUDIT.md). Failing the whole repo's typecheck/lint
 * on every mascot change would make this script useless as a gate, so the
 * typecheck and lint steps only fail on errors inside those mascot paths —
 * pre-existing errors elsewhere are reported but do not fail the run.
 *
 * Usage:
 *   node scripts/mascot/verify.mjs          full run, including build
 *   node scripts/mascot/verify.mjs --fast   skip the production build
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const fast = args.includes("--fast");

const MASCOT_PATH_PATTERN =
  /^(\.\/)?(lib\/mascot|components\/mascot|components\/resonance-weaver|app\/motion-lab|tests\/mascot|tests\/e2e\/mascot)/;

function isMascotPath(p) {
  return MASCOT_PATH_PATTERN.test(p.replace(/\\/g, "/"));
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
function findMascotTypeErrors(output) {
  const lines = output.split("\n");
  return lines.filter((line) => {
    const match = line.match(/^([^\s(:][^(:]*\.tsx?)\(\d+,\d+\): error TS/);
    return match !== null && isMascotPath(match[1]);
  });
}

/** next lint stylish-ish output: "./path/to/file.tsx" header, then indented "line:col  Error: ..." rows. */
function findMascotLintErrors(output) {
  const lines = output.split("\n");
  let currentFile = null;
  const errors = [];
  for (const line of lines) {
    const fileMatch = line.match(/^\.\/(\S+)$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }
    if (currentFile && isMascotPath(currentFile) && /\bError:/.test(line)) {
      errors.push(`${currentFile} ${line.trim()}`);
    }
  }
  return errors;
}

const results = [];

console.log(`Package manager: ${runner}\n`);

// --- typecheck (scoped to mascot paths) ---
console.log("▶ typecheck: npx tsc --noEmit -p tsconfig.json");
{
  const { output, error } = runCaptured("npx", [
    "tsc",
    "--noEmit",
    "-p",
    "tsconfig.json",
  ]);
  const mascotErrors = findMascotTypeErrors(output);
  const ok = !error && mascotErrors.length === 0;
  if (!ok) {
    console.error(
      `\n✘ typecheck: ${mascotErrors.length} mascot-scoped error(s):`,
    );
    mascotErrors.forEach((line) => console.error(`  ${line}`));
  }
  results.push({ name: "typecheck", ok });
}

// --- lint (scoped to mascot paths) ---
if (scripts.lint) {
  console.log(`\n▶ lint: ${runner} run lint`);
  const { output, error } = runCaptured(runner, ["run", "lint"]);
  const mascotErrors = findMascotLintErrors(output);
  const ok = !error && mascotErrors.length === 0;
  if (!ok) {
    console.error(`\n✘ lint: ${mascotErrors.length} mascot-scoped error(s):`);
    mascotErrors.forEach((line) => console.error(`  ${line}`));
  }
  results.push({ name: "lint", ok });
}

// --- format (already scoped: only checks mascot directories) ---
if (existsSync(path.join(root, "node_modules", ".bin", "prettier"))) {
  // Some of these directories (e.g. resonance-weaver) are only present on
  // branches where that feature is checked in — prettier errors out on a
  // pattern that matches nothing, so skip whichever aren't there right now.
  const formatDirs = [
    "lib/mascot",
    "components/mascot",
    "components/resonance-weaver",
    "app/motion-lab",
    "tests/mascot",
    "scripts/mascot",
  ].filter((dir) => existsSync(path.join(root, dir)));

  console.log("\n▶ format: npx prettier --check <mascot dirs>");
  const { status, error } = runInherited("npx", [
    "prettier",
    "--check",
    ...formatDirs,
  ]);
  results.push({ name: "format", ok: status === 0 && !error });
}

// --- unit tests (already scoped) ---
console.log("\n▶ test:mascot: npx tsx --test tests/mascot/**/*.test.ts");
{
  const { status, error } = runInherited("npx", [
    "tsx",
    "--test",
    "tests/mascot/**/*.test.ts",
  ]);
  results.push({ name: "test:mascot", ok: status === 0 && !error });
}

// --- production build ---
if (!fast) {
  console.log(`\n▶ build: ${runner} run build`);
  const { status, error } = runInherited(runner, ["run", "build"]);
  results.push({ name: "build", ok: status === 0 && !error });
} else {
  console.log("\n--fast: skipping the production build step.");
}

console.log("\n--- Mascot verification summary ---");
for (const result of results) {
  console.log(`${result.ok ? "✔" : "✘"} ${result.name}`);
}

const failed = results.some((result) => !result.ok);

if (failed) {
  console.error("\nMascot verification FAILED.");
  process.exit(1);
}

console.log(
  "\nMascot verification passed (pre-existing non-mascot issues, if any, were ignored).",
);
process.exit(0);
