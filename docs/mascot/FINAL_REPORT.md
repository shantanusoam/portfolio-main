# Final Report — Procedural Mascot

## 1. Summary

An original, procedurally-animated, dot-skinned creature ("constellation
familiar") was built end-to-end per
`PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md`: fixed-step simulation,
second-order dynamics, a 24-joint distance/angle-constrained spine, Verlet
secondary motion (antennae + tail whisker), a 12-state behavior machine
with seeded autonomous wandering, cached rectangle-aware DOM obstacle
steering, batched Canvas 2D dot rendering with 4 quality tiers and an
automatic performance governor, and full accessibility handling
(`prefers-reduced-motion`, `aria-hidden`, an opt-out preference). It is
live in the portfolio layout (`app/layout.tsx`) behind an idle-time-loaded,
`ssr:false` dynamic import, and has a dedicated `/motion-lab` route for
isolated development and review.

131 unit tests pass. The production build succeeds. No unrelated portfolio
behavior, styling, or file was modified beyond the minimal, targeted
integration points (7 pre-existing files touched, each with a small,
explained diff — see §4).

**What was not done, explicitly**: no real browser session was used to
measure runtime frame-time budgets (the user declined to connect browser
tooling this session) or to visually review motion quality; FABRIK legs
and Pretext text interactions are implemented-but-gated or entirely
deferred per the spec's own phase gates. See §13 for the complete list.

## 2. Architecture

```
React (components/mascot/*.tsx)
  └─ owns: mount lifecycle, DPR-capped resize, pointer/scroll listeners,
     low-frequency debug UI (500ms poll), accessibility toggles
        │
        ▼
MascotEngine (lib/mascot/MascotEngine.ts)
  └─ owns: FixedStepLoop, CanvasMascotRenderer, DomObstacleRegistry,
     VisibilityController, PerformanceGovernor
        │
        ▼
MascotRuntime (lib/mascot/MascotRuntime.ts)
  └─ owns: PoseController (spine), CreatureRig (ribs), DotSkin (skin
     points), BehaviorMachine, WanderPlanner, TargetDirector,
     InterestDirector, ParticlePool, Verlet chains (antennae/whisker)
```

React never touches anything below `MascotEngine`. `MascotEngine` never
imports React. Simulation (`lib/mascot/core`, `motion`, `character`,
`behavior`) has zero dependency on rendering (`lib/mascot/rendering`) or
DOM interaction (`lib/mascot/interaction`) — each is independently unit
tested. See `docs/mascot/ARCHITECTURE.md` for the full decision log.

## 3. Files added

115 new files. By area:

- `lib/mascot/` — 36 TypeScript modules (core math, motion, character,
  behavior, interaction, rendering, debug, plus `MascotEngine.ts`,
  `MascotRuntime.ts`, `MascotConfig.ts`, `types.ts`).
- `components/mascot/` — `ProceduralMascotLoader.tsx`,
  `ProceduralMascotCanvas.tsx`, `MascotDebugPanel.tsx`,
  `MascotAccessibilityControls.tsx`, `Mascot.module.css`.
- `app/motion-lab/` — `page.tsx`, `page.module.css`.
- `tests/mascot/` — 19 test files, 131 tests.
- `tests/e2e/` — 4 Playwright-shaped specs (not runnable yet — see §13).
- `scripts/mascot/` — `verify.mjs`, `perf-budget.mjs`.
- `docs/mascot/` — `BASELINE_AUDIT.md`, `ARCHITECTURE.md`,
  `MOTION_RECIPES.md`, `PERFORMANCE.md`, `PLAYTEST.md`,
  `IMPLEMENTATION_STATUS.md`, `FINAL_REPORT.md`,
  `performance-bundle-report.json`.
- `.claude/` — `CLAUDE.md`, 7 skills (`.claude/skills/*/SKILL.md` +
  references), 7 agents (`.claude/agents/*.md`), 2 hooks
  (`.claude/hooks/*.sh`), `settings.json`.

## 4. Files modified (pre-existing, all minimal and explained)

- `app/layout.tsx` — added one import and one `<ProceduralMascotLoader />`
  line.
- `components/ui/Buttons.tsx` — added `data-mascot-obstacle="hard"` as a
  default (overridable) attribute on both `Button` and `ButtonWithIcon`,
  covering most CTAs site-wide from one place.
- `components/Navbar.tsx` — added `data-mascot-obstacle="hard"` to the
  logo wrapper and the mobile full-screen menu overlay; added a
  `useEffect` that dispatches `OBSTACLE_INVALIDATE_EVENT` when the menu
  opens/closes.
- `components/ui/MenuToggle.tsx` — added `data-mascot-obstacle="hard"`.
- `components/MissionCard.tsx` — added
  `data-mascot-interest={isLocked ? undefined : "project"}`.
- `package.json` — added `test:mascot`, `test:mascot:watch`,
  `verify:mascot`, `perf:mascot` scripts. No dependencies added or
  changed.
- `tsconfig.json` — added `tests/e2e` to `exclude` (required so
  TypeScript doesn't fail on the not-yet-installed `@playwright/test`
  import in the e2e specs).

No other file was touched. `git status` before this work was clean; every
change above is additive or a single, explained line.

## 5. Behavior states

All 12 required states implemented: `dormant`, `wake`, `follow`, `wander`,
`inspect`, `orbit`, `avoid`, `sprint`, `rest`, `scatter`, `reform`,
`reducedMotion`. Each has a documented minimum/maximum duration, motion
recipe, and (where relevant) enter/update/exit/canExit hooks — see
`docs/mascot/MOTION_RECIPES.md` and `lib/mascot/MascotRuntime.ts`'s
`createBehaviorRegistry()`. Transitions are decided in one place
(`decideNextBehavior`), not scattered through the render loop. No
transition snaps the target — `TargetDirector` blends pointer/wander
targets over `MASCOT_CONFIG.targetBlendDurationSeconds` (0.6s).

## 6. Motion systems

- `SecondOrderDynamics` (t3ssel8r formulation with the k2 stability fix):
  root following, heading orientation, core expression breathing.
- `SpineSolver`: 24-joint root-to-tail distance + angle-constrained chain,
  region-interpolated angle limits (stiff head, soft tail).
- `VerletChain`: antennae (×2) and tail whisker secondary motion, with
  drag, capped max speed, and bounded distance-constraint iterations.
- `FabrikSolver`: implemented and tested (reachable/unreachable targets,
  length preservation, temporal bend stability), not wired into the
  default rig — explicit spec gate.
- `WanderPlanner`: seeded, 8 path families (wide-loop, figure-eight,
  lazy-sweep, card-orbit, edge-cruise, diagonal-sprint, curiosity-circle,
  rest-curl), Catmull-Rom sampling, never repeats the same path kind
  twice in a row, clamps all output to safe viewport bounds.

## 7. DOM interaction

`DomObstacleRegistry` caches `[data-mascot-obstacle]`/`[data-mascot-interest]`
rectangles, measuring only in `refresh()` (mount, resize, 120ms-throttled
scroll, or an explicit `mascot:invalidate-obstacles` window event — wired
to the Navbar's mobile menu toggle). `RectangleSteering` uses
closest-point-on-rectangle geometry, explicit inside-rectangle handling,
and travel-aligned tangent selection for stable corner gliding — fully
unit tested (27 tests: sides, corners, inside, zero-distance, tangent
selection, force cap, combined obstacles). Hard obstacles (nav, buttons,
forms) trigger the dedicated `avoid` behavior once combined steering force
exceeds a threshold; soft obstacles and project-card interest targets
influence the target continuously without a state change.

## 8. Quality tiers

Four tiers (reduced/low/medium/high) controlling dot count (0-3800),
particle count (0-650), spine solver iterations (1-4/5), and DPR cap
(1-2) — see `docs/mascot/MOTION_RECIPES.md`/`PERFORMANCE.md` for the full
table. `PerformanceGovernor` downgrades after sustained slow frames,
never changes quality mid-sprint/scatter, and upgrades at most once per
session. Its policy logic is unit tested; it has not been exercised
against real measured frame times (no browser session — see §13).

## 9. Accessibility

- `prefers-reduced-motion` is read at engine construction and live via a
  `change` listener; when active, the behavior machine is pinned to the
  `reducedMotion` state (near-static, cannot be exited except by the
  preference itself changing).
- The canvas is `aria-hidden="true"` and `pointer-events: none`.
- No automatic audio anywhere in the mascot code.
- The portfolio is fully usable with the mascot disabled — it mounts on
  browser idle time (never blocking initial paint/interactivity) and
  respects a `localStorage` opt-out (`mascot:disabled`).
- Semantic HTML/existing accessibility markup on Navbar/Buttons/MissionCard
  was preserved; only `data-mascot-*` attributes were added.

## 10. Test results

- **131/131** unit tests passing (`npm run test:mascot`), covering every
  category in the spec's "Required Unit Tests" list.
- `node scripts/mascot/verify.mjs` (full): typecheck ✔, lint ✔, format ✔,
  test:mascot ✔, build ✔ — all scoped to mascot-owned paths so
  pre-existing, unrelated repo issues (16 TS errors, ~220 lines of lint
  warnings/errors outside mascot code) don't block this gate, and were
  not touched.
- E2E: 4 Playwright-shaped specs written (`tests/e2e/mascot-*.spec.ts`),
  not runnable without installing `@playwright/test` — a dependency
  decision left to the user rather than made unilaterally.
- Server-rendered smoke test of `/` and `/motion-lab` (via `npm run dev` +
  `curl`): both 200, canvas and obstacle/interest markup present, no new
  console/compile errors, pre-existing `forwardRef` warning confirmed
  present before any mascot edit.

## 11. Performance results

Bundle-level evidence only (see `docs/mascot/PERFORMANCE.md`): `/`
(includes the mascot loader) is 258 kB First Load JS; `/motion-lab` is a
separate 96.3 kB chunk; zero PixiJS/Three.js markers in any
mascot-attributed client chunk. Real frame-time budgets (simulation/render
average, p95, worst, actual FPS) were **not measured** — no browser
automation was available this session. This is the single largest gap in
this pass; see §13 and `PLAYTEST.md` for how to close it.

## 12. Build result

`npm run build` succeeds. No new build warnings introduced by mascot code
(the one pre-existing `metadataBase` warning is unrelated and predates
this work).

## 13. Limitations (complete list)

1. **No real browser verification.** All visual/motion-quality review,
   real frame-time measurement, and interactive playtesting
   (`docs/mascot/PLAYTEST.md`'s full matrix) remain to be done by hand or
   via Playwright — the user declined to connect browser tooling this
   session.
2. **FABRIK legs implemented but not wired in** (explicit spec gate,
   Phase 12).
3. **Pretext text interactions not started** (explicit spec gate,
   optional Phase 13).
4. **No GPU renderer** (gate not met — no profiler evidence exists that
   Canvas 2D is a bottleneck, and none can be gathered without a browser).
5. **Simulation/render time not split** — `MascotEngine` currently feeds
   `PerformanceGovernor` one combined per-frame duration rather than two
   separate averages.
6. **No render-time interpolation** — `FixedStepLoop`'s `interpolationAlpha`
   is computed but currently unused by `MascotEngine.render()`.
7. **Rectangle steering acts on the root position only**, not the full
   body/tail.
8. **`MascotEngine`'s own lifecycle has no direct automated test** (needs
   a real `HTMLCanvasElement`/`document`; covered indirectly via
   `FixedStepLoop.test.ts` and code review instead).
9. **A handful of ambient TypeScript global type names** (`EventListener`,
   `ParentNode`, `FrameRequestCallback`, `NodeListOf`) trip this repo's
   base ESLint `no-undef` rule (a pre-existing, repo-wide quirk affecting
   other files too, e.g. `React`/`JSX`/`OscillatorType`). Mascot code
   avoids referencing those specific names directly rather than modifying
   the shared `.eslintrc.json`.

## 14. Future work

In priority order:

1. Connect a real browser session (Playwright, or Chrome DevTools MCP) and
   complete `docs/mascot/PLAYTEST.md`'s matrix + capture real frame-time
   numbers into `docs/mascot/PERFORMANCE.md`.
2. Visually tune `lib/mascot/motion/MotionRecipes.ts` /
   `lib/mascot/MascotConfig.ts` against that real review, using the
   `directing-character-motion` review rubric.
3. Split simulation vs. render timing in `MascotEngine` for a more
   accurate `PerformanceGovernor` signal.
4. Consider FABRIK legs (Phase 12) only after the above motion review is
   positive.
5. Consider Pretext interactions (Phase 13) only after that.
6. Consider a GPU renderer only if real profiling shows Canvas 2D is the
   bottleneck.

## 15. How to use the motion lab

```bash
npm run dev
# open http://localhost:3000/motion-lab
```

Controls: quality/enabled/reduced-motion toggles (top-left HUD), and a
debug panel (bottom-right) with pause/resume, live behavior + performance
stats (500ms poll), a debug-overlay toggle (spine/normals/obstacles),
scatter/reform/wake/rest trigger buttons, a slow-motion slider
(`engine.setTimeScale`), and a deterministic scenario player. In
development, `window.__MASCOT_DEBUG__` exposes `playScenario`, `pause`,
`resume`, `snapshot`, `setQuality`, `reset` from the browser console — not
present in production builds.

## 16. How to disable the mascot

- **Per-browser opt-out**: `localStorage.setItem("mascot:disabled", "true")`
  then reload — `ProceduralMascotLoader` checks this before mounting
  anything.
- **Site-wide**: remove the `<ProceduralMascotLoader />` line (and its
  import) from `app/layout.tsx`. Everything else keeps working —
  `data-mascot-*` attributes are inert without the loader.

## 17. How to tune recipes

1. Edit `lib/mascot/motion/MotionRecipes.ts` (per-behavior
   frequency/damping/response) or `lib/mascot/MascotConfig.ts` (durations,
   steering, dot skin ratios, etc.).
2. Review the change live in `/motion-lab` — use the scenario player and
   slow-motion slider for a controlled comparison, not freehand pointer
   movement.
3. Run `npm run test:mascot` — the numeric-stability tests will catch a
   genuinely broken configuration (e.g. negative frequency), though they
   won't judge "does this look good."
4. Document the new value and the visual reasoning in
   `docs/mascot/MOTION_RECIPES.md`, replacing the old row.
