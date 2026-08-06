# Architecture Decision Log

## Decision: Canvas 2D as initial renderer

Status: accepted

Context:
The first production scope is one character with bounded dots (max 3800 at
"high" quality) and bounded particles (max 650). No WebGL/PixiJS/Three.js
dependency existed in this repo before this work.

Decision:
Use Canvas 2D (`lib/mascot/rendering/CanvasMascotRenderer.ts`,
`CanvasDotRenderer.ts`) until profiling proves a GPU renderer is necessary.

Consequences:
- Simpler debugging — no shader toolchain.
- Lower initial dependency cost — zero new runtime dependencies added by
  this work.
- The renderer interface (`CanvasMascotRenderer`) is a thin, replaceable
  layer; `MascotEngine` and `MascotRuntime` never call Canvas 2D APIs
  directly, so a future `PixiMascotRenderer` could be swapped in behind the
  same shape without touching simulation code.
- Advanced post-processing (bloom, displacement, trails) is deferred.

## Decision: GPU migration gate

Status: accepted, not met

A GPU renderer (PixiJS v8, per spec) is only justified once profiler
evidence shows Canvas 2D rendering exceeds budget (desktop: mascot render
average under 4ms; mobile: under 7ms — see PERFORMANCE.md), or a required
effect needs shader deformation. Neither condition has been evaluated with
real browser profiling in this pass (see "Known limitations" below) — the
gate is therefore treated as **not met**, and no PixiJS code exists in this
repo. `lib/mascot/rendering/PixiMascotRenderer.ts` is intentionally **not
created** — an empty/unused file would violate "no unused placeholder
files."

## Decision: Fixed-step simulation

Status: accepted

`lib/mascot/core/FixedStepLoop.ts` runs simulation at a fixed 1/60s step
with an accumulator, capping catch-up steps at 3 and frame delta at 0.05s.
This keeps `SpineSolver`/`VerletChain`/`SecondOrderDynamics` behavior
independent of display refresh rate and immune to a single huge delta after
tab suspension (`resetTiming()` is called on `start()`/visibility resume).

## Decision: No React state in the simulation hot path

Status: accepted

`MascotRuntime.update()` runs every fixed step and mutates persistent
class fields directly (spine joints, ribs, skin points, particle pool).
React only sees: (1) the `MascotStatus` callback throttled to
`MASCOT_CONFIG.statusUpdateIntervalMs` (500ms), used solely for optional
external status display, and (2) `MascotDebugPanel`'s explicit 500ms
snapshot poll, documented as the one intentional low-frequency debug
exception. Neither triggers a React re-render on every animation frame.

## Decision: Original silhouette

Status: accepted

The creature (`lib/mascot/character/CreatureRecipe.ts`,
`DEFAULT_CREATURE_RECIPE`) is a 24-joint spine with a front-weighted body
profile, two antennae, and a soft tail-tip whisker on a Verlet chain — an
original anatomy, not a copy of any reference material. See
`docs/mascot/MOTION_RECIPES.md` for the concrete parameter values and the
visual reasoning behind them.

## Decision: Cached DOM geometry

Status: accepted

`lib/mascot/interaction/DomObstacleRegistry.ts` is the only place
`getBoundingClientRect()` is called. It refreshes on mount, `resize`, a
120ms-throttled `scroll`, and an explicit `OBSTACLE_INVALIDATE_EVENT`
window event (dispatched by `Navbar.tsx` when its full-screen mobile menu
opens/closes — see the "explicit registry invalidation" requirement).
Nothing in the fixed-step update or render path measures the DOM.

## Decision: Rectangle-aware steering

Status: accepted

`lib/mascot/interaction/RectangleSteering.ts` uses closest-point-on-
rectangle geometry (not distance-to-center), explicit inside-rectangle
handling (exits through the nearest side), and tangent selection aligned
with current travel direction for stable corner gliding. Fully unit-tested
(`tests/mascot/RectangleSteering.test.ts`: sides, corners, inside,
zero-distance, tangent selection, force cap, combined obstacles).

## Decision: Client-only dynamic loading

Status: accepted

`components/mascot/ProceduralMascotLoader.tsx` is a Client Component that
wraps `next/dynamic(() => import("./ProceduralMascotCanvas"), { ssr: false })`
and delays mounting until browser idle time (`requestIdleCallback`, with a
400ms `setTimeout` fallback). It also honors a `localStorage` opt-out
(`mascot:disabled`). This keeps the mascot engine and its dependencies out
of the initial server-rendered HTML and out of the main route's critical
JS path — confirmed via `npm run build`'s per-route size output (`/`:
258 kB First Load JS; `/motion-lab`: 96.3 kB, its own separate chunk).

