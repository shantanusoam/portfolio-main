# Living Signal Field

The homepage atmosphere is one shared visual system, not a stack of unrelated
effects. The procedural fish, hero strings, selected controls, pointer and
scroll all feed a fixed full-screen canvas beneath the DOM.

## Motion map

The page declares an editorial energy role on each major section. The field
samples the section at the viewport center and eases toward its profile instead
of snapping at boundaries.

| Role   | Purpose                                | Typical sections                         | Field behavior                                  |
| ------ | -------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| Moment | Invite play or mark a memorable reveal | Hero, Living Index, interactive labs     | Full currents, brighter caustics, stronger wake |
| Bridge | Carry attention through evidence       | Proof, projects, systems, latest notes   | Restrained current and responsive echoes        |
| Rest   | Protect comprehension and closure      | About, field notes, credibility, contact | Nearly still, low-contrast atmosphere           |

`data-signal-energy` fine-tunes amplitude and `data-signal-tone` shifts the
shared palette warm, neutral or cool. Content remains legible if either
attribute is absent or invalid.

## Rendering contract

- `LivingSignalField.tsx` owns one fixed canvas, signal collection and a capped
  render loop. `fieldRenderer.ts` owns the WebGL/Canvas 2D implementation.
- The fragment shader composes quiet caustic bands, fine current filaments, a
  velocity-aligned V-shaped fish wake, a pointer current and at most four
  semantic pulses.
- The canvas is `aria-hidden`, never receives pointer events and sits below the
  real HTML. Text, links, focus order and selection remain ordinary DOM.
- WebGL absence falls back to Canvas 2D. Context loss pauses the loop and a
  restored context rebuilds every GPU resource; terminal failure leaves a
  static CSS atmosphere rather than removing or blocking content.

## Signal boundaries

- `MascotEngine.getSignalSnapshot()` exposes only root position, velocity,
  behavior and time. The field never copies the full spine or mutates the fish.
- `portfolio:living-canvas-pulse` carries normalized, clamped ripple data.
  Hero strings emit a short harmonic, project cards make a quiet double echo,
  controls make a compact ring, and creature controls make a small vortex.
- Marked controls respond to deliberate pointer activation and keyboard
  activation. Hover alone never creates a pulse.
- Pulse storage is capped at four entries. New signals evict the oldest.

## Performance and accessibility

- Dynamic import after browser idle.
- Desktop/fine-pointer Explore mode only.
- Balanced devices use a 30fps paint ceiling and 1.25 DPR ceiling. Low-core
  devices start conservatively, and sustained slow frames trigger one-way
  quality reduction rather than oscillating between tiers.
- Hidden-tab pause and complete teardown on unmount.
- Reduced motion renders one static frame without travelling pulses.
- Focus mode unmounts both habitat and creature.
- Forced-colors mode removes the decorative canvas entirely.

The experimental HTML-in-canvas API inspired the layered composition, but
production does not depend on it. The live interface stays the source of truth
in every browser, while the shader and Canvas 2D fallback consume the same
small normalized signal model.
