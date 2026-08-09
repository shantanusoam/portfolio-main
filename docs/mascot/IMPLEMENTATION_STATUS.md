# Current phase

Complete (Phases 0-11 and 14-15 of the master spec; Phases 12-13 are
explicitly gated and deferred — see below).

# Completed

- Phase 0: baseline audit (`BASELINE_AUDIT.md`).
- Phase 1: core math — `NumericGuards`, `SeededRandom`, `FixedStepLoop`,
  `SecondOrderDynamics`, `PerformanceGovernor`. 35 tests.
- Phase 2: motion lab shell — `/motion-lab`, `ProceduralMascotCanvas`
  lifecycle, pointer/DPR/resize/visibility handling, debug overlay.
- Phase 3: spine + secondary motion — `SpineSolver`, `AngleConstraint`,
  `VerletChain`, `MotionRecipes`, `PoseController`. 21 tests.
- Phase 4: original silhouette — `BodyProfile`, `CreatureRig`,
  `CreatureRecipe`, `Expressions`, `DotSkin`. 11 tests.
- Phase 5: behavior + wander — `BehaviorMachine`, `WanderPlanner`,
  `TargetDirector`, `InterestDirector`. 21 tests.
- Phase 6: dot skin rendering — `CanvasDotRenderer`, `ParticlePool`,
  `CanvasMascotRenderer`, `RenderQuality`. 13 tests.
- Phase 7: DOM obstacles — `DomObstacleRegistry`, `RectangleSteering`,
  `SpatialGrid`, `OBSTACLE_INVALIDATE_EVENT`. 27 tests.
- Phase 8-9: project interest + interaction polish — interest targeting,
  orbit, click-scatter particles, scroll current decay — folded into
  `MascotRuntime`/engine assembly.
- Engine assembly — `MascotEngine`, `MascotRuntime`, `MascotConfig`,
  `types.ts`. Lifecycle behavior covered indirectly via
  `FixedStepLoop.test.ts`; the engine class itself needs a real DOM/Canvas
  and was validated via server-rendered smoke tests + code review instead
  (documented gap, see `PLAYTEST.md`).
- FABRIK solver — `FabrikSolver.ts`, 9 tests including a temporal
  bend-stability test. Not wired into the default rig (explicit gate).
- Phase 10: production integration — `ProceduralMascotLoader`/`Canvas` in
  `app/layout.tsx`; `data-mascot-obstacle`/`data-mascot-interest` markup on
  `Buttons.tsx`, `Navbar.tsx`, `MenuToggle.tsx`, `MissionCard.tsx`.
  Verified via server-rendered HTML inspection + successful production
  build; homepage content/behavior unaffected.
- `.claude/` scaffolding — `CLAUDE.md`, 7 skills, 7 agents, 2 hooks,
  `settings.json`.
- Scripts — `scripts/mascot/verify.mjs` (mascot-scoped typecheck/lint/
  format/test/build gate), `scripts/mascot/perf-budget.mjs` (bundle
  evidence + heavy-dependency gate).
- Phase 14: complete validation — see "Validation" below.
- Phase 15: final docs — `ARCHITECTURE.md`, `MOTION_RECIPES.md`,
  `PERFORMANCE.md`, `PLAYTEST.md`, `FINAL_REPORT.md`, this file.

# In progress

None.

# Deferred (explicit spec gates, not met)

- Phase 12 (FABRIK legs): math + tests exist, not wired into the rig —
  gated on human review of core body motion first.
- Phase 13 (Pretext interactions): not started — gated on core mascot
  completion; explicitly optional.
- GPU renderer (PixiJS): gate not met, no profiler evidence of a Canvas
  bottleneck exists in this environment (no browser automation).
- Worker/OffscreenCanvas: gate not met.
- Real browser-measured frame-time budgets (simulation/render average,
  p95, worst, actual FPS): not captured — no browser automation available
  this pass. See `PERFORMANCE.md`/`PLAYTEST.md` for exactly what evidence
  exists instead and how to complete this.