## Decision: Reduced-motion mode

Status: accepted

`MascotEngine` reads `prefers-reduced-motion` via
`lib/mascot/input/VisibilityController.ts` at construction and on live
`change` events, and forces the `"reducedMotion"` behavior state
(`MOTION_RECIPES.reducedMotion`: low frequency 0.25, high damping 1.2,
zero response) whenever it's active — this state cannot be exited except
by reduced-motion turning off (`canExit` checks `!runtime.reducedMotion`).
Reduced motion disables chase, wander, sprint, and scatter by construction
(the behavior machine simply never transitions out of `reducedMotion`
while the flag is set).

## Decision: Worker/OffscreenCanvas migration gate

Status: accepted, not met

Per spec: main-thread Canvas first, optimize allocations/batching, degrade
quality intelligently, and only move simulation to a Worker if profiler
evidence shows the main thread is the bottleneck — then consider
OffscreenCanvas after that. No Worker code exists in this repo. DOM
measurement (`DomObstacleRegistry.refresh()`) must stay on the main thread
regardless, since a Worker cannot call `getBoundingClientRect()`.

## Decision: Optional FABRIK gate

Status: accepted, not met

`lib/mascot/motion/FabrikSolver.ts` is implemented and unit-tested
(reachable/unreachable targets, length preservation, bounded iterations,
temporal bend stability — see `tests/mascot/FabrikSolver.test.ts`), but is
**not wired into the default creature rig**. Per spec: "do not implement
legs before the body motion is approved." Legs are Phase 12, explicitly
gated on human review of the core body motion.

## Decision: Optional Pretext gate

Status: accepted, not met

Text-layout interactions between `@chenglou/pretext` and the mascot
(Phase 13) are explicitly optional and gated on core mascot completion.
Not built in this pass. The existing, unrelated `components/PretextCopyLab.tsx`
experiment is untouched.

## Decision: npm as the authoritative package manager

Status: accepted

Both `package-lock.json` and `pnpm-lock.yaml` exist in this repo (see
`docs/mascot/BASELINE_AUDIT.md`). `node_modules`' mtime matches
`package-lock.json` exactly, and the most recent lockfile-touching commit
updated `package-lock.json`. All mascot scripts (`scripts/mascot/verify.mjs`,
`scripts/mascot/perf-budget.mjs`) auto-detect the package manager rather
than hardcoding npm, but default to npm when both lockfiles are present.

## Decision: `tsx --test` for unit tests, no new test framework

Status: accepted

This repo has exactly one prior unit test
(`components/easter-egg/game/logic.test.ts`), run via Node's built-in test
runner through `tsx --test` (`package.json`'s `test:game` script). Mascot
unit tests (`tests/mascot/*.test.ts`, 131 tests across 16 files) follow the
same convention rather than introducing Vitest or Jest.

## Known limitations (documented, not silently glossed over)

- **No browser automation installed.** Playwright-shaped specs exist under
  `tests/e2e/` but are not runnable — `@playwright/test` is not a
  dependency, and `tests/e2e` is excluded from the root `tsconfig.json` for
  exactly that reason (TypeScript cannot resolve types for a package that
  isn't installed). See `docs/mascot/PLAYTEST.md` for the manual
  verification performed instead.
- **Simulation vs. render time is not split.** `MascotEngine` measures one
  combined per-frame duration (`simMsAccumulator + renderMs`) fed to
  `PerformanceGovernor`, rather than tracking simulation and render
  averages separately as the spec's `PerformanceState` interface
  conceptually allows. A finer split is straightforward future work.
- **No render-time interpolation.** `FixedStepLoop`'s render callback
  receives an `interpolationAlpha` but `MascotEngine.render()` currently
  ignores it and draws the latest simulated state directly. At a
  consistent 60fps with `steps <= 1` per frame (the common case) this is
  visually indistinguishable from interpolating; it would matter more
  under sustained frame-rate mismatch.
- **Rectangle steering acts on the root position only**, not the full
  body. This is a reasonable approximation (the root leads, the rest of
  the spine follows via the solver) but does not guarantee zero overlap
  between the tail and a nearby hard obstacle in every configuration.
