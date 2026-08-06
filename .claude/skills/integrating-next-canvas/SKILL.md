---
name: integrating-next-canvas
description: Integrates browser-only Canvas animation engines into Next.js while preserving server rendering, lazy loading, lifecycle cleanup, responsive sizing, accessibility, and portfolio interactivity. Use when editing mascot React components, loaders, route integration, Canvas sizing, observers, or client boundaries.
---

# Next.js Canvas workflow

1. Keep browser APIs behind a Client Component boundary — every file under
   `components/mascot/` starts with `"use client"`.
2. Use a client-side dynamic import for browser-only mascot code:
   `ProceduralMascotLoader.tsx` wraps `ProceduralMascotCanvas` in
   `dynamic(() => import(...), { ssr: false, loading: () => null })`,
   declared inside a Client Component.
3. Mount one imperative `MascotEngine` instance through a ref
   (`ProceduralMascotCanvas`'s `engineRef`) — never create a second engine
   for the same canvas.
4. Pass the canvas element and config to the engine constructor; never
   reach into engine internals from React (no `engine.runtime.pose.joints`
   from a component — if you need it, add a method to the `MascotEngine`
   contract in `lib/mascot/types.ts`).
5. Never update React state per frame. The one exception is
   `MascotDebugPanel`'s 500ms-interval snapshot polling, which is
   explicitly documented as the low-frequency debug exception.
6. Resize using CSS dimensions plus capped DPR
   (`ProceduralMascotCanvas`'s `applySize`, driven by `window.innerWidth`/
   `innerHeight` + `ResizeObserver` on `document.documentElement`).
7. Use Pointer Events (`lib/mascot/input/PointerInput.ts`) attached at the
   `window` level so the decorative `pointer-events: none` canvas never
   blocks page interaction.
8. Pause for hidden documents (handled inside `MascotEngine` via
   `VisibilityController`, not duplicated in the React layer) and for the
   `enabled` prop going false (`engine.setEnabled(false)`).
9. Destroy engine, observers, frames, timers, and listeners on unmount —
   see `ProceduralMascotCanvas`'s effect cleanup function; it is the single
   source of truth for teardown order.
10. Verify no hydration errors or layout shifts (the canvas is
    `position: fixed`, so it never participates in document flow/layout).
11. Verify the mascot is in a separate client chunk (`next/dynamic` with
    `ssr: false` in `ProceduralMascotLoader.tsx` guarantees this — confirm
    with `npm run build` output if you touch the loader).
12. Run `npm run build` and manually smoke-test `/` and `/motion-lab`.

Read `references/lifecycle-checklist.md` before declaring integration
complete.
