# Procedural Mascot Project Rules

## Intent

Build and maintain an original procedural portfolio mascot without harming
portfolio usability, accessibility, or initial-load performance. See
`PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md` for the full specification
and `docs/mascot/` for baseline audit, architecture decisions, motion
recipes, performance results, playtest results, implementation status, and
the final report.

## Architecture

- React owns lifecycle and low-frequency UI only.
- `lib/mascot` owns simulation and rendering. It has zero React imports.
- Never store per-frame simulation state in React state.
- Keep renderers (`lib/mascot/rendering`) separate from simulation
  (`lib/mascot/motion`, `lib/mascot/behavior`, `lib/mascot/character`).
- Build and tune features in `/motion-lab` before production integration.
- `MascotEngine` (`lib/mascot/MascotEngine.ts`) is the only class React
  touches. It owns `MascotRuntime` (all mutable simulation state),
  `CanvasMascotRenderer`, `FixedStepLoop`, `DomObstacleRegistry`,
  `VisibilityController`, and `PerformanceGovernor`.

## Package manager

**npm** is authoritative in this repo (see `docs/mascot/BASELINE_AUDIT.md`
for why both `package-lock.json` and `pnpm-lock.yaml` exist). Use `npm run
<script>` for mascot scripts, not `pnpm`.

## Testing

No Jest/Vitest in this repo. Mascot unit tests use Node's built-in test
runner via `tsx --test`, matching the existing `test:game` script
convention (`components/easter-egg/game/logic.test.ts`). Run with:

```bash
npm run test:mascot
```

Do not add Vitest, Jest, or Playwright without discussing it first — this
repo has deliberately stayed dependency-light for tests. If Playwright is
ever added, wire it through `tests/e2e/mascot-*.spec.ts`, which already
exist as Playwright-shaped specs that no-op when `@playwright/test` isn't
installed.

## Performance

- Never call `getBoundingClientRect()` inside the fixed-step update or the
  render callback — `DomObstacleRegistry.refresh()` is the only place that
  measures, and it only runs on mount/resize/throttled-scroll/explicit
  invalidation (`OBSTACLE_INVALIDATE_EVENT`).
- Never allocate unbounded arrays in update or render loops. Dot/particle
  buffers are preallocated per quality tier and reused (`CanvasDotRenderer`,
  `ParticlePool`).
- Use the fixed simulation timestep (`FixedStepLoop`, 1/60s, max 3 catch-up
  steps) — do not add a second animation loop.
- Cap DPR by quality tier (`lib/mascot/rendering/RenderQuality.ts`).
- Pause on hidden document (`VisibilityController`) and after
  `engine.destroy()`.
- Mascot code is lazy-loaded via `ProceduralMascotLoader.tsx`
  (`next/dynamic`, `ssr: false`, mounted on browser idle time).
- Profile before adding PixiJS, Workers, or OffscreenCanvas — none are used
  today; see the migration gates in `docs/mascot/ARCHITECTURE.md`.

## Motion

- Preserve an original silhouette — do not copy the reference video's
  character.
- Use symmetry for construction (`CreatureRig.computeRibs`) and controlled
  asymmetry for motion (`CreatureRig.applyRibLean`, driven by one shared
  turn-lean signal, never independent per-side noise).
- Head leads, torso follows, tail settles last — this falls out of the
  root-to-tail `SpineSolver` sweep plus the tail's `VerletChain` secondary
  motion; don't special-case it elsewhere.
- Every state remains readable as a simple silhouette (score against
  `.claude/skills/directing-character-motion/references/review-rubric.md`).
- Use `SeededRandom` for anything that needs determinism (wander paths,
  skin sampling, particle seeds, scatter directions) — never
  `Math.random()` inside `lib/mascot`.
- Tune per-behavior values in `lib/mascot/motion/MotionRecipes.ts` and
  document the visual reasoning in `docs/mascot/MOTION_RECIPES.md`.

## Safety

- Do not reset or overwrite unrelated changes.
- Do not commit or push unless asked.
- Preserve existing routes and interactions.
- Navigation, forms, and CTAs are hard obstacles
  (`data-mascot-obstacle="hard"`) — `components/ui/Buttons.tsx` sets this
  by default for every `Button`/`ButtonWithIcon`, so most CTAs get it for
  free. Verify it wasn't accidentally overridden via a spread `className`/
  `data-mascot-obstacle` prop before shipping a new CTA.

## Validation

After mascot changes, run:

```bash
npm run verify:mascot   # format/lint/typecheck/unit tests, then production build
npm run test:mascot     # just the unit tests
npm run perf:mascot     # performance budget report -> docs/mascot/PERFORMANCE.md
```

Update `docs/mascot/IMPLEMENTATION_STATUS.md` after each major phase.
