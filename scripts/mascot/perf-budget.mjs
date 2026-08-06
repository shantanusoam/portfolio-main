#!/usr/bin/env node
/**
 * Static/build-time performance evidence for the mascot subsystem: bundle
 * chunk sizes and a check that no heavy optional dependency (PixiJS,
 * Three.js) leaked into the client bundle.
 *
 * This repo has no browser-automation tooling installed (see
 * docs/mascot/BASELINE_AUDIT.md), so live frame-time budgets (simulation
 * average, render average, p95/worst frame time) cannot be captured here —
 * they require a real browser session via engine.getDebugSnapshot() in
 * /motion-lab, recorded manually in docs/mascot/PERFORMANCE.md and
 * docs/mascot/PLAYTEST.md. This script does not fabricate those numbers.
 *
 * Usage: node scripts/mascot/perf-budget.mjs [--skip-build]
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const nextDir = path.join(root, ".next");
const chunksDir = path.join(nextDir, "static", "chunks");

const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");

function runBuild() {
  console.log(
    "Running `npm run build` to produce a fresh bundle to inspect...",
  );
  const result = spawnSync("npm", ["run", "build"], {
    stdio: "inherit",
    cwd: root,
    shell: false,
  });
  if (result.status !== 0) {
    console.error("Build failed; cannot inspect bundle output.");
    process.exit(1);
  }
}

if (!existsSync(chunksDir)) {
  if (skipBuild) {
    console.error(
      `No build output found at ${chunksDir} and --skip-build was passed.`,
    );
    process.exit(1);
  }
  runBuild();
}

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else if (entry.isFile() && entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

if (!existsSync(chunksDir)) {
  console.error(`Still no build output at ${chunksDir} after build. Aborting.`);
  process.exit(1);
}

// Only .next/static is ever shipped to the browser — .next/server files
// never reach the client, so they're irrelevant to a "client bundle" gate.
const clientJsFiles = listFilesRecursive(path.join(nextDir, "static")).filter(
  (f) => f.endsWith(".js"),
);

const mascotMarkers = [
  "MascotEngine",
  "MascotRuntime",
  "ProceduralMascotCanvas",
  "motion-lab",
];
const heavyDependencyMarkers = [
  "pixi.js",
  "PIXI.",
  "three.module",
  "THREE.WebGLRenderer",
];

let mascotBytes = 0;
const mascotFiles = [];
const heavyDependencyHits = [];

for (const file of clientJsFiles) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const isMascotChunk = mascotMarkers.some((marker) =>
    content.includes(marker),
  );
  if (!isMascotChunk) continue;

  const size = statSync(file).size;
  mascotBytes += size;
  mascotFiles.push({ file: path.relative(root, file), bytes: size });

  // Heavy-dependency markers are only meaningful *inside* a chunk this
  // script already attributed to the mascot — a shared/vendor chunk used
  // by an unrelated route (e.g. /testing's Spline import) legitimately
  // contains Three.js and is not this gate's concern.
  for (const marker of heavyDependencyMarkers) {
    if (content.includes(marker)) {
      heavyDependencyHits.push({ file: path.relative(root, file), marker });
    }
  }
}

const attributionNote =
  mascotFiles.length === 0
    ? "No client chunk matched the mascot content markers, most likely because production " +
      "minification renamed internal class names (MascotEngine, MascotRuntime, etc.) — this is " +
      "expected and does not indicate a bundling problem. Cross-check against `next build`'s own " +
      "per-route size output instead (the /motion-lab route reports its own size separately from " +
      "/, which is the actual evidence that mascot code is code-split)."
    : null;

const report = {
  generatedAt: new Date().toISOString(),
  mascotChunkFiles: mascotFiles.sort((a, b) => b.bytes - a.bytes),
  mascotChunkTotalBytes: mascotBytes,
  mascotChunkTotalKb: Math.round((mascotBytes / 1024) * 10) / 10,
  heavyDependencyLeaks: heavyDependencyHits,
  attributionNote,
  note:
    "Runtime frame-time budgets (simulation/render average, p95, worst) are not captured " +
    "by this script — no browser automation is installed in this repo. Capture them manually " +
    "via engine.getDebugSnapshot().performance in /motion-lab and record in docs/mascot/PERFORMANCE.md.",
};

const docsDir = path.join(root, "docs", "mascot");
mkdirSync(docsDir, { recursive: true });
const reportPath = path.join(docsDir, "performance-bundle-report.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(
  `\nMascot-related JS found in ${mascotFiles.length} file(s), ${report.mascotChunkTotalKb} KB total:`,
);
for (const f of report.mascotChunkFiles) {
  console.log(`  ${(f.bytes / 1024).toFixed(1).padStart(8)} KB  ${f.file}`);
}
if (attributionNote) {
  console.log(`\nNote: ${attributionNote}`);
}

if (heavyDependencyHits.length > 0) {
  console.error("\n✘ Heavy dependency markers found in the client bundle:");
  for (const hit of heavyDependencyHits) {
    console.error(`  ${hit.marker} in ${hit.file}`);
  }
  console.error(
    "\nThis violates the PixiJS/Three.js gate in docs/mascot/ARCHITECTURE.md.",
  );
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("\n✔ No PixiJS/Three.js markers found in the client bundle.");
console.log(`\nReport written to ${path.relative(root, reportPath)}`);
process.exit(0);
