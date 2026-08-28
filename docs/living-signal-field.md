# Living Signal Field

The homepage atmosphere is one shared visual system, not a stack of unrelated
effects. The procedural fish, hero strings, selected controls, pointer and
scroll all feed a fixed full-screen canvas beneath the DOM.

## Rendering contract

- `LivingSignalField.tsx` owns one WebGL context and one capped 30fps loop.
- The fragment shader composes quiet caustic bands, a velocity-aligned fish
  wake, a pointer current and at most four expanding pulses.
- The canvas is `aria-hidden`, never receives pointer events and sits below the
  real HTML. Text, links, focus order and selection remain ordinary DOM.
- WebGL absence falls back to Canvas 2D; context/shader failure leaves a static
  CSS atmosphere rather than removing or blocking content.

## Signal boundaries

- `MascotEngine.getSignalSnapshot()` exposes only root position, velocity,
  behavior and time. The field never copies the full spine or mutates the fish.
- `portfolio:living-canvas-pulse` carries normalized, clamped ripple data.
  Hero strings emit it on real plucks; marked controls also pulse on deliberate
  pointer activation.
- Pulse storage is capped at four entries. New signals evict the oldest.

## Performance and accessibility

- Dynamic import after browser idle.
- Desktop/fine-pointer Explore mode only.
- 30fps paint ceiling and 1.25 DPR ceiling.
- Hidden-tab pause and complete teardown on unmount.
- Reduced motion renders one static frame without travelling pulses.
- Focus mode unmounts both habitat and creature.

The experimental HTML-in-canvas API inspired the composition, but production
does not depend on it. The live interface stays the source of truth in every
browser.
