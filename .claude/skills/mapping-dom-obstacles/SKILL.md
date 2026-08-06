---
name: mapping-dom-obstacles
description: Builds cached DOM obstacle and interest maps for procedural Canvas characters without layout thrashing. Use when adding obstacle data attributes, rectangle measurement, spatial indexing, repulsion, tangential steering, project-card inspection, or scroll-aware environment interaction.
---

# DOM interaction workflow

1. Register only explicitly marked elements:
   `data-mascot-obstacle="hard"` (nav, buttons, forms — see
   `components/ui/Buttons.tsx`, which sets this by default on every
   `Button`/`ButtonWithIcon`), `data-mascot-obstacle="soft"` (decorative
   cards), or `data-mascot-interest="project"` (project cards, see
   `components/MissionCard.tsx`).
2. Measure rectangles outside the animation loop —
   `DomObstacleRegistry.refresh()` is the only place `getBoundingClientRect`
   is called, never inside `MascotRuntime.update()` or the render callback.
3. Refresh on controlled layout invalidation: mount, `resize`, a throttled
   `scroll` (120ms), or the explicit `OBSTACLE_INVALIDATE_EVENT` window
   event — dispatch that event after any layout change outside
   resize/scroll (see `Navbar.tsx`'s `useEffect` on `menuOpen`, which
   dispatches it when the full-screen mobile menu opens/closes).
4. Keep one documented coordinate system: viewport/client coordinates
   throughout (`getBoundingClientRect()`'s `left`/`top`/`right`/`bottom`,
   `PointerInput`'s `clientX`/`clientY`, the canvas is
   `position: fixed; inset: 0`). Do not mix in page/document coordinates.
5. Expand rectangles by mode-specific padding
   (`DomObstacleRegistryOptions.hardPadding`/`softPadding`/
   `interestPadding`).
6. Calculate closest-point rectangle distance via
   `RectangleSteering.closestPointOnRectangle` — never distance-to-center.
7. Handle inside-rectangle cases explicitly
   (`RectangleSteering.outwardNormalForInsidePoint` — exits through the
   nearest side, never divides by a near-zero distance).
8. Add tangential steering to glide around edges
   (`RectangleSteering.computeRectangleSteering` picks whichever of the two
   perpendicular tangents aligns with current travel direction).
9. Cap combined steering force (`RectangleSteering.combineSteering`, used
   by `MascotRuntime.applySteering()` to sum multiple nearby obstacles).
10. Protect navigation, forms, and CTAs as hard obstacles — verify a new
    interactive element actually gets `data-mascot-obstacle="hard"` (either
    via `Buttons.tsx` or explicitly) before shipping it.
11. Add geometric unit tests for new steering math
    (`tests/mascot/RectangleSteering.test.ts` covers sides, corners,
    inside, zero-distance, tangent selection, force cap, combined forces —
    extend that file, don't create a parallel one).
12. Use the `/motion-lab` debug overlay (`debugOverlay` toggle in
    `MascotDebugPanel`) to verify cached rectangles visually
    (`CanvasMascotRenderer.drawDebugObstacles`).

Never call `getBoundingClientRect()` from update or render.

Read `references/rectangle-steering.md` when changing collision or
repulsion math.
