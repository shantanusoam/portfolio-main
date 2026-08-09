---
name: rendering-dot-creatures
description: Implements and optimizes symmetric dot-based character rendering for Canvas 2D or a profiled WebGL fallback. Use when changing dot sampling, body skinning, Canvas batching, particles, quality tiers, visual effects, or renderer performance.
---

# Dot rendering workflow

1. Preserve the simulation-to-renderer boundary: `lib/mascot/rendering`
   reads `MascotRuntime` state (ribs, skin points, particles) but never
   mutates simulation — the boundary is enforced by `MascotEngine.render()`
   being the only place both are touched together.
2. Generate seeded skin points only when recipe or quality changes
   (`DotSkin.generateSkinPoints`, called from `MascotRuntime.setQuality()`
   only when `dotCount` actually differs — not every frame).
3. Store local longitudinal/lateral coordinates on each `SkinPoint`
   (`boneA`/`boneB`/`weightB` bind it to two spine joints).
4. Resolve world positions from the spine and smoothed normals each frame
   via `DotSkin.resolveSkinPointPosition()`, writing into a reused scratch
   object (`MascotEngine`'s `scratchDot`) — never allocate a point per dot
   per frame.
5. Group dots by visual layer (`SkinPoint.group`: 0 = structural core,
   1 = body, 2 = accent) and fill each group in one batch via
   `CanvasDotRenderer` — `beginFrame()` once, `push()` per dot,
   `flushGroup()` once per group per frame.
6. Reuse arrays and paths where practical — `CanvasDotRenderer` preallocates
   per-group buffers at `registerGroup()` time sized to the highest quality
   tier's dot count, so quality downgrades never need to reallocate.
7. Keep a solid-silhouette debug renderer available
   (`CanvasMascotRenderer.drawSilhouette()`) for milestone reviews.
8. Profile medium and low quality before adding a GPU renderer — record
   findings in `docs/mascot/PERFORMANCE.md`.
9. Record dot count, draw time, and particle count when profiling.
10. Update `docs/mascot/PERFORMANCE.md`.

## Renderer gates

Use Canvas 2D by default (see the "Canvas 2D as initial renderer" decision
in `docs/mascot/ARCHITECTURE.md`). No PixiJS/WebGL code exists in this repo
today — the gate has not been met.

Create or activate a GPU renderer only when profiler evidence shows Canvas
rendering exceeds the agreed budget (desktop: mascot render average under
4ms; mobile: under 7ms — see `docs/mascot/PERFORMANCE.md`) or required
effects need shader deformation.

Do not use WebGPU as the first production backend.

Read `references/canvas-batching.md` for hot-loop rules.
Read `references/quality-tiers.md` for degradation rules.
