# Living Signal Ocean

The homepage atmosphere is one shared system, not a collection of independent
effects. The fish, strings, selected controls, command palette and System X-Ray
send small semantic signals to a decorative surface. The DOM remains the source
of truth. Nothing in the GPU path changes mascot physics, audio or navigation.

## Renderer boundary

`LivingSignalField` collects the existing normalized `LivingFieldState`.
Optional fields add pointer velocity, koi presence/turn, command focus/release,
three X-Ray rectangles and four hero occluders. Existing callers remain valid.

`createLivingFieldRenderer(host, options)` is asynchronous. It tries:

1. Dynamically imported vGPU/WebGPU on eligible devices.
2. The existing WebGL implementation.
3. The existing Canvas 2D implementation.
4. Static CSS if every renderer is unavailable.

Each attempt receives a **fresh detached canvas**. A canvas already claimed by
one context type cannot be reused for another. A renderer only mounts after its
initialization succeeds; WebGPU also executes/validates every pass against a tiny
offscreen target before claiming the visible surface. Cancellation disposes late
results. Device failure falls down the renderer ladder rather than retrying in
a loop. WebGL context loss skips directly to a fresh 2D canvas.

The surface is aria-hidden, pointer-events none, and behind normal HTML.
No content waits on GPU initialization. Focus mode unmounts the ambient system;
forced colors and coarse/mobile layouts do not initialize it. Reduced motion
uses a static fallback frame with no ongoing simulation, pulse or pointer loop.

## Pinned vGPU integration

This release uses **vgpu 0.3.1**, with its actual `init`, `compute`, `effect`,
`pingPongStorage`, `storage`, `surface`, `target` and `frame` APIs. Shared WGSL
imports resolve through `@vgpu/wgsl/loader-webpack`, configured for both the
project's production webpack build and its Turbopack configuration.

The unlinked, noindex `/gpu-smoke` route is the isolated fullscreen
initialization/import/resize/disposal specimen. A production build and the
native software-rendered smoke passed before the compute migration began.