# Validation

- `npm run test:mascot`: 131/131 passing.
- `node scripts/mascot/verify.mjs` (full run including production build):
  typecheck ✔, lint ✔, format ✔, test:mascot ✔, build ✔.
- `node scripts/mascot/perf-budget.mjs`: no PixiJS/Three.js markers in any
  mascot-attributed chunk.
- Server-rendered smoke test of `/` and `/motion-lab` via `npm run dev` +
  `curl`: both 200, canvas present on `/motion-lab`, obstacle/interest
  markup present on `/`, no new console/compile errors.
- No real browser session was used (declined by the user this session) —
  see `PLAYTEST.md` for the full list of scenarios still requiring manual
  or Playwright verification.

# Performance

See `docs/mascot/PERFORMANCE.md`. Bundle-level evidence only; runtime
frame-time budgets not measured (documented gap).

# Known issues

- `next.config.js` has `typescript.ignoreBuildErrors: true` and
  `eslint.ignoreDuringBuilds: true` (pre-existing, unrelated to this
  work) — `npm run build` alone would not catch a mascot type/lint
  regression, which is why `scripts/mascot/verify.mjs` runs `tsc --noEmit`
  and `next lint` explicitly.
- The repository has ~16 pre-existing TypeScript errors and ~220 lines of
  pre-existing lint warnings/errors outside mascot-owned paths (see
  `BASELINE_AUDIT.md`). None were touched or fixed by this work;
  `verify.mjs` explicitly scopes its typecheck/lint gate to mascot paths
  so these don't block mascot verification, and doesn't touch them.
- `MascotEngine`'s lifecycle (start/pause/resume/destroy idempotency, no
  duplicate RAF, listener cleanup) has strong indirect unit coverage via
  `FixedStepLoop.test.ts` plus code review, but no direct automated test —
  it requires a real `HTMLCanvasElement`/`document`/`window`, which this
  environment's plain `node:test` runner doesn't provide without adding
  jsdom (a dependency decision left to the user).

# Next action

1. If desired, run the full manual/browser playtest matrix in
   `docs/mascot/PLAYTEST.md` and record real results.
2. If desired, install `@playwright/test`, remove `tests/e2e` from
   `tsconfig.json`'s `exclude`, and run `tests/e2e/mascot-*.spec.ts`.
3. Tune `lib/mascot/motion/MotionRecipes.ts` / `MascotConfig.ts` values
   against real visual review using `/motion-lab`.
4. Only after the above: consider Phase 12 (FABRIK legs) or Phase 13
   (Pretext), per their explicit gates.

# Decisions log (final)

- Package manager: npm is authoritative (`docs/mascot/BASELINE_AUDIT.md`).
- Unit tests: Node's built-in `node:test` via `tsx --test`, matching the
  existing `test:game` script. No Vitest/Jest added.
- E2E: Playwright-shaped specs written in `tests/e2e/`, excluded from the
  root `tsconfig.json` since `@playwright/test` isn't installed.
- Renderer: Canvas 2D only. No PixiJS/WebGL code path added.
- FABRIK: math + tests only, not wired into the default rig.
- Pretext: out of scope this pass.
- `tsconfig.json` and `.eslintrc.json`: `tsconfig.json`'s `exclude` gained
  one entry (`tests/e2e`), required for e2e specs to typecheck cleanly
  without the Playwright dependency present; `.eslintrc.json` was **not**
  modified — mascot code instead avoids referencing the handful of global
  TS type names (`EventListener`, `ParentNode`, `FrameRequestCallback`,
  `NodeListOf`) that this repo's base `no-undef` rule doesn't recognize
  (a pre-existing, repo-wide quirk also affecting `React`, `JSX`,
  `OscillatorType` in other files — not something this pass fixed
  globally).
