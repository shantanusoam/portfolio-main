# Performance

## Environment

- Node v24.11.1, Linux (Arch, kernel 7.1.4), x86_64.
- Next.js 13.4.10 production build (`npm run build`).
- No real browser session was used to capture runtime frame-time metrics —
  see "What's missing" below. All numbers in this document are either
  build-time/static evidence or unit-test evidence.

## Bundle findings (build-time, real evidence)

From `npm run build`'s own per-route output:

| Route | Own size | First Load JS |
|---|---|---|
| `/` (portfolio home, includes the mascot loader) | 110 kB | 258 kB |
| `/motion-lab` | 17.9 kB | 96.3 kB |
| `/testing` (pre-existing, unrelated — uses `@splinetool/react-spline`) | 1.82 kB | 84 kB |
| Shared by all routes | — | 78.4 kB |

`/motion-lab` reporting its own, much smaller First Load JS than `/`
despite containing the full debug panel, accessibility controls, and
scenario player is the concrete evidence that:

1. The mascot engine is not duplicated into every route's bundle.
2. Motion-lab-only code (debug panel, scenario player) is not pulled into
   the production `/` route — `ProceduralMascotLoader.tsx`'s
   `next/dynamic(..., { ssr: false })` import only ever resolves to
   `ProceduralMascotCanvas.tsx`, never `MascotDebugPanel.tsx`.

`scripts/mascot/perf-budget.mjs` additionally confirms **zero** PixiJS or
Three.js markers inside any client chunk that content-matches the mascot
(`docs/mascot/performance-bundle-report.json`). It could not positively
attribute a specific minified client chunk to the mascot by content marker
(expected — production minification renames internal class names like
`MascotEngine`/`MascotRuntime`), so it falls back to the route-level
evidence above; see that report's `attributionNote` field.

## Unit test evidence (real, automated)

`npm run test:mascot`: **131/131 passing**, ~250-340ms total, across 16
files covering every required category from the spec's "Required Unit
Tests" list: `SecondOrderDynamics`, `SpineSolver`, `VerletChain`,
`BodyProfile`, `WanderPlanner`, `RectangleSteering`, `FabrikSolver`,
`PerformanceGovernor`, plus `NumericGuards`, `SeededRandom`,
`FixedStepLoop`, `CreatureRig`, `BehaviorMachine`, `TargetDirector`,
`InterestDirector`, `ParticlePool`, `CanvasDotRenderer`, `SpatialGrid`,
`DomObstacleRegistry` (the pure `resolveObstacleMode` helper only — the
DOM-coupled class itself needs a real browser, see below).

These tests assert the performance-relevant invariants that *can* be
checked without a browser: bounded solver iterations regardless of
requested `iterations` value (`SpineSolver.test.ts`, `VerletChain.test.ts`,
`FabrikSolver.test.ts` all assert completion in well under 500ms even when
passed `iterations: 1_000_000` or `10_000_000`), no unbounded particle
growth (`ParticlePool.test.ts`), and exactly-one-`fill()`-per-group Canvas
batching (`CanvasDotRenderer.test.ts`).

## Quality tiers (configuration, not measured)

From `lib/mascot/rendering/RenderQuality.ts`:

| Tier | Dots | Particles | Solver iters | DPR cap | Target FPS |
|---|---|---|---|---|---|
| reduced | 0 | 0 | 1 | 1 | 15 |
| low | 700 | 120 | 2 | 1.25 | 45 |
| medium (default) | 1800 | 300 | 3 | 1.5 | 60 |
| high | 3800 | 650 | 4-5 | 2 | 60 |

`PerformanceGovernor` (`lib/mascot/core/PerformanceGovernor.ts`) downgrades
after sustained >20ms average frame time (past a 4s cooldown), never
changes quality while `blocked` (sprint/scatter/reform), and upgrades at
most once per session after an 8s cooldown with a clearly good average
(<10ms) and worst frame under 20ms. This policy itself is unit-tested
(`PerformanceGovernor.test.ts`, 6 tests) but has not been exercised against
real measured frame times from a browser.

## What's missing (documented gap, not fabricated)

Per `docs/mascot/BASELINE_AUDIT.md`, this repository has no browser
automation installed, and none was added in this pass. The following spec
targets require a real browser session and **have not been measured**:

- Simulation average, render average (desktop target: <2ms / <4ms; mobile:
  <4ms / <7ms).
- p95 and worst frame time.
- Actual FPS under load on desktop and mobile hardware.
- Whether the "medium" tier genuinely holds 60fps on a representative
  mobile device.
- Memory trend over an extended session.

**To capture these**: open `/motion-lab` in a real browser, let it run,
and read `engine.getDebugSnapshot().performance` (also shown live in
`MascotDebugPanel`'s HUD, refreshed every 500ms) — or call
`window.__MASCOT_DEBUG__.snapshot()` from the console in development. Then
record the values here. See `docs/mascot/PLAYTEST.md` for the manual
verification actually performed this pass.