The vGPU [agent entry point](https://vgpu.sh/agents.md) and
[documentation](https://vgpu.sh/) are upstream references, not runtime
dependencies. No CLI/MCP server runs in the production application.

## Compute passes

A fixed low-resolution storage grid holds velocity XY, signal Z and wake W.
It is bilinearly upscaled for presentation. Pressure has its own ping-pong pair;
curl/divergence share a diagnostic buffer. There is no per-frame GPU readback.

| Pass         | Actual operation                                                                          | Why it exists                                                 |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Advection    | Semi-Lagrangian backtrace, neighbor mixing, decay, bounded splats                         | Carry information through a persistent current                |
| Diagnostics  | Central differences of velocity                                                           | Measure signed curl and divergence                            |
| Pressure     | 3 or 5 warm-started Jacobi iterations                                                     | Estimate a small pressure correction                          |
| Projection   | Subtract pressure gradient, add mild vorticity confinement, zero normal boundary velocity | Reduce compression and preserve small turns                   |
| Presentation | Bilinear field sampling, wake, local string light, X-Ray geometry                         | Translate the simulation into restrained editorial atmosphere |

This is an intentionally approximate, bounded fluid-inspired field, not a
physically complete water or global-illumination simulation. Velocity is capped;
signal/wake are clamped and decay without input. The simulation advances at a
fixed 30 Hz, with at most two catch-up steps per paint. Viewport/DPR changes
resize presentation only, preserving grid allocations.

## What wakes it; how it stops

| Source                      | Rule                                                                                      | Return to quiet                                          |
| --------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Pointer movement            | Small local velocity impulse, never a large hover pulse                                   | Exponential input decay                                  |
| Scroll                      | Broad directional current scaled by section energy                                        | Input eases to zero                                      |
| Moving koi                  | Directional splat and persistent wake proportional to speed/intent                        | Signal and wake dissipate independently                  |
| Koi turn                    | Signed velocity-direction change produces a small vortex                                  | Only while changing direction                            |
| Resting koi                 | Near-invisible breathing signal, gated by presence                                        | No wake accumulation                                     |
| String pluck                | Thin harmonic impulse plus local pressure/light wave                                      | Short pulse/light lifetime                               |
| Project activation          | Restrained double echo                                                                    | Bounded pulse lifetime                                   |
| Control/creature activation | Compact ring / spiral signature                                                           | Bounded pulse lifetime                                   |
| Command palette             | Transient curved force toward semantic center                                             | Settles in roughly half a second; short outward release  |
| System X-Ray                | Quiet ambient field, three bounded nodes, two directional packet paths, edge scan         | Fades when closed or offscreen                           |
| Soundroom (opt-in)          | Existing energy bridge adds a small warmth/activity bias and cooldown-limited bass pulses | Stops with audio/reactivity; never touches AudioContexts |

Pulse storage is capped at four. Deliberate pointer/keyboard activation can
create a pulse; passive hover cannot. Disabled/off-hero koi writes no new wake.
The GPU remembers the creature's movement without changing its behavior.

## Light instrument and semantic geometry

Four selected hero rectangles (title, rail, navigation, instrument) serve as
coarse occluders. They are measured on resize, font/layout changes and throttled
scroll updates, not rasterized as text each frame. Geometry packets are tiny.

String light uses thin outward bands and six bounded samples per occluder.
Only pixels in an active band perform the occlusion work. A source's own
containing rectangle does not self-shadow. This borrows the bounded local-light
and occlusion idea from radiance examples; it is **not** a radiance-cascade
implementation. It has no full-document lighting or texture readback.

X-Ray marks input/process/result regions on the selected flagship card.
Only one card owns this interpretation at a time; normal Product/System
buttons, images and text remain the accessible explanation without WebGPU.

## Editorial weather

| Role                | Sections                            | Energy                                 |
| ------------------- | ----------------------------------- | -------------------------------------- |
| Invitation / Moment | Hero                                | Curious, responsive                    |
| Evidence / Bridge   | Proof, current position             | Very low amplitude                     |
| Play / Moment       | Living Index                        | Currents return                        |
| Structure / Bridge  | Flagship cards, patterns            | Restrained directional signals         |
| Experiment / Moment | Maker Lab                           | More energetic, deliberately activated |
| Rest                | Notes, photos, credibility, contact | Near-still atmosphere                  |

The viewport's semantic zone drives smoothed energy/tone. Latest Notes is now
a Rest region. Section geometry never uses pin-spacers or changes document
height, preserving the existing scroll checkpoints.

## GPU Anatomy

`/gpu` is an opt-in Maker Lab instrument, also discoverable through **Enter GPU**
in the command palette. Its renderer is loaded only after Start simulation.

- Composite uses the homepage presentation pass.
- Velocity, signal and wake sample the real current buffer.
- Curl/divergence sample the real pre-projection diagnostic buffer.
- Pressure samples the real Jacobi buffer.
- Light isolates the presentation's local-light function; it is not a cached
  intermediate texture.

Bounded speed, viscosity, wake persistence, signal diffusion and light
persistence controls change this same solver. A six-second orbital probe
injects a wake without instantiating or modifying the mascot. A keyboard
button plucks a light wave; dragging pushes local current. Stop disposes GPU
resources. Hidden/offscreen sessions pause, and reduced-motion/Focus/forced
colors disable movement. If WebGPU is unavailable, composite fallbacks and
the full written explanations remain; diagnostic plots are not fabricated.

## Budgets and ownership

| Tier     | Eligibility (conservative heuristic)                                    | Simulation                      | Paint ceiling / DPR                        |
| -------- | ----------------------------------------------------------------------- | ------------------------------- | ------------------------------------------ |
| Low      | No WebGPU, <=4 cores, <=4 GB reported memory, Save-Data, reduced motion | Existing fallback or static     | 30 fps / 0.85; static under reduced motion |
| Balanced | Other eligible devices                                                  | 96 × 64, 3 pressure iterations  | 30 fps / 1.0                               |
| High     | >=12 cores and >=8 GB reported memory                                   | 128 × 80, 5 pressure iterations | 60 fps / 1.25; compute still 30 Hz         |
| Anatomy  | Explicitly started on a WebGPU device                                   | 96 × 64, 3 pressure iterations  | 30 fps / 1.0                               |

These are caps and eligibility heuristics, not measured performance guarantees.
The ambient loop can drop to 24 fps / 0.8 DPR after sustained CPU submission
cost. All owned buffers, surfaces, effects and compute passes are released by
`gpu.dispose()`. Observers, event subscriptions and RAFs have explicit cleanup.
No ML model, refraction pass, bloom stack, readback loop or document texture is
loaded on the homepage.

## Validation and scope

- `npm run verify:living-ocean`: resolves all WGSL imports and requires vGPU's
  native Naga validation; executes the real solver via `vgpu/node`.
  Covers initialization, equilibrium with disabled fish, finite diagnostics,
  stored/decaying wake, all eight presentation modes, repeated command/X-Ray
  input, nonempty output, resize and idempotent disposal.
- `npm run test:living-canvas`: normalized contracts, device tiers, pulse/zone
  semantics, unavailable/throwing backends, fresh-canvas fallback and abort.
- Independent TypeScript and changed-file ESLint checks; the legacy
  `npm run lint` still points at removed `next lint`, so it is not a valid gate.
- Existing mascot/procedural suites and a production Next.js build remain
  release checks. Browser/device visual playtesting is intentionally left to
  the owner for this release; no browser profiling result is claimed.

The compute tests use the vGPU-provided CPU software WebGPU driver in this
environment. That proves shader execution, not real-device frame rate.

Transmission/refraction, FFT/particle-ocean scenes, ML depth postcards and
full radiance cascades are intentionally **not shipped**. They require a
separate profiled experiment, not another layer over the editorial homepage.

## Reproducible dependency install

The npm lockfile is regenerated to match the existing Next 15 manifest and
the pinned vGPU dependency. The Tailwind ESLint plugin is pinned to the
existing compatible 3.13 version. The old hardcoded DB-tunnel command is
replaced by `scripts/db-tunnel.mjs`; it requires
`DB_TUNNEL_SSH_HOST`, `DB_TUNNEL_SSH_USER` and `DB_TUNNEL_TARGET_HOST`,
with optional validated local/target ports. No infrastructure endpoint or
SSH identity is published in the command.
