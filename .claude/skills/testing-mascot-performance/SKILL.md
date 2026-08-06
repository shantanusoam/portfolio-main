---
name: testing-mascot-performance
description: Validates procedural mascot correctness, lifecycle safety, browser behavior, responsive layouts, accessibility, and frame budgets. Use when adding tests, profiling, running browser scenarios, checking leaks, validating quality tiers, or preparing completion reports.
---

# Validation workflow

1. Read `docs/mascot/IMPLEMENTATION_STATUS.md` and the changed files.
2. Run unit tests for changed math: `npm run test:mascot`.
3. Run deterministic motion-lab scenarios from `/motion-lab`'s debug panel.
4. Test desktop, tablet, and mobile viewports (resize the browser or use
   devtools device emulation — no Playwright is installed in this repo, see
   `docs/mascot/BASELINE_AUDIT.md` for why, and `tests/e2e/mascot-*.spec.ts`
   for the Playwright-shaped specs that are ready if it's ever added).
5. Capture console errors and warnings — `npm run dev` and check the
   terminal + browser console on `/` and `/motion-lab`.
6. Verify route navigation and unmount cleanup (navigate away from `/` and
   back; the mascot canvas should not duplicate or leak — see
   `ProceduralMascotCanvas`'s cleanup function).
7. Test hidden-tab (switch tabs, confirm the loop pauses via
   `VisibilityController`) and reduced-motion (`prefers-reduced-motion:
   reduce` in devtools, or the motion-lab's "Reduced motion override"
   checkbox) behavior.
8. Record average, p95, and worst frame time via
   `engine.getDebugSnapshot().performance` (visible in the motion-lab HUD).
9. Verify no layout reads occur in normal animation frames — grep for
   `getBoundingClientRect` outside `DomObstacleRegistry.refresh()`.
10. Run `npm run build` (production build).
11. Write results to `docs/mascot/PLAYTEST.md`.
12. Block completion when introduced failures remain — pre-existing
    failures unrelated to mascot code should be documented, not silently
    ignored or fixed as a side effect.

Read `references/browser-matrix.md` for required scenarios.
