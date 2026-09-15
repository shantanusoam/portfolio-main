# Octocat-inspired home playground

## Experience and entry

Route: `/`. Select Explore mode and click the small cat perched on the top
hero string. Direct entry: `/?octocat=play` (also enables Explore mode).
The portfolio remains the stage. Land on the highlighted Living Index link,
Enter Lab link, and name heading to find all three sparks.

| Input                         | Action                                              |
| ----------------------------- | --------------------------------------------------- |
| Left/right or A/D             | Walk                                                |
| Space, Up, or W               | Jump; hold for more height                          |
| Pointer drag on the character | Pick up and release with momentum                   |
| Click the active character    | Short jump                                          |
| P / Pause                     | Pause or resume                                     |
| R / Reset                     | Start another lap                                   |
| Escape / Exit                 | Return to the ambient home companion                |
| Touch buttons                 | Walk and jump on coarse pointers and narrow screens |

The earlier `/octopod-lab` remains a separate eight-arm experiment.

## Reference and implementation plan

The supplied recordings show a small cat-headed character living on actual
interface edges, with a heavy head, tapering limbs, fluid turns, and compressed
landings. The correction is the home-view interaction and 3D silhouette,
following the user's clarification about Cameron Foxly's Copilot Easter egg.

1. Build a cat-headed, tentacled 3D companion with original code-authored geometry.
2. Implement planted steps, head lag, spring-driven limb curves, jump anticipation,
   variable-height jumps, and drag/release physics.
3. Use measured hero UI edges as one-way platforms and add a three-ledge goal.
4. Add a small Framer Motion HUD, keyboard/touch controls, and reversible activation.
5. Check motion invariants, types, lint, production build, and deployed UI behavior.

This is an independent implementation inspired by the supplied reference.
It does not contain GitHub's source, a copied mesh, or a Blender-authored asset.
The editable model is constructed in `lib/home-octocat/renderer.ts` using Three.js.

## Ownership and performance

- `motion.ts`: deterministic screen-space root physics, seven spring chains,
  planted foot targets, swept one-way contacts, coyote time and jump buffering.
- `renderer.ts`: Three.js orthographic camera and lit meshes; tapered tube vertex
  and normal buffers are updated in place. No per-frame geometry reconstruction.
- `runtime.ts`: reuses the repository's `FixedStepLoop` with a 1/120 s step and
  at most six catch-up updates. DOM geometry is sampled outside the animation
  loop on mount, reflow, settled entrance, resize, and throttled scroll.
- `HomeOctocat.tsx`: lifecycle, pointer capture, input ownership, and low-frequency
  HUD updates. The Three.js runtime is imported after the home view mounts.

Rendering uses a moving 220 × 220 transparent canvas, capped at 1.5 DPR.
The loop pauses for hidden tabs, an offscreen hero, and explicit pause.
Reduced-motion visitors get a settled static idle pose; choosing Play permits
the requested physics interaction with secondary motion reduced.
GPU resources, observers, timers, and event listeners are disposed on unmount.
Context loss reports an unavailable state and stops the loop.

Only the character and HUD receive pointer events. Form fields, dialogs,
modified shortcuts, and native Space activation on buttons remain usable.
The existing fish habitat, cursor effect, combo trail, and arcade trigger
unmount while the home game is active and return on exit. Focus mode unmounts
the home companion. Scrolling away ends play without moving keyboard focus.

## Verification

- `npm run test:home-octocat`: nine deterministic tests covering anticipation,
  landing/goal collection, variable jump height, fast falls, coyote time,
  scroll translation, dragging, stable limb chains, and reset/reduced motion.
- `npm run test:procedural-character`: existing 23 tests pass.
- `npx tsc --noEmit`: passes.
- Targeted Next ESLint on the changed TypeScript files: passes.
- `npm run build`: passes.

The cloud browser cannot reach the workspace's localhost preview. Live visual
and control checks are performed against the normal GitHub-triggered deployment.
These checks are not a measured frame-rate or mobile-device performance benchmark.
