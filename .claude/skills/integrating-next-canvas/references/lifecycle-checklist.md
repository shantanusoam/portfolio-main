# Lifecycle checklist

- Canvas context created after mount (`CanvasMascotRenderer`'s constructor
  runs inside `MascotEngine`'s constructor, itself only ever instantiated
  inside `ProceduralMascotCanvas`'s `useEffect`).
- No render-time `window`/`document` access anywhere in
  `components/mascot/*.tsx` — all such access is inside `useEffect` bodies
  or event handlers.
- Dynamic import declared in a Client Component
  (`ProceduralMascotLoader.tsx`).
- `ResizeObserver` disconnected in the cleanup function
  (`ProceduralMascotCanvas`) and in `DomObstacleRegistry.detach()`.
- Pointer listeners removed (`PointerInput.detach()`).
- Scroll listener removed (`ScrollInput.detach()`, plus the throttle
  timer cleared).
- Media-query listener removed (`VisibilityController.detach()`, handling
  both the modern `addEventListener`/`removeEventListener` API and the
  legacy `addListener`/`removeListener` fallback).
- RAF cancelled (`FixedStepLoop.stop()`, called from `MascotEngine.destroy()`
  and `.pause()`).
- Engine `destroy()` is idempotent — a second call is a safe no-op
  (`MascotEngine`'s `destroyed` guard).
- Route navigation produces no duplicate loop — `ProceduralMascotCanvas`'s
  effect is keyed on `seed` only, so remounting the component (e.g. a route
  change that unmounts/remounts the layout) tears down the old engine
  before a new one is created.
- Visibility resume resets frame timing (`FixedStepLoop.start()` calls
  `resetTiming()`, so a tab returning from background doesn't produce one
  giant catch-up frame).
- Canvas backing size follows the quality DPR cap
  (`ProceduralMascotCanvas`'s `applySize` reads `qualityRef.current`, kept
  in sync via a separate effect so a live quality change updates future
  resizes too — not just the DPR at mount time).
