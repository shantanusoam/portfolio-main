# PROCEDURAL MASCOT - CLAUDE CODE MASTER BUILD SPECIFICATION

> Working title: Neon Leviathan / Constellation Familiar  
> Primary environment: Next.js + React + TypeScript  
> Initial renderer: Canvas 2D  
> Optional renderer after profiling: PixiJS v8 with WebGL  
> Primary goal: Build an original, interactive, procedurally animated dot character that can live inside a portfolio without harming page performance, accessibility, responsiveness, or usability.

---

# HOW TO USE THIS FILE

1. Save this file at the repository root as:

   ```text
   PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md
   ```

2. Start Claude Code from the repository root.

3. Send:

   ```text
   Read @PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md and execute the specification completely. Do not stop after planning.
   ```

4. After the project agents in this document have been created, you may also start the coordinator directly:

   ```bash
   claude --agent mascot-coordinator
   ```

5. Treat this document as an implementation specification. It is not a request for another design proposal.

---

# MASTER EXECUTION DIRECTIVE

You are the implementation agent responsible for designing, building, integrating, testing, profiling, and documenting a production-quality procedural mascot for this Next.js portfolio.

Do not only explain how the system could be built.

Do not stop after producing a plan.

Do not return placeholder code while claiming completion.

Do not copy the exact character, branding, assets, silhouette, or animation from the supplied reference video.

Build an original character using these broad animation principles:

- second-order dynamics
- fixed-step simulation
- distance constraints
- angle constraints
- procedural spine deformation
- symmetric body generation
- controlled asymmetry through movement
- Verlet secondary motion
- FABRIK only where it is visually justified
- squash and stretch
- anticipation and follow-through
- interactive pointer response
- autonomous procedural wandering
- cached DOM obstacle interaction
- rectangle-aware steering
- quality tiers and graceful degradation

Work autonomously. Make reasonable engineering decisions from the current codebase. Ask the user only when a genuinely destructive or business-level decision cannot be inferred. Do not ask for approval for routine implementation choices.

Preserve all unrelated portfolio behavior and styling.

Do not reset, discard, overwrite, stage, commit, or push unrelated user changes.

Do not commit or push unless the user explicitly requests publishing.

When an advanced feature threatens stability, implement a smaller complete version rather than a large broken placeholder.

Use this execution pattern:

```text
inspect
-> document baseline
-> build isolated motion lab
-> validate core math
-> implement engine modules
-> validate lifecycle
-> add character rendering
-> profile
-> add DOM interaction
-> validate usability
-> integrate into portfolio
-> validate bundle and accessibility
-> add optional polish only inside budget
-> run complete verification
-> write final report
```

---

# PROJECT CONTEXT TO VERIFY

The likely repository is:

```text
shantanusoam/portfolio-main
```

The project has previously used:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- GSAP
- `@chenglou/pretext`
- client-side Canvas experiences
- generated portfolio and game assets

Do not assume every dependency, version, route, or branch is unchanged.

At the beginning:

1. Run `git status --short --branch`.
2. Identify the active branch.
3. Inspect `package.json`.
4. Detect the package manager from lockfiles.
5. Inspect the current Next.js directory structure.
6. Locate current Canvas, animation, Easter egg, hero, and experience components.
7. Search for:
   - `SecondOrderDynamics`
   - `ProceduralMascot`
   - `ProceduralCreature`
   - `requestAnimationFrame`
   - `repel-creature`
   - `@chenglou/pretext`
   - PixiJS
   - Three.js
   - Canvas
   - WebGL
8. Inspect current lint, type-check, build, unit-test, and browser-test infrastructure.
9. Record findings in:

   ```text
   docs/mascot/BASELINE_AUDIT.md
   ```

10. Create or update:

   ```text
   docs/mascot/IMPLEMENTATION_STATUS.md
   ```

The status file must include:

- current phase
- completed work
- files changed
- validation performed
- known issues
- next action
- performance measurements
- decisions made

Update it after every major phase.

---

# PROTOTYPE IDEAS THAT MUST BE PRESERVED

The supplied code and notes contain valuable ideas:

- a `SecondOrderDynamics` class for smooth response
- a procedurally constrained head and spine
- symmetrical rib points derived from local normals
- a body-width profile
- pointer tracking
- idle detection
- autonomous wandering
- compound trigonometric paths as an early experiment
- cached DOM rectangles for `.repel-creature`
- repulsion applied to movement targets rather than direct teleportation
- future FABRIK legs
- scroll-current reactions
- click or bite interactions
- an eventual WebGL upgrade

Preserve the ideas, but do not paste the prototypes unchanged.

---

# MANDATORY CORRECTIONS TO THE CURRENT PROTOTYPES

## 1. Never access `window` during component render

Do not write:

```ts
const pointer = useRef({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
});
```

Use neutral initial values and initialize browser-dependent values after mount.

## 2. Never use `Array.fill()` with mutable objects

Do not write:

```ts
Array(segmentCount).fill({ x: 0, y: 0, angle: 0 });
```

Every array position references the same object.

Use:

```ts
Array.from({ length: segmentCount }, () => ({
  x: 0,
  y: 0,
  previousX: 0,
  previousY: 0,
  angle: 0,
}));
```

Move hot simulation data to typed arrays after the design stabilizes when profiling justifies it.

## 3. Separate CSS size from Canvas backing size

Use a capped device-pixel ratio:

```ts
const dpr = Math.min(window.devicePixelRatio || 1, quality.dprCap);

canvas.style.width = `${cssWidth}px`;
canvas.style.height = `${cssHeight}px`;

canvas.width = Math.round(cssWidth * dpr);
canvas.height = Math.round(cssHeight * dpr);

context.setTransform(dpr, 0, 0, dpr, 0, 0);
```

Use CSS-pixel coordinates for simulation.

Do not call `scale()` repeatedly after resize without resetting the transform.

## 4. Use Pointer Events

Use:

- `pointermove`
- `pointerdown`
- `pointerup`
- `pointercancel`
- `pointerleave`

Support mouse, touch, and stylus through one path.

Use pointer capture when direct dragging is enabled.

The decorative Canvas should usually use `pointer-events: none`. A separate interaction layer or window-level pointer listener may provide input without blocking page controls.

## 5. Use a fixed simulation step

Use:

```ts
const FIXED_DT = 1 / 60;
const MAX_FRAME_DT = 0.05;
const MAX_STEPS = 3;
```

Accumulate frame time. Run at most three simulation steps. Render once.

Reset timing after tab suspension.

## 6. Add genuine secondary motion

The current forward-positioned chain has no physical memory.

For tail tips, antennae, ears, sensory fins, or loose ribs:

- store current and previous positions
- apply Verlet integration
- apply drag
- apply optional current or acceleration
- pin the root
- solve distance constraints with a bounded iteration count
- solve angle limits where needed

## 7. Fix listener cleanup

Every listener must use a named function and be removed with the same reference.

Every timeout, interval, observer, animation frame, worker, and media-query listener must be cleaned up.

## 8. Replace fixed delayed DOM scanning

Do not depend on:

```ts
setTimeout(updateObstacles, 500);
```

Use:

- one initial measurement after mount
- `ResizeObserver`
- a throttled passive scroll handler
- optional `MutationObserver` only when dynamic content requires it
- explicit registry invalidation

## 9. Replace centre-based circular repulsion

The current prototype measures distance from the target to the card centre. That is inaccurate for rectangles.

Use closest-point-on-rectangle geometry:

```ts
const closestX = clamp(point.x, rect.left, rect.right);
const closestY = clamp(point.y, rect.top, rect.bottom);

const dx = point.x - closestX;
const dy = point.y - closestY;
const distance = Math.max(0.0001, Math.hypot(dx, dy));
```

Apply:

- outward normal repulsion
- smaller tangential steering
- smooth falloff
- capped acceleration
- hysteresis to prevent edge jitter

If the point is inside a rectangle, exit through the nearest side.

## 10. Avoid negative stacking contexts

Do not rely on `z-index: -1`.

Use explicit layers:

```text
background
mascot visual layer
main content
navigation and modal controls
```

## 11. Pause invisible work

Pause or reduce work when:

- `document.visibilityState !== "visible"`
- the experience is disabled
- reduced motion is requested
- the component is unmounted
- the runtime is under sustained frame pressure

## 12. Do not update React state every frame

React owns:

- mounting
- menus
- debug controls
- accessibility settings
- quality selection
- low-frequency status

The engine owns:

- simulation
- input
- constraints
- rendering
- particles
- behavior
- collisions
- obstacle steering

---

# PRODUCT VISION

Build an original portfolio familiar that combines:

- a geometric machine
- a bioluminescent deep-sea creature
- a constellation
- a living data structure

Suggested working identity:

```text
Neon Leviathan
```

Alternative names:

- Data Ray
- Constellation Familiar
- Signal Eel
- Vector Wisp
- Lattice Koi
- Circuit Manta

## Personality

The mascot should feel:

- curious
- playful
- intelligent
- slightly mechanical
- softly organic
- responsive but not frantic
- capable of resting
- aware of the portfolio environment

## Recommended anatomy

- 20 to 28 main spine joints
- wider head and shoulder region
- long tapering tail
- paired symmetric ribs or fins
- one central core or eye
- optional antennae
- optional legs in a later gated phase
- dot skin over a structural rig

Use symmetry for construction.

Use controlled asymmetry for life:

- head turns first
- body follows
- tail settles last
- outside fin expands during turns
- inside fin compresses
- body stretches during acceleration
- impact waves move through dots
- eye or core tracks interesting content

---

# REQUIRED BEHAVIOR STATES

```ts
type MascotBehavior =
  | "dormant"
  | "wake"
  | "follow"
  | "wander"
  | "inspect"
  | "orbit"
  | "avoid"
  | "sprint"
  | "rest"
  | "scatter"
  | "reform"
  | "reducedMotion";
```

Optional later states:

```ts
type AdvancedMascotBehavior =
  | "crawl"
  | "land"
  | "step"
  | "hide"
  | "sleep"
  | "celebrate"
  | "textFeed";
```

Each state must define:

- minimum duration
- maximum duration where relevant
- entry action
- exit action
- target provider
- frequency
- damping
- response
- maximum speed
- maximum acceleration
- spine stiffness
- tail drag
- glow intensity
- dot spread
- transition eligibility
- cooldown

Do not scatter state conditionals throughout the render loop.

---

# EXPERIENCE RULES

1. Do not cover critical content for long periods.
2. Navigation, forms, buttons, and CTAs are hard obstacles.
3. Decorative cards are soft obstacles.
4. Project cards may be interest targets.
5. Inspection must end automatically.
6. Pointer chase must not become distracting.
7. Idle mode must blend smoothly into autonomous wander.
8. Autonomous sprints must be brief.
9. Reduced-motion users receive a static or very slow version.
10. The site must work with the mascot disabled.
11. The portfolio must render and remain useful before mascot JavaScript loads.
12. The mascot must not create cumulative layout shift.
13. The mascot must not intercept normal scrolling.
14. Do not autoplay audio.
15. Preserve semantic HTML and accessibility.

---

# TECHNOLOGY DECISIONS

## Initial renderer: Canvas 2D

Use Canvas first because:

- it is enough for one bounded character
- the math is easier to debug
- it adds no required runtime dependency
- it supports a focused motion lab
- it can render a few thousand batched dots efficiently

## Optional renderer: PixiJS v8 WebGL

Move to PixiJS only after profiling proves:

- Canvas rendering exceeds budget
- thousands of independently transformed particles are required
- shader deformation is required
- bloom, displacement, or trails are central to the design

Do not start with WebGPU.

Do not use Three.js unless the project becomes genuinely 3D.

## DOM animation

Framer Motion or GSAP may control:

- opening and closing
- debug-panel transitions
- page-level opacity or layout transitions

Do not use them for every joint or dot.

## Physics

Use custom lightweight simulation.

Do not add a large rigid-body engine for simple constraints and steering.

## Pretext

Treat `@chenglou/pretext` as a text-layout system.

Use it only for optional experiments:

- line geometry as paths or rest surfaces
- exclusion-zone text
- text-to-dot conversion
- word-particle interactions

Inspect the installed API before use.

---

# TARGET DIRECTORY STRUCTURE

Adapt to project conventions while keeping these responsibilities separate:

```text
app/
  motion-lab/
    page.tsx

components/
  mascot/
    ProceduralMascotLoader.tsx
    ProceduralMascotCanvas.tsx
    MascotDebugPanel.tsx
    MascotAccessibilityControls.tsx
    Mascot.module.css

lib/
  mascot/
    MascotEngine.ts
    MascotConfig.ts
    MascotRuntime.ts
    types.ts

    core/
      FixedStepLoop.ts
      PerformanceGovernor.ts
      SeededRandom.ts
      NumericGuards.ts

    input/
      PointerInput.ts
      ScrollInput.ts
      VisibilityController.ts

    motion/
      SecondOrderDynamics.ts
      SpineSolver.ts
      AngleConstraint.ts
      VerletChain.ts
      FabrikSolver.ts
      PoseController.ts
      MotionRecipes.ts

    behavior/
      BehaviorMachine.ts
      TargetDirector.ts
      WanderPlanner.ts
      InterestDirector.ts

    character/
      CreatureRecipe.ts
      CreatureRig.ts
      BodyProfile.ts
      DotSkin.ts
      Expressions.ts

    interaction/
      DomObstacleRegistry.ts
      RectangleSteering.ts
      SpatialGrid.ts
      TextInteractionAdapter.ts

    rendering/
      CanvasMascotRenderer.ts
      CanvasDotRenderer.ts
      ParticlePool.ts
      RenderQuality.ts
      PixiMascotRenderer.ts
      shaders/

    debug/
      DebugSnapshot.ts
      DebugOverlay.ts
      ReplayRecorder.ts
      DeterministicScenarios.ts

docs/
  mascot/
    BASELINE_AUDIT.md
    ARCHITECTURE.md
    MOTION_RECIPES.md
    PERFORMANCE.md
    PLAYTEST.md
    IMPLEMENTATION_STATUS.md
    FINAL_REPORT.md

tests/
  mascot/
    SecondOrderDynamics.test.ts
    SpineSolver.test.ts
    VerletChain.test.ts
    FabrikSolver.test.ts
    BodyProfile.test.ts
    WanderPlanner.test.ts
    RectangleSteering.test.ts
    DomObstacleRegistry.test.ts
    MascotEngine.test.ts

  e2e/
    mascot-motion-lab.spec.ts
    mascot-portfolio.spec.ts
    mascot-mobile.spec.ts
    mascot-reduced-motion.spec.ts

scripts/
  mascot/
    verify.mjs
    perf-budget.mjs
    capture-scenarios.mjs

.claude/
  CLAUDE.md
  settings.json
  skills/
  agents/
  hooks/
```

Do not create unused placeholder files.

Do not keep the final engine in one monolithic React component.

---

# ENGINE CONTRACT

React must interact with a small imperative API:

```ts
export type MascotQuality = "reduced" | "low" | "medium" | "high";

export interface MascotEngineOptions {
  canvas: HTMLCanvasElement;
  seed: number;
  quality: MascotQuality;
  debug?: boolean;
  onStatus?: (status: MascotStatus) => void;
}

export interface MascotEngine {
  start(): void;
  pause(reason?: string): void;
  resume(): void;
  resize(width: number, height: number, dpr: number): void;
  setPointer(x: number, y: number, active: boolean): void;
  setScrollVelocity(value: number): void;
  setQuality(quality: MascotQuality): void;
  setEnabled(enabled: boolean): void;
  trigger(action: MascotAction): void;
  getDebugSnapshot(): MascotDebugSnapshot;
  destroy(): void;
}
```

The React component must not need internal joint or particle access.

Use mutable runtime structures and reusable buffers.

Avoid new object creation in hot loops.


---

# FIXED-STEP LOOP SPECIFICATION

Implement one `requestAnimationFrame` loop.

Pseudo-flow:

```ts
function frame(now: number) {
  if (!running) return;

  const rawFrameDt = (now - previousNow) / 1000;
  previousNow = now;

  const frameDt = clamp(rawFrameDt, 0, MAX_FRAME_DT);
  accumulator += frameDt;

  let steps = 0;

  while (accumulator >= FIXED_DT && steps < MAX_STEPS) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
    steps += 1;
  }

  if (steps === MAX_STEPS && accumulator >= FIXED_DT) {
    accumulator = 0;
    performance.recordDroppedSimulationTime();
  }

  render(accumulator / FIXED_DT);
  animationFrame = requestAnimationFrame(frame);
}
```

Requirements:

- cap frame delta
- cap catch-up steps
- never run an unbounded loop
- avoid giant jumps after tab suspension
- pause when hidden
- support deterministic fixed-step scenarios
- track average and worst frame time
- no React `setState` inside the loop

---

# SECOND-ORDER DYNAMICS SPECIFICATION

Use second-order dynamics for:

- root target following
- head orientation
- core or eye tracking
- body squash target
- glow response
- optional fin spread

Do not use the same parameters for every property.

The implementation must:

- reject invalid frequency
- guard zero or negative delta
- remain finite after timing gaps
- support reset
- support optional target velocity
- stabilize or substep when required
- expose current value and velocity for debugging

Required tests:

- converges to a fixed target
- stays finite with capped large delta
- higher damping reduces overshoot
- reset returns the exact supplied value
- deterministic input gives deterministic output
- no `NaN` or `Infinity`

Initial motion recipes:

```ts
export const MOTION_RECIPES = {
  dormant: {
    frequency: 0.35,
    damping: 1.0,
    response: 0,
  },
  follow: {
    frequency: 1.7,
    damping: 0.72,
    response: 0.08,
  },
  wander: {
    frequency: 1.05,
    damping: 0.62,
    response: -0.12,
  },
  inspect: {
    frequency: 1.3,
    damping: 0.86,
    response: 0,
  },
  sprint: {
    frequency: 2.4,
    damping: 0.52,
    response: 0.3,
  },
  avoid: {
    frequency: 2.6,
    damping: 0.78,
    response: 0.15,
  },
} as const;
```

These are starting values, not permanent magic constants.

Document final values and the visual reason for each.

---

# SPINE AND BODY SPECIFICATION

## Main spine

Initial recommendation:

```text
joint count: 24
segment length: 10 to 14 CSS pixels
solver iterations: 4 desktop, 3 medium, 2 low
```

Body regions:

```text
head: joints 0 to 3
shoulders: joints 4 to 7
torso: joints 8 to 13
tail base: joints 14 to 18
tail tip: joints 19 to 23
```

The head region should be relatively stiff.

The tail tip should be soft and delayed.

## Distance constraints

Maintain target segment length with bounded error correction.

## Angle constraints

Prevent:

- full folding
- sharp zigzags
- self-intersecting mechanical artifacts
- sudden normal flipping

Use softer angle limits toward the tail.

## Orientation

Derive tangents from neighbouring points.

Smooth tangents and normals to prevent rib jitter.

## Body-width profile

Do not use a fully symmetric sine curve as the final body shape.

Use a front-weighted profile:

```ts
export function bodyWidth(t: number): number {
  const normalized = clamp(t, 0, 1);
  const headGrowth = Math.sin(
    Math.min(1, normalized * 1.9) * Math.PI * 0.5,
  );
  const tailTaper = Math.pow(1 - normalized, 1.35);
  return headGrowth * tailTaper;
}
```

Make the profile configurable:

```ts
interface BodyProfileConfig {
  maxWidth: number;
  headScale: number;
  shoulderPosition: number;
  tailExponent: number;
  bellyBias: number;
}
```

Required tests:

- finite values
- no negative width
- tail approaches zero
- maximum occurs near the intended shoulder region
- no discontinuities

---

# SYMMETRIC RIB AND FIN GENERATION

For every sampled spine location:

1. calculate tangent
2. normalize tangent
3. rotate tangent to create normal
4. smooth normal with previous normal
5. multiply normal by body width
6. create left and right points

Formula:

```ts
const tangentX = next.x - previous.x;
const tangentY = next.y - previous.y;
const inverseLength =
  1 / Math.max(0.0001, Math.hypot(tangentX, tangentY));

const normalX = -tangentY * inverseLength;
const normalY = tangentX * inverseLength;
```

Left and right:

```ts
leftX = centerX + normalX * width;
leftY = centerY + normalY * width;

rightX = centerX - normalX * width;
rightY = centerY - normalY * width;
```

Controlled asymmetry may modify this after the symmetric base:

- turn expansion
- acceleration compression
- breathing
- inspect-state tilt
- impact wave
- scroll-current lean

Do not add unrelated random noise separately to each side.

---

# VERLET SECONDARY MOTION

Use Verlet chains for:

- tail extension
- antennae
- loose sensory fins
- optional dangling mechanical elements

Each node:

```ts
interface VerletNode {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  pinned: boolean;
}
```

Update concept:

```text
velocity = current - previous
previous = current
current += velocity * drag
current += acceleration * dt^2
```

Then solve constraints.

Requirements:

- root pin follows the rig
- no unbounded energy
- bounded solver count
- low quality uses fewer nodes
- reset after resize or teleport
- finite-value guards
- no allocation in update loop

---

# DOT SKIN SPECIFICATION

## Initial Canvas implementation

Generate samples only when the recipe or quality changes.

Each dot stores local body information:

```ts
interface SkinPoint {
  longitudinal: number;
  lateral: number;
  radius: number;
  opacity: number;
  boneA: number;
  boneB: number;
  weightB: number;
  noiseSeed: number;
  group: number;
}
```

For every rendered dot:

1. resolve nearby spine joints
2. interpolate center
3. interpolate and normalize local normal
4. calculate local body width
5. position by lateral coordinate
6. apply breathing
7. apply state deformation
8. apply impact ripple
9. apply bounded local noise
10. draw

Do not generate randomness every frame.

## Canvas batching

Do not call `fill()` for each dot.

Group by colour or visual layer.

For each group:

```text
beginPath
append all circles
fill once
```

Possible layers:

- structural white core dots
- cyan body dots
- magenta accent dots
- low-opacity trail dots

Avoid per-dot shadows and gradients.

## Quality presets

Initial values:

```ts
export const QUALITY_PRESETS = {
  reduced: {
    dotCount: 0,
    particles: 0,
    solverIterations: 1,
    dprCap: 1,
    targetFps: 15,
  },
  low: {
    dotCount: 700,
    particles: 120,
    solverIterations: 2,
    dprCap: 1.25,
    targetFps: 45,
  },
  medium: {
    dotCount: 1800,
    particles: 300,
    solverIterations: 3,
    dprCap: 1.5,
    targetFps: 60,
  },
  high: {
    dotCount: 3800,
    particles: 650,
    solverIterations: 5,
    dprCap: 2,
    targetFps: 60,
  },
} as const;
```

Tune these from actual profiling.

## GPU migration gate

Implement PixiJS only if:

- medium Canvas quality fails representative mobile targets
- required effects cannot fit the Canvas budget
- profiling identifies rendering as the bottleneck

The simulation API must remain renderer-independent.

---

# BEHAVIOR MACHINE

Use one behavior machine:

```ts
interface BehaviorDefinition {
  name: MascotBehavior;
  minimumDuration: number;
  maximumDuration?: number;
  motion: MotionRecipe;
  enter(runtime: MascotRuntime): void;
  update(runtime: MascotRuntime, dt: number): void;
  canExit(runtime: MascotRuntime): boolean;
  exit(runtime: MascotRuntime): void;
}
```

## Follow

- activate after recent pointer movement
- smooth tiny pointer noise
- use a visually useful pointer offset if required
- respect hard obstacles
- limit speed and acceleration
- transition smoothly from wander

## Wander

Do not use one permanent trigonometric loop.

Implement a seeded path planner.

Path families:

- wide loop
- figure eight
- lazy sweep
- card orbit
- edge cruise
- diagonal sprint
- curiosity circle
- rest curl

Each segment:

```ts
interface WanderSegment {
  kind: WanderPathKind;
  startTime: number;
  duration: number;
  controlPoints: readonly Point[];
  speedCurve: SpeedCurve;
  nextBehavior?: MascotBehavior;
}
```

Use cubic Bezier or Catmull-Rom interpolation.

Add low-amplitude local noise while preserving the main path.

## Wander transition

Blend over roughly 0.4 to 0.8 seconds:

```ts
effectiveTarget = lerp(pointerTarget, wanderTarget, wanderBlend);
```

Do not snap to a distant path when idle mode starts.

## Inspect

- select a visible interest element
- approach a safe point
- slow before arrival
- orient core toward the element
- orbit briefly or hold
- leave automatically
- use a cooldown

## Sprint

- short burst only
- compress before launch
- stretch during speed
- reduce body width
- increase tail lag
- use restrained particles
- avoid hard obstacles

## Rest

- choose a low-conflict region
- curl tail
- reduce work
- use slow breathing
- wake on pointer proximity

## Scatter and reform

Scatter:

- preserve the rig
- release dot targets outward
- use seeded radial directions
- cap particles
- keep the core recognisable

Reform:

- pull points back in controlled order
- optionally reform from tail to head
- finish with the core
- do not create new objects for every point

---

# DOM OBSTACLE REGISTRY

Use explicit attributes:

```tsx
<nav data-mascot-obstacle="hard" />
<button data-mascot-obstacle="hard" />
<article data-mascot-obstacle="soft" />
<a data-mascot-interest="project" />
```

Modes:

```ts
type ObstacleMode = "hard" | "soft" | "interest";
```

Cached data:

```ts
interface MascotObstacle {
  id: string;
  element: HTMLElement;
  mode: ObstacleMode;
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
  padding: number;
  influence: number;
  priority: number;
}
```

Refresh when:

- initial mount finishes
- window resizes
- an observed element resizes
- route content changes
- a throttled scroll refresh is due
- a section opens or closes
- layout-changing media or fonts settle

Never measure DOM rectangles inside update or render.

Use one documented coordinate system.

Add a spatial grid only when obstacle count justifies it.

---

# RECTANGLE-AWARE STEERING

For every relevant rectangle:

1. expand by padding
2. find closest point
3. detect inside or outside
4. calculate outward normal
5. calculate smooth falloff
6. derive two tangents
7. select tangent aligned with travel
8. blend normal and tangent steering
9. cap total force

Outside force:

```ts
const normalizedDistance = clamp(distance / influenceRadius, 0, 1);
const strength = Math.pow(1 - normalizedDistance, 2);
```

Tangent options:

```ts
const tangentA = { x: -normal.y, y: normal.x };
const tangentB = { x: normal.y, y: -normal.x };
```

Choose the tangent with the larger dot product against current travel direction.

Hard obstacles:

- core cannot remain inside
- include body-width padding
- may use a final projection safety correction

Soft obstacles:

- affect target and desired velocity
- allow limited decorative overlap
- never hide important text for long

Interest obstacles:

- provide approach and orbit points
- remain collision-safe

Required tests:

- left, right, top, bottom
- corners
- inside rectangle
- zero-distance
- tangent selection
- capped combined force

---

# SCROLL CURRENT

Track smoothed scroll velocity using a passive listener.

Map it to:

- subtle current
- body lean
- tail lag
- trail length
- a temporary state response

Do not directly set root position from scroll delta.

Clamp the input.

Disable or reduce for reduced motion.

---

# FABRIK LEGS - OPTIONAL GATED PHASE

Do not implement legs before the body motion is approved.

Possible use:

- four small geometric legs when resting near a card
- fins temporarily transform into legs during a crawl state
- feet plant only on designated decorative surfaces

Leg data:

```ts
interface LegState {
  side: "left" | "right";
  rootJoint: number;
  upperLength: number;
  lowerLength: number;
  root: Point;
  knee: Point;
  foot: Point;
  startFoot: Point;
  targetFoot: Point;
  planted: boolean;
  stepProgress: number;
  cooldown: number;
}
```

Start a step when:

- foot exceeds comfortable reach
- body direction changes enough
- a valid surface exists
- paired leg is not conflicting
- cooldown expired

Foot arc:

```ts
x = lerp(start.x, target.x, progress);
y = lerp(start.y, target.y, progress)
  - Math.sin(progress * Math.PI) * stepHeight;
```

FABRIK requirements:

- reachable and unreachable targets
- preserved segment lengths
- bounded iterations
- stable bend preference
- no knee flipping
- deterministic output
- finite degenerate handling

---

# PARTICLE SYSTEM

Use a fixed-capacity pool or typed arrays.

Particle categories:

- acceleration sparks
- click scatter
- reform trails
- impact ripple
- inspect glints
- sleep pulse
- optional text particles

Requirements:

- no unbounded arrays
- recycle oldest or low-priority particles
- strict low-quality cap
- deterministic seeds in replay mode
- batched rendering
- pause with engine
- no React state

---

# MOTION ART DIRECTION

Review animation as animation, not only as code.

## Acceleration

- head leads
- body stretches
- width compresses slightly
- tail remains behind
- particles appear behind travel direction

## Turn

- head turns first
- torso follows
- tail overshoots
- outside ribs widen
- inside ribs narrow
- core looks into the turn

## Stop

- root decelerates
- body slightly passes root
- tail curls and settles
- dot noise reduces
- glow falls after motion

## Inspect

- approach slows
- core points toward title
- body makes a small curiosity loop
- content remains readable

## Sprint

- anticipation compresses
- launch stretches
- tail snaps later
- glow settles over time

## Rest

- body curls
- tail wraps inward
- breathing slows
- dots compact
- core pulses

At milestones, render:

- white silhouette on black
- black silhouette on white
- 96-pixel preview
- final dot rendering

Every state must remain readable.

---

# MOTION LAB

Create:

```text
/motion-lab
```

Required controls:

- behavior
- frequency
- damping
- response
- maximum speed
- maximum acceleration
- spine joint count
- segment length
- angle limit
- solver iterations
- body width
- tail drag
- dot count
- particle count
- quality
- obstacle visualization
- normals visualization
- spine visualization
- bounding boxes
- FPS
- average frame time
- worst frame time
- dropped simulation time
- pause
- slow motion
- deterministic replay
- reset
- screenshot mode

Do not add a large control dependency unless it already exists.

Deterministic scenarios:

```ts
type ScenarioName =
  | "follow-horizontal"
  | "follow-circle"
  | "hard-turn"
  | "sprint-stop"
  | "wander-loop"
  | "rectangle-corner"
  | "inspect-card"
  | "scatter-reform"
  | "resize"
  | "reduced-motion";
```

Expose in development and tests:

```ts
window.__MASCOT_DEBUG__ = {
  playScenario,
  pause,
  resume,
  snapshot,
  setQuality,
  reset,
};
```

Do not expose in production.

---

# NEXT.JS INTEGRATION

Use a small Client Component loader:

```tsx
"use client";

import dynamic from "next/dynamic";

const ProceduralMascotCanvas = dynamic(
  () => import("./ProceduralMascotCanvas"),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function ProceduralMascotLoader() {
  return <ProceduralMascotCanvas />;
}
```

The `ssr: false` dynamic import must be declared inside a Client Component.

The loader may delay mounting until:

- first user interaction
- browser idle time
- hero visibility
- feature setting enabled

Choose the least intrusive strategy supported by the current design.

Verify:

- mascot engine in separate client chunk
- optional Pixi not loaded unless selected
- debug controls excluded from production
- motion-lab code not bundled into normal route

Use explicit CSS layers.

Do not add a background to the Canvas unless required.

---

# REDUCED MOTION AND ACCESSIBILITY

Detect reduced motion through CSS and `matchMedia`.

Reduced mode must:

- disable chase
- disable sprints
- disable scatter
- strongly reduce or stop wander
- show static constellation or slow breathing
- have near-zero impact on content interaction

Provide an enable or disable control if the site already has settings.

Persist only simple user preference when useful.

Use accessible labels.

The decorative Canvas should normally use `aria-hidden="true"`.

Do not announce continuous motion to screen readers.

---

# PERFORMANCE GOVERNOR

Track:

```ts
interface PerformanceState {
  averageFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  slowFrames: number;
  droppedSimulationTime: number;
  quality: MascotQuality;
  lastQualityChange: number;
}
```

Example downgrade policy:

```text
average over 20 ms:
  reduce particles

average over 23 ms:
  reduce dots

average over 26 ms:
  reduce solver iterations and DPR

average over 30 ms:
  switch to low or reduced mode
```

Rules:

- do not change quality during sprint or scatter
- use cooldown
- downgrade more readily than upgrade
- upgrade at most once per session
- log changes in debug mode
- do not trust device heuristics alone

Targets:

Desktop:

```text
simulation average under 2 ms
render average under 4 ms
normal mascot total under 7 ms
target 60 FPS
```

Mobile:

```text
simulation average under 4 ms
render average under 7 ms
normal mascot total under 12 ms
target 45 to 60 FPS
```

Other targets:

- zero normal-frame DOM reads
- zero per-frame React render
- bounded memory
- no loop after unmount
- no layout shift
- site interactive before mascot loads

---

# WORKER AND OFFSCREEN CANVAS GATE

Do not start with a Worker.

Progression:

```text
main-thread Canvas
-> optimize allocations and batching
-> lower quality intelligently
-> move pure simulation to Worker if evidence requires it
-> consider OffscreenCanvas only after that
```

DOM measurement stays on the main thread.

Do not add complexity without recorded profiler evidence.

---

# PRETEXT EXPERIMENTS

Pretext work is optional and must not block the core mascot.

## Text lines as surfaces

- prepare text once
- calculate line layout
- convert selected line rectangles into soft paths
- preserve normal semantics

## Exclusion zone

- calculate variable line widths around a mascot region
- use in a dedicated experiment
- update at limited frequency
- never reflow ordinary portfolio text every frame

## Text to dots

- draw selected text to offscreen Canvas
- sample opaque pixels
- cap samples
- animate points toward mascot
- merge temporarily
- reconstruct text reliably

## Word feeding

- explicit click only
- preserve accessible original text
- animate a visual copy
- restore after effect
- cap particles

---

# IMPLEMENTATION PHASES

## PHASE 0 - Audit and safety

Deliverables:

- baseline audit
- repository map
- package manager
- dependency map
- current animation systems
- current tests
- git safety status
- implementation status

Acceptance:

- no code modified before audit
- unrelated changes identified
- active branch verified
- current build status documented

## PHASE 1 - Core math

Implement:

- numeric helpers
- fixed-step loop
- stable second-order dynamics
- seeded random
- unit tests

Acceptance:

- math tests pass
- deterministic output
- no non-finite values

## PHASE 2 - Motion lab skeleton

Implement:

- `/motion-lab`
- Canvas lifecycle
- pointer events
- DPR handling
- visibility pause
- resize observer
- debug overlay
- line-and-circle rig

Acceptance:

- pointer and touch work
- resize works
- no console error
- no React update per frame
- unmount stops all work

## PHASE 3 - Spine and secondary motion

Implement:

- spine joints
- distance constraints
- angle constraints
- tail Verlet
- normals visualization
- motion recipes

Acceptance:

- readable turns
- stable tail
- no folding
- consistent at variable frame rates

## PHASE 4 - Original silhouette

Implement:

- body profile
- symmetric ribs
- head and core design
- optional antennae
- solid silhouette
- controlled asymmetry

Acceptance:

- original
- recognisable at small size
- state poses readable

## PHASE 5 - Behavior and wander

Implement:

- behavior machine
- idle detection
- target director
- seeded path planner
- target blending
- inspect and rest

Acceptance:

- no target snapping
- no obvious immediate repetition
- paths stay in safe bounds
- pointer regains control smoothly

## PHASE 6 - Dot skin

Implement:

- seeded sampling
- batched drawing
- quality tiers
- breathing
- turn deformation
- impact ripple

Acceptance:

- medium quality meets budget
- no per-frame random generation
- no per-dot fill call

## PHASE 7 - DOM obstacles

Implement:

- data-attribute registry
- cached rectangles
- observers
- throttled invalidation
- rectangle steering
- hard, soft, interest modes
- debug geometry

Acceptance:

- no layout reads in RAF
- hard controls usable
- stable corner gliding
- no listener leaks

## PHASE 8 - Project interest

Implement:

- project-card targets
- safe approach points
- inspection orientation
- brief orbit
- cooldown
- safe exit

Acceptance:

- same card not repeatedly selected
- title not hidden for long
- card remains clickable

## PHASE 9 - Interaction polish

Implement within budget:

- scroll current
- click scatter
- reform
- sprint anticipation
- rest curl
- restrained particles

Acceptance:

- bounded effects
- reduced motion disables them
- no input interception
- no serious frame regression

## PHASE 10 - Production integration

Implement:

- dynamic loader
- production layer CSS
- activation strategy
- optional preference
- debug exclusion
- obstacle markup

Acceptance:

- no hydration error
- no layout shift
- site works before mascot
- navigation and forms work
- separate chunk verified

## PHASE 11 - Performance pass

Perform:

- allocation audit
- Canvas batching audit
- RAF lifecycle audit
- DOM measurement audit
- downgrade test
- mobile profiling
- bundle check

Acceptance:

- targets met or deviations documented
- no unbounded arrays
- no repeated layout measurement
- no optional heavy library in initial bundle

## PHASE 12 - Optional FABRIK legs

Only implement after motion approval.

Acceptance:

- no knee flipping
- stable stepping
- appropriate state only
- acceptable performance

## PHASE 13 - Optional Pretext experiment

Only after core completion.

Acceptance:

- accessible text preserved
- no high-frequency layout
- failure restores original state
- effect is useful and original

## PHASE 14 - Complete validation

Run:

- format
- lint
- typecheck
- unit tests
- E2E
- build
- performance
- manual matrix

Fix introduced failures.

Document unrelated existing failures.

## PHASE 15 - Final report

Create:

```text
docs/mascot/FINAL_REPORT.md
```

Include:

1. summary
2. architecture
3. files added
4. files modified
5. behavior states
6. motion systems
7. DOM interaction
8. quality tiers
9. accessibility
10. test results
11. performance results
12. build result
13. limitations
14. future work
15. how to use motion lab
16. how to disable mascot
17. how to tune recipes


---

# CLAUDE CODE PROJECT MEMORY

Create or update:

```text
.claude/CLAUDE.md
```

Keep it concise. Merge with existing instructions rather than overwriting them.

Recommended content:

```markdown
# Procedural Mascot Project Rules

## Intent

Build and maintain an original procedural portfolio mascot without harming portfolio usability, accessibility, or initial-load performance.

## Architecture

- React owns lifecycle and low-frequency UI only.
- `lib/mascot` owns simulation and rendering.
- Never store per-frame simulation state in React state.
- Keep renderers separate from simulation.
- Build and tune features in `/motion-lab` before production integration.

## Performance

- Never call `getBoundingClientRect()` in RAF.
- Never allocate unbounded arrays in update or render loops.
- Use a fixed simulation timestep and bounded catch-up steps.
- Cap DPR by quality tier.
- Pause on hidden document and after engine destruction.
- Lazy-load browser-only mascot code.
- Profile before adding PixiJS, Workers, or OffscreenCanvas.

## Motion

- Preserve an original silhouette.
- Use symmetry for construction and controlled asymmetry for motion.
- Head leads, torso follows, tail settles last.
- Every state remains readable as a simple silhouette.
- Use deterministic seeds for repeatable tests.

## Safety

- Do not reset or overwrite unrelated changes.
- Do not commit or push unless asked.
- Preserve existing routes and interactions.
- Mark navigation, forms, and CTAs as hard obstacles.

## Validation

After mascot changes, run the available equivalents of:

- format check
- lint
- TypeScript check
- mascot unit tests
- mascot E2E tests
- production build
- performance verification

Update `docs/mascot/IMPLEMENTATION_STATUS.md` after each major phase.
```

---

# CLAUDE CODE SKILL STRUCTURE

Create project skills under:

```text
.claude/skills/<skill-name>/SKILL.md
```

Each skill must have a concise `SKILL.md` and one-level references.

Do not copy the whole master specification into every skill.

---

# SKILL 1 - BUILDING PROCEDURAL MOTION

Create:

```text
.claude/skills/building-procedural-motion/
  SKILL.md
  references/
    numeric-stability.md
    motion-review.md
```

## `SKILL.md`

```markdown
---
name: building-procedural-motion
description: Builds and reviews deterministic procedural character motion using fixed-step simulation, second-order dynamics, distance and angle constraints, Verlet chains, FABRIK, and pose state machines. Use when changing mascot motion math, rig behavior, joints, secondary motion, state transitions, or simulation stability.
---

# Procedural motion workflow

1. Inspect the affected runtime and tests.
2. Reproduce behavior through a deterministic motion-lab scenario.
3. Change one motion system or recipe at a time.
4. Keep simulation independent from React and rendering.
5. Use fixed-step updates and bounded solver iterations.
6. Guard every normalization and division.
7. Avoid allocations inside hot loops.
8. Add or update unit tests for numeric stability.
9. Run the relevant deterministic scenario.
10. Update `docs/mascot/IMPLEMENTATION_STATUS.md`.

## Invariants

- All values remain finite.
- Segment-length error stays within documented tolerance.
- Root pins remain exact.
- State transitions do not teleport targets.
- Solver loops are bounded.
- Equal seed and input produce equal output.
- Motion remains readable as a silhouette.

Read `references/numeric-stability.md` when changing equations.
Read `references/motion-review.md` when tuning personality.
```

## `references/numeric-stability.md`

```markdown
# Numeric stability

- Clamp frame delta and use a fixed timestep.
- Guard vector lengths with epsilon before normalization.
- Reject non-positive frequency and invalid configuration.
- Reset previous positions after teleport, resize, or suspension.
- Cap acceleration, velocity, and correction distance.
- Prefer bounded repeated constraint passes over one extreme correction.
- Test coincident points, zero velocity, large timing gaps, and unreachable IK.
- Fail loudly in development when a value becomes non-finite.
- Avoid frame-rate-dependent damping constants.
- Keep deterministic random generation outside global `Math.random`.
```

## `references/motion-review.md`

```markdown
# Motion review

Review in this order:

1. Silhouette clarity
2. Anticipation
3. Root responsiveness
4. Torso follow-through
5. Tail settling
6. Turn readability
7. State transition continuity
8. Small-size readability
9. Repetition
10. Frame stability

Change recipe parameters before rewriting a correct solver.

Use fixed deterministic scenarios when comparing versions.
```

---

# SKILL 2 - RENDERING DOT CREATURES

Create:

```text
.claude/skills/rendering-dot-creatures/
  SKILL.md
  references/
    canvas-batching.md
    quality-tiers.md
```

## `SKILL.md`

```markdown
---
name: rendering-dot-creatures
description: Implements and optimizes symmetric dot-based character rendering for Canvas 2D or a profiled WebGL fallback. Use when changing dot sampling, body skinning, Canvas batching, particles, quality tiers, visual effects, or renderer performance.
---

# Dot rendering workflow

1. Preserve the simulation-to-renderer boundary.
2. Generate seeded skin points only when recipe or quality changes.
3. Store local longitudinal and lateral coordinates.
4. Resolve world positions from the spine and smoothed normals.
5. Group dots by visual layer and fill each group in one batch.
6. Reuse arrays and paths where practical.
7. Keep a solid-silhouette debug renderer.
8. Profile medium and low quality before adding a GPU renderer.
9. Record dot count, draw time, and particle count.
10. Update performance documentation.

## Renderer gates

Use Canvas 2D by default.

Create or activate PixiJS only when profiler evidence shows Canvas rendering exceeds the agreed budget or required effects need shader deformation.

Do not use WebGPU as the first production backend.

Read `references/canvas-batching.md` for hot-loop rules.
Read `references/quality-tiers.md` for degradation rules.
```

## `references/canvas-batching.md`

```markdown
# Canvas batching

- Use CSS-pixel simulation coordinates.
- Reset transform after resize.
- Cap DPR.
- Call `beginPath` once per visual layer.
- Append all circles, then call `fill` once.
- Avoid per-dot gradients, shadows, `save`, `restore`, and random generation.
- Pool particles.
- Measure render time before and after every visual feature.
- Group dots by opacity or colour only when the group count remains small.
- Avoid rebuilding immutable sample data every frame.
```

## `references/quality-tiers.md`

```markdown
# Quality tiers

Reduced:
- static or slow silhouette
- no particles
- minimum solver work

Low:
- roughly one thousand dots or fewer
- strict DPR and particle caps
- fewer solver passes

Medium:
- default production tier
- moderate dots and particles
- complete core behavior

High:
- enabled only when sustained frame data supports it
- higher density
- restrained additional effects

Downgrade after sustained slow frames.
Avoid rapid quality oscillation.
Do not upgrade during an important interaction.
```

---

# SKILL 3 - INTEGRATING NEXT CANVAS

Create:

```text
.claude/skills/integrating-next-canvas/
  SKILL.md
  references/
    lifecycle-checklist.md
```

## `SKILL.md`

```markdown
---
name: integrating-next-canvas
description: Integrates browser-only Canvas animation engines into Next.js while preserving server rendering, lazy loading, lifecycle cleanup, responsive sizing, accessibility, and portfolio interactivity. Use when editing mascot React components, loaders, route integration, Canvas sizing, observers, or client boundaries.
---

# Next.js Canvas workflow

1. Keep browser APIs behind a Client Component boundary.
2. Use a client-side dynamic import for browser-only mascot code.
3. Mount one imperative engine instance through a ref.
4. Pass Canvas and configuration to the engine.
5. Never update React state per frame.
6. Resize using CSS dimensions plus capped DPR.
7. Use Pointer Events.
8. Pause for hidden documents and disabled state.
9. Destroy engine, observers, frames, timers, and listeners on unmount.
10. Verify no hydration errors or layout shifts.
11. Verify the mascot is in a separate client chunk.
12. Run production build and route smoke tests.

Read `references/lifecycle-checklist.md` before declaring integration complete.
```

## `references/lifecycle-checklist.md`

```markdown
# Lifecycle checklist

- Canvas context created after mount
- no render-time `window` or `document`
- dynamic import declared in a Client Component
- ResizeObserver disconnected
- IntersectionObserver disconnected
- MutationObserver disconnected when used
- pointer listeners removed
- scroll listener removed
- media-query listener removed
- RAF cancelled
- worker terminated when used
- engine destroy is idempotent
- route navigation produces no duplicate loop
- visibility resume resets frame timing
- Canvas backing size follows quality DPR cap
```

---

# SKILL 4 - MAPPING DOM OBSTACLES

Create:

```text
.claude/skills/mapping-dom-obstacles/
  SKILL.md
  references/
    rectangle-steering.md
```

## `SKILL.md`

```markdown
---
name: mapping-dom-obstacles
description: Builds cached DOM obstacle and interest maps for procedural Canvas characters without layout thrashing. Use when adding obstacle data attributes, rectangle measurement, spatial indexing, repulsion, tangential steering, project-card inspection, or scroll-aware environment interaction.
---

# DOM interaction workflow

1. Register only explicitly marked elements.
2. Measure rectangles outside the animation loop.
3. Refresh on controlled layout invalidation.
4. Keep one documented coordinate system.
5. Expand rectangles by mode-specific padding.
6. Calculate closest-point rectangle distance.
7. Handle inside-rectangle cases explicitly.
8. Add tangential steering to glide around edges.
9. Cap combined steering force.
10. Protect navigation, forms, and CTAs as hard obstacles.
11. Add geometric unit tests.
12. Use debug overlays to verify cached rectangles.

Never call `getBoundingClientRect()` from update or render.

Read `references/rectangle-steering.md` when changing collision or repulsion math.
```

## `references/rectangle-steering.md`

```markdown
# Rectangle steering

For an external point:

- clamp point to rectangle to find the closest point
- subtract closest point from point
- normalize with epsilon
- use squared falloff inside influence radius

For an internal point:

- calculate distance to each expanded side
- select nearest exit side
- return its outward normal

For gliding:

- derive two tangents from the normal
- select the tangent aligned with current velocity
- blend normal force and tangent force
- cap final steering
- add small hysteresis to avoid boundary jitter

Test sides, corners, internal points, zero distance, and combined obstacles.
```

---

# SKILL 5 - DIRECTING CHARACTER MOTION

Create:

```text
.claude/skills/directing-character-motion/
  SKILL.md
  references/
    review-rubric.md
```

## `SKILL.md`

```markdown
---
name: directing-character-motion
description: Reviews procedural mascot animation for silhouette clarity, anticipation, follow-through, personality, repetition, and interaction readability. Use after motion changes, when comparing deterministic recordings, or when deciding whether parameter tuning is better than solver rewrites.
---

# Motion direction review

Review deterministic recordings before implementation details.

Score:

- silhouette clarity
- anticipation
- acceleration
- hard-turn response
- stopping and settling
- tail follow-through
- state transition continuity
- interaction readability
- originality
- reduced-motion behavior
- frame stability

Return:

1. strongest quality
2. highest-impact weakness
3. exact scenario and time
4. likely parameter or system responsible
5. smallest recommended change
6. regression risk

Do not edit code unless explicitly delegated.

Read `references/review-rubric.md` for scoring anchors.
```

## `references/review-rubric.md`

```markdown
# Review rubric

Use scores from 1 to 10.

1 to 3:
- unclear pose
- unstable motion
- robotic or noisy
- interaction hides content

4 to 6:
- functional
- readable at normal size
- weak anticipation or settling
- some repetition

7 to 8:
- strong personality
- clear state changes
- stable and responsive
- minor polish gaps

9 to 10:
- distinctive silhouette
- expressive motion
- seamless transitions
- excellent small-size readability
- no visible performance compromise
```

---

# SKILL 6 - TESTING MASCOT PERFORMANCE

Create:

```text
.claude/skills/testing-mascot-performance/
  SKILL.md
  references/
    browser-matrix.md
```

## `SKILL.md`

```markdown
---
name: testing-mascot-performance
description: Validates procedural mascot correctness, lifecycle safety, browser behavior, responsive layouts, accessibility, and frame budgets. Use when adding tests, profiling, running browser scenarios, checking leaks, validating quality tiers, or preparing completion reports.
---

# Validation workflow

1. Read implementation status and changed files.
2. Run unit tests for changed math.
3. Run deterministic motion-lab scenarios.
4. Test desktop, tablet, and mobile viewports.
5. Capture console errors and warnings.
6. Verify route navigation and unmount cleanup.
7. Test hidden-tab and reduced-motion behavior.
8. Record average, p95, and worst frame time.
9. Verify no layout reads occur in normal animation frames.
10. Run production build.
11. Write results to `docs/mascot/PLAYTEST.md`.
12. Block completion when introduced failures remain.

Read `references/browser-matrix.md` for required scenarios.
```

## `references/browser-matrix.md`

```markdown
# Browser and viewport matrix

At minimum:

- desktop Chromium
- mobile Chromium emulation
- one WebKit run when project tooling supports it

Viewports:

- 1440x900
- 1024x768
- 768x1024
- 430x932
- 932x430
- 360x800

Scenarios:

- follow
- idle wander
- hard turn
- obstacle corner
- inspect card
- resize
- scroll
- hidden tab
- unmount and remount
- reduced motion
```

---

# SKILL 7 - BUILDING PRETEXT INTERACTIONS

Create:

```text
.claude/skills/building-pretext-interactions/
  SKILL.md
  references/
    experiments.md
```

## `SKILL.md`

```markdown
---
name: building-pretext-interactions
description: Prototypes text-layout interactions between Pretext-generated geometry and the procedural mascot. Use when creating text paths, line surfaces, exclusion zones, text-to-dot transitions, or word-feeding experiments after the core mascot is stable.
---

# Pretext interaction workflow

1. Inspect the installed Pretext API and current project usage.
2. Keep the experiment isolated from normal semantic text.
3. Prepare unchanged text and font data once.
4. Recalculate layout only when width or exclusion geometry changes.
5. Limit update frequency.
6. Keep original accessible text present.
7. Cap sampled text particles.
8. Provide a failure-safe restoration path.
9. Test resize and font loading.
10. Keep the feature behind a flag until approved.

Read `references/experiments.md` before selecting an interaction.
```

## `references/experiments.md`

```markdown
# Pretext experiments

Preferred order:

1. Render selected text inside the motion lab.
2. Convert line rectangles into soft mascot surfaces.
3. Create a limited exclusion-zone experiment.
4. Sample one word into dots.
5. Animate dots to and from the mascot.
6. Evaluate performance and readability before portfolio use.

Never reflow the entire portfolio at animation-frame frequency.
```

---

# SKILL CREATION QUALITY RULES

For every created skill:

- keep `SKILL.md` focused
- include what the skill does and when to use it in the description
- avoid generic names
- keep references one level deep
- use forward slashes in paths
- avoid unnecessary theory
- include only project-specific non-obvious rules
- remove empty example files
- test the skill on a real task
- revise based on actual agent behaviour


---

# CLAUDE CODE SUBAGENTS

Create project subagents as Markdown files in:

```text
.claude/agents/
```

Names must be unique.

The main Claude session remains responsible for integration and final verification.

---

# AGENT 1 - MASCOT COORDINATOR

Create:

```text
.claude/agents/mascot-coordinator.md
```

```markdown
---
name: mascot-coordinator
description: Coordinates implementation of the procedural mascot across motion, rendering, DOM interaction, testing, and performance. Use as the main agent for the complete mascot specification.
tools: Agent, Read, Grep, Glob, Bash, Edit, Write
---

You are responsible for completing the procedural mascot specification.

Begin by reading:

- `PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md`
- `.claude/CLAUDE.md`
- `docs/mascot/IMPLEMENTATION_STATUS.md` when present

Responsibilities:

1. Inspect repository state and protect unrelated changes.
2. Break work into the phases in the master specification.
3. Delegate focused work to the rig, render, interaction, motion-direction, performance, and playtest agents.
4. Keep shared engine interfaces coherent.
5. Prevent multiple agents from rewriting the same subsystem concurrently.
6. Integrate and validate delegated changes.
7. Update implementation status after every phase.
8. Continue beyond planning until completion gates pass.
9. Run final verification.
10. Write the final report.

Do not claim completion from subagent summaries alone.

Inspect changes, tests, browser results, and final build yourself.

When a later optional feature threatens stability, defer it clearly and complete the stable core.
```

---

# AGENT 2 - RIG ENGINEER

Create:

```text
.claude/agents/rig-engineer.md
```

```markdown
---
name: rig-engineer
description: Implements deterministic procedural motion math, including fixed-step simulation, second-order dynamics, spine constraints, Verlet chains, body profiles, pose control, and FABRIK.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own:

- `lib/mascot/core`
- `lib/mascot/motion`
- related unit tests
- deterministic scenarios tied to motion math

Before editing:

1. read the master specification
2. inspect current math and tests
3. identify the deterministic scenario reproducing the issue
4. document the intended invariant

Requirements:

- no React dependencies in simulation
- no non-finite values
- no unbounded loops
- bounded solver iterations
- no avoidable allocation in hot loops
- deterministic seeded behavior
- unit tests for changed equations
- meaningful constants documented
- reset support after resize, teleport, and suspension

Prefer recipe tuning over solver rewrites when the solver is correct.

Do not edit production page styling.

Coordinate interface changes with the coordinator and renderer.
```

---

# AGENT 3 - RENDER ENGINEER

Create:

```text
.claude/agents/render-engineer.md
```

```markdown
---
name: render-engineer
description: Implements Canvas dot rendering, silhouettes, particles, quality tiers, responsive DPR handling, and an optional profiled WebGL migration.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own:

- mascot rendering modules
- visual quality presets
- particle pool
- Canvas batching
- render performance tests
- optional Pixi renderer after approval

Requirements:

- keep simulation independent from renderer
- batch Canvas work by layer
- generate seeded skin points outside the frame loop
- cap DPR and particle counts
- preserve solid-silhouette debug mode
- measure before and after visual changes
- exclude debug code from production
- do not introduce PixiJS before the profiling gate
- avoid per-dot state save, shadow, and gradient work
- keep a low-quality fallback

Coordinate renderer interface changes with the coordinator and rig engineer.
```

---

# AGENT 4 - INTERACTION ENGINEER

Create:

```text
.claude/agents/interaction-engineer.md
```

```markdown
---
name: interaction-engineer
description: Implements cached DOM obstacle mapping, rectangle-aware steering, project-card interest behavior, scroll current, and optional Pretext interactions.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own:

- `lib/mascot/interaction`
- obstacle markup integration
- geometric steering tests
- interest targeting
- optional Pretext adapter

Requirements:

- no layout reads inside RAF
- named and removable listeners
- observers cleaned up
- hard controls remain usable
- closest-point rectangle geometry
- explicit inside-rectangle handling
- capped force
- stable corner behavior
- debug overlays for cached geometry
- Pretext work remains optional and isolated

Do not change the core rig without coordination.

When a DOM interaction causes content usability problems, protect content before preserving the visual effect.
```

---

# AGENT 5 - MOTION DIRECTOR

Create:

```text
.claude/agents/motion-director.md
```

```markdown
---
name: motion-director
description: Performs read-only visual and animation-quality review of deterministic mascot scenarios, focusing on silhouette, anticipation, follow-through, personality, repetition, and interaction readability.
tools: Read, Grep, Glob
---

Review:

- deterministic recordings
- screenshots
- debug snapshots
- documented motion parameters
- silhouette renders

Do not edit files.

Return:

1. strongest quality
2. highest-impact weakness
3. exact scenario and time
4. likely cause
5. smallest recommended parameter or system change
6. regression risk
7. rubric scores

Evaluate the motion, not the elegance of source code.

Reject a visually noisy result even when the equations are sophisticated.
```

---

# AGENT 6 - PERFORMANCE VERIFIER

Create:

```text
.claude/agents/performance-verifier.md
```

```markdown
---
name: performance-verifier
description: Profiles mascot simulation, rendering, allocation, lifecycle cleanup, bundle behaviour, and quality-tier adaptation.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Inspect changed mascot paths and current profiling tools.

Measure:

- average frame time
- p95 frame time
- worst frame time
- simulation time
- render time
- active object counts
- particle counts
- listener cleanup
- RAF cleanup
- Canvas dimensions
- bundle inclusion
- layout reads
- quality changes

Write evidence to:

- `docs/mascot/PERFORMANCE.md`

Do not recommend Workers, OffscreenCanvas, PixiJS, or WebGL without profiler evidence.

Fix profiling scripts when needed.

Coordinate production changes through the coordinator.
```

---

# AGENT 7 - PLAYTEST AGENT

Create:

```text
.claude/agents/playtest-agent.md
```

```markdown
---
name: playtest-agent
description: Runs deterministic browser playtests for the mascot across desktop, mobile, touch, resize, obstacles, route navigation, hidden-tab behaviour, and reduced motion.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Use the existing browser-test framework.

Add focused tests when missing.

Capture:

- console errors
- screenshots
- deterministic scenario outcomes
- viewport behaviour
- lifecycle leaks
- accessibility behaviour
- obstacle interaction
- pointer and touch response

Test the required matrix from the master specification.

Write results to:

- `docs/mascot/PLAYTEST.md`

Do not modify core motion merely to silence a brittle test.

Report the root cause first.
```

---

# SUBAGENT COORDINATION RULES

1. The coordinator owns shared interfaces.
2. The rig engineer and render engineer must not edit the same file concurrently.
3. The interaction engineer may consume rig state but should not change equations without coordination.
4. The motion director remains read-only.
5. Performance and playtest agents may add test utilities but must report production recommendations to the coordinator.
6. Subagent output is evidence, not automatic completion.
7. The coordinator reviews every delegated diff.
8. Background parallelism is allowed only for independent reads, tests, or documentation.
9. Do not run two write agents against the same directory simultaneously.
10. Every agent must update or provide information for implementation status.

---

# CLAUDE CODE HOOKS

Inspect existing project settings before writing.

Merge hooks rather than replacing the existing JSON.

Project settings location:

```text
.claude/settings.json
```

Recommended configuration:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/after-edit.sh",
            "timeout": 60
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Inspect the current git diff. If mascot-related files changed, verify that relevant tests, TypeScript checks, lifecycle checks, and the production build have been run successfully. If important validation is missing or failing, return ok false with a precise reason and next action. Avoid repeating checks that already passed in this session. $ARGUMENTS",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

If the installed Claude Code version does not support the selected agent hook, use the command-hook fallback below.

---

# POST-EDIT HOOK

Create:

```text
.claude/hooks/after-edit.sh
```

```bash
#!/usr/bin/env bash
set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

INPUT="$(cat || true)"
FILE_PATH=""

if command -v jq >/dev/null 2>&1; then
  FILE_PATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
fi

case "$FILE_PATH" in
  *lib/mascot/*.ts|*lib/mascot/*.tsx|*components/mascot/*.ts|*components/mascot/*.tsx|*app/motion-lab/*.ts|*app/motion-lab/*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

if [ -f pnpm-lock.yaml ]; then
  RUNNER="pnpm exec"
elif [ -f yarn.lock ]; then
  RUNNER="yarn"
else
  RUNNER="npx"
fi

if [ -x node_modules/.bin/prettier ]; then
  $RUNNER prettier --check "$FILE_PATH" >/tmp/mascot-prettier.log 2>&1 || {
    cat /tmp/mascot-prettier.log >&2
    exit 2
  }
fi

exit 0
```

This performs only a quick file-level check.

Do not run the complete production build after every edit.

---

# STOP HOOK FALLBACK

Create:

```text
.claude/hooks/verify-stop.sh
```

```bash
#!/usr/bin/env bash
set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

INPUT="$(cat || true)"

if command -v jq >/dev/null 2>&1; then
  ACTIVE="$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null || printf false)"
  if [ "$ACTIVE" = "true" ]; then
    exit 0
  fi
fi

if git diff --quiet -- \
  'lib/mascot' \
  'components/mascot' \
  'app/motion-lab' \
  'tests/mascot' \
  'tests/e2e/mascot-*' \
  'docs/mascot'; then
  exit 0
fi

if node scripts/mascot/verify.mjs --fast; then
  exit 0
fi

echo "Mascot verification failed. Fix the reported checks before stopping." >&2
exit 2
```

Fallback Stop hook configuration:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/verify-stop.sh",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

Make scripts executable:

```bash
chmod +x .claude/hooks/after-edit.sh
chmod +x .claude/hooks/verify-stop.sh
```

The Stop hook must inspect `stop_hook_active` to avoid an endless loop.

Do not enable both the agent Stop hook and command Stop hook at the same time.

---

# OPTIONAL COMMAND SAFETY HOOK

Do not add this if the repository already has command policies.

A project may optionally use a `PreToolUse` Bash hook to reject commands that would erase unrelated work.

Potential forbidden command patterns:

```text
git reset --hard
git clean -fd
git checkout -- .
git restore .
rm -rf on repository root
```

Prefer permission settings and human review over an unreliable string matcher.

Do not block ordinary safe commands.

---

# PACKAGE SCRIPT PLAN

Inspect the current test framework first.

Do not install duplicate frameworks.

Suggested script names:

```json
{
  "scripts": {
    "test:mascot": "vitest run tests/mascot",
    "test:mascot:watch": "vitest tests/mascot",
    "test:mascot:e2e": "playwright test tests/e2e/mascot-*.spec.ts",
    "perf:mascot": "node scripts/mascot/perf-budget.mjs",
    "verify:mascot": "node scripts/mascot/verify.mjs"
  }
}
```

Adapt commands to:

- npm
- pnpm
- yarn
- existing Jest
- existing Vitest
- existing Playwright
- another established project framework

Do not add a package solely because its name appears above.

---

# VERIFY SCRIPT REQUIREMENTS

Create:

```text
scripts/mascot/verify.mjs
```

It must:

1. identify the package manager
2. inspect `package.json` scripts
3. run only relevant commands that exist
4. run mascot unit tests
5. run TypeScript checks
6. run lint
7. run the production build in full mode
8. run focused browser tests when configured
9. print clear failures
10. exit non-zero on failure
11. support `--fast` to skip the full production build when used by a frequent hook
12. avoid modifying source files

Pseudo-logic:

```text
parse arguments
load package.json
detect runner
build command list
run sequentially
stream output
collect failures
print summary
exit 1 if any failed
```

Do not hide failing command output.

---

# PERFORMANCE SCRIPT REQUIREMENTS

Create:

```text
scripts/mascot/perf-budget.mjs
```

Use the available browser-test tooling.

It should:

- launch motion lab
- select deterministic scenarios
- collect debug performance snapshots
- run medium and low quality
- assert configurable budgets
- emit a JSON or Markdown summary
- fail when severe regression exceeds threshold
- avoid pretending local emulation equals real hardware

Save latest report to:

```text
docs/mascot/PERFORMANCE.md
```

Include environment information.

---

# CHANGE MANAGEMENT

Before every phase:

1. inspect current diff
2. identify files owned by the phase
3. avoid concurrent shared-file edits
4. update status

After every phase:

1. run focused tests
2. inspect diff
3. run the relevant browser scenario
4. record performance where relevant
5. update status
6. continue

Do not use `git add -A`.

Do not stage, commit, or push unless explicitly requested.

Do not delete the existing prototype until the replacement works and removal is clearly safe.

---

# ARCHITECTURE DECISION LOG

Create:

```text
docs/mascot/ARCHITECTURE.md
```

Use this format:

```markdown
## Decision: Canvas 2D as initial renderer

Status: accepted

Context:
The first production scope is one character with bounded dots and particles.

Decision:
Use Canvas 2D until profiling proves a GPU renderer is necessary.

Consequences:
- simpler debugging
- lower initial dependency cost
- renderer interface remains replaceable
- advanced post-processing is deferred
```

Required decisions:

- Canvas first
- fixed-step simulation
- no React per-frame state
- original silhouette
- cached DOM geometry
- rectangle-aware steering
- client-only dynamic loading
- reduced-motion mode
- GPU migration gate
- Worker migration gate
- optional FABRIK gate
- optional Pretext gate

---

# DOCUMENTATION RESPONSIBILITIES

## `BASELINE_AUDIT.md`

Include:

- repository state
- relevant files
- existing prototype summary
- identified bugs
- existing build state
- package manager
- test tooling
- dependency opportunities
- risk list

## `IMPLEMENTATION_STATUS.md`

Include:

```markdown
# Current phase

# Completed

# In progress

# Validation

# Performance

# Known issues

# Next action
```

## `MOTION_RECIPES.md`

Document:

- every state
- final frequency
- damping
- response
- speed
- acceleration
- stiffness
- tail drag
- visual intention

## `PERFORMANCE.md`

Document:

- environment
- quality tier
- viewport
- dot count
- particle count
- simulation average
- render average
- p95
- worst
- bundle findings
- lifecycle findings
- downgrade behaviour

## `PLAYTEST.md`

Document:

- viewport matrix
- scenarios
- console issues
- screenshots or recordings
- pass and fail
- follow-up changes

## `FINAL_REPORT.md`

Document final result and known limitations.


---

# TEST INFRASTRUCTURE

Use the project's current testing framework whenever possible.

If no unit-test framework exists, choose one lightweight framework consistent with the repository.

If Playwright already exists, reuse it.

Do not install multiple overlapping frameworks.

---

# REQUIRED UNIT TESTS

## Second-order dynamics

Test:

- convergence to a fixed target
- damping affects overshoot
- reset
- finite output
- deterministic input
- zero or tiny delta
- capped large delta
- invalid configuration handling

## Spine solver

Test:

- segment lengths stay within tolerance
- root pin remains exact
- angle limit works
- coincident joints recover
- no non-finite values
- quality iteration count remains bounded

## Verlet chain

Test:

- drag reduces energy
- root stays pinned
- segment lengths remain bounded
- reset works
- pause and resume do not inject energy

## Body profile

Test:

- finite
- non-negative
- tail taper
- expected maximum region
- no abrupt discontinuity

## Wander planner

Test:

- deterministic by seed
- safe bounds
- valid durations
- finite control points
- no teleport between segments
- cooldowns
- interest target selection

## Rectangle steering

Test:

- left side
- right side
- top side
- bottom side
- each corner
- point inside
- zero-distance
- tangent selection
- force cap
- combined obstacles
- hard padding

## FABRIK if implemented

Test:

- reachable target
- unreachable target
- length preservation
- bend stability
- no knee flip
- no non-finite result

## Performance governor

Test:

- downgrade after sustained slow frames
- cooldown
- no rapid oscillation
- no repeated upgrade
- no quality change during blocked states
- reduced mode is final fallback

---

# ENGINE LIFECYCLE TESTS

Test:

- `start()` schedules one RAF loop
- repeated `start()` does not create duplicate loops
- `pause()` stops simulation updates
- `resume()` resets frame time
- `destroy()` cancels RAF
- repeated `destroy()` is safe
- listeners are removed
- observers are disconnected
- resize updates CSS and backing dimensions
- hidden document pauses
- visible document resumes without jump
- reduced-motion mode works
- engine can unmount and remount
- route navigation does not leak runtime
- no React state update is required per frame

---

# E2E TESTS

## Motion lab

Verify:

- route loads
- no browser console error
- Canvas exists
- debug API exists in development test mode
- deterministic scenario runs
- pause and resume work
- quality changes work
- screenshot is stable within accepted threshold
- obstacle debug overlay can be enabled
- resize retains valid rig

## Portfolio integration

Verify:

- content appears before mascot activation
- navigation is clickable
- buttons and forms remain usable
- mascot Canvas does not intercept pointer
- hard obstacles work
- route navigation cleans up
- disabling mascot stops motion
- lazy client chunk loads only when intended
- no hydration warning
- no layout shift from mascot

## Mobile

Verify:

- portrait
- landscape
- touch input
- scrolling
- resize
- DPR cap
- no horizontal overflow
- hard controls usable
- performance governor can downgrade

## Reduced motion

Verify:

- no chase
- no sprint
- no scatter
- static or very slow visual
- page remains functional
- preference changes update runtime

---

# PLAYTEST MATRIX

Required viewports:

```text
1440 x 900 desktop
1280 x 720 laptop
1024 x 768 tablet landscape
768 x 1024 tablet portrait
430 x 932 mobile portrait
932 x 430 mobile landscape
360 x 800 small mobile
```

Required scenarios:

- pointer follow
- repeated direction changes
- pointer leaves viewport
- idle transition
- wander to follow
- hard obstacle approach
- rectangle corner
- inspect project card
- fast scrolling
- resize while moving
- hidden tab for ten seconds
- reduced motion
- component unmount and remount
- route navigation
- click scatter and reform when enabled

Capture when tooling permits:

- screenshot
- short recording
- average frame time
- p95 frame time
- worst frame time
- console errors
- memory trend
- object counts
- quality changes

Record results in:

```text
docs/mascot/PLAYTEST.md
```

---

# PERFORMANCE ANTI-PATTERNS TO REJECT

Reject changes that introduce:

- React state in RAF
- thousands of DOM nodes
- per-dot React components
- `getBoundingClientRect()` in RAF
- `querySelectorAll()` in RAF
- random object creation each frame
- unbounded particles
- unbounded catch-up simulation
- uncapped DPR
- per-dot gradients or shadows
- one `fill()` per dot
- anonymous listeners that cannot be removed
- Workers before profiling
- WebGPU as first backend
- Three.js without a 3D requirement
- a large physics engine for simple constraints
- copied mascot silhouette
- AI inference in the animation loop
- turning a whole page into a Client Component only to mount the mascot
- full text reflow at 60 FPS
- automatic sound
- a debug API in production
- optional heavy libraries in the initial bundle
- hiding broken performance behind an inaccurate FPS label

---

# QUALITY REVIEW RUBRIC

Score major milestones from 1 to 10:

```text
Original silhouette
Small-size readability
Pointer responsiveness
Wander naturalness
Transition continuity
Turn follow-through
Tail settling
Acceleration anticipation
Stop and rest behaviour
DOM obstacle readability
Project-card inspection
Reduced-motion quality
Desktop frame stability
Mobile frame stability
Portfolio usability
```

A visually important phase is not complete when a critical category is below 6.

Do not chase a score of 10 at the cost of functionality or performance.

---

# FAILURE HANDLING

If a phase fails:

1. identify whether failure is architectural, mathematical, visual, or tooling
2. create a deterministic reproduction
3. reduce to the smallest failing system
4. fix the root cause
5. rerun focused tests
6. rerun one representative browser scenario
7. document the result
8. continue

If a dependency cannot be installed:

- preserve a dependency-free Canvas implementation
- use current repository tooling
- document the limitation
- do not abandon the entire feature

If the existing repository already fails build:

- record the exact pre-existing failure before changes
- verify mascot-specific checks independently
- do not claim the full build passes
- avoid fixing unrelated systems unless necessary for mascot integration

If browser automation is unavailable:

- add deterministic manual test instructions
- run available unit and build checks
- document the missing automation
- do not invent results

If performance targets are not met:

1. verify profiler data
2. reduce particles
3. reduce dots
4. reduce solver iterations
5. cap DPR
6. simplify effects
7. test low tier
8. consider GPU renderer only if rendering remains the bottleneck
9. consider Worker only if simulation remains the bottleneck

---

# DEFINITION OF DONE

The task is complete only when all applicable items are true.

## Architecture

- [ ] React owns lifecycle and low-frequency UI.
- [ ] Simulation is outside React state.
- [ ] Fixed-step loop exists.
- [ ] Renderer is separated from simulation.
- [ ] Engine destroy is idempotent.
- [ ] Debug-only code is excluded from production.
- [ ] Optional renderer is behind an interface and gate.

## Motion

- [ ] Second-order root motion is stable.
- [ ] Spine constraints are stable.
- [ ] Tail has genuine follow-through.
- [ ] Character has an original silhouette.
- [ ] Base geometry is symmetric.
- [ ] Motion adds controlled asymmetry.
- [ ] Follow and wander blend smoothly.
- [ ] Follow, wander, inspect, sprint, and rest are implemented or explicitly documented as deferred.
- [ ] Deterministic scenarios exist.
- [ ] No state transition causes a visible teleport.

## Rendering

- [ ] Solid silhouette renderer exists.
- [ ] Dot renderer is batched.
- [ ] Dot samples are seeded and cached.
- [ ] Quality tiers work.
- [ ] DPR is capped.
- [ ] Particles are pooled and capped.
- [ ] Medium quality meets budget or limitations are documented.
- [ ] Reduced mode is inexpensive.

## DOM integration

- [ ] Marked DOM elements are cached.
- [ ] No rectangle measurement occurs in RAF.
- [ ] Hard, soft, and interest modes exist.
- [ ] Rectangle-aware steering works.
- [ ] Navigation and forms remain usable.
- [ ] Project inspection does not obscure content for long.
- [ ] Route and layout changes refresh geometry safely.
- [ ] Inside-rectangle and zero-distance cases are finite.

## Next.js

- [ ] Browser-only code is behind a Client Component boundary.
- [ ] Mascot is dynamically loaded.
- [ ] No hydration error.
- [ ] No mascot-driven layout shift.
- [ ] Portfolio works before mascot loads.
- [ ] Optional heavy renderer is not in the initial bundle.
- [ ] Motion-lab debug code is excluded from production route.

## Accessibility

- [ ] Reduced-motion mode exists.
- [ ] Decorative Canvas is hidden from screen readers.
- [ ] Mascot can be disabled where appropriate.
- [ ] Touch and keyboard page interaction remain usable.
- [ ] No automatic audio.
- [ ] Text experiments preserve accessible text.

## Lifecycle

- [ ] RAF is cancelled.
- [ ] Observers are disconnected.
- [ ] Listeners are removed.
- [ ] Timers are cleared.
- [ ] Hidden-tab pause works.
- [ ] Unmount and remount do not duplicate engine.
- [ ] Resume does not cause a giant delta.
- [ ] Destroy can be called repeatedly.

## Tests

- [ ] Math unit tests pass.
- [ ] Rectangle tests pass.
- [ ] Engine lifecycle tests pass.
- [ ] Motion-lab E2E passes.
- [ ] Portfolio E2E passes.
- [ ] Mobile test passes.
- [ ] Reduced-motion test passes.
- [ ] Production build passes or pre-existing failure is documented.
- [ ] Console is clean of introduced errors.
- [ ] Performance verification has evidence.

## Documentation

- [ ] Baseline audit exists.
- [ ] Architecture decisions exist.
- [ ] Implementation status is current.
- [ ] Motion recipes are documented.
- [ ] Playtest report exists.
- [ ] Performance report exists.
- [ ] Final report exists.
- [ ] Tuning instructions exist.

---

# AUTONOMOUS EXECUTION CHECKLIST

The coordinator should track this live:

```text
[ ] Read master specification
[ ] Inspect git status
[ ] Inspect package and app structure
[ ] Write baseline audit
[ ] Create implementation status
[ ] Merge concise project CLAUDE.md
[ ] Create project skills
[ ] Create project subagents
[ ] Merge hook configuration safely
[ ] Build numeric guards
[ ] Build fixed-step loop
[ ] Build stable second-order dynamics
[ ] Add unit tests
[ ] Build motion lab
[ ] Add Canvas lifecycle
[ ] Add pointer input
[ ] Add responsive DPR sizing
[ ] Add visibility pause
[ ] Add spine solver
[ ] Add angle constraints
[ ] Add Verlet tail
[ ] Add body profile
[ ] Add symmetric silhouette
[ ] Tune follow motion
[ ] Add behavior machine
[ ] Add seeded wander planner
[ ] Add target blending
[ ] Add inspect
[ ] Add rest
[ ] Add sprint
[ ] Add dot skin
[ ] Add Canvas batching
[ ] Add particles
[ ] Add quality tiers
[ ] Profile Canvas
[ ] Add DOM registry
[ ] Add rectangle steering
[ ] Add hard obstacles
[ ] Add soft obstacles
[ ] Add interest elements
[ ] Add project inspection
[ ] Add restrained scroll current
[ ] Add optional scatter and reform
[ ] Integrate dynamic loader
[ ] Add production CSS layers
[ ] Add reduced-motion mode
[ ] Verify lazy chunk
[ ] Add unit tests
[ ] Add E2E tests
[ ] Run viewport matrix
[ ] Run production build
[ ] Run performance verification
[ ] Review with motion director
[ ] Fix highest-impact motion issue
[ ] Fix highest-impact performance issue
[ ] Update documentation
[ ] Write final report
[ ] Return implementation summary
```

---

# FINAL REPORT FORMAT

When implementation finishes, respond with:

## Result

State:

- complete
- substantially complete with limitations
- blocked by a specific external issue

## What changed

Describe the user-visible result.

## Architecture

Explain engine, renderer, React boundary, behavior system, and DOM registry.

## Important files

List created and modified files.

## Motion systems

List:

- second-order dynamics
- constraints
- Verlet
- behavior states
- dot deformation
- FABRIK when implemented

## Interactions

List:

- pointer
- touch
- wander
- obstacles
- project inspection
- scroll
- click effects
- Pretext experiment when implemented

## Performance

Report:

- quality tiers
- average frame time
- p95
- worst
- tested viewport and environment
- lazy-loading result
- bundle findings
- downgrade behaviour

## Validation

List exact commands and outcomes.

## Limitations

Be precise.

## How to test

Provide:

- motion-lab route
- production route
- debug mode
- deterministic scenarios
- reduced-motion test
- disabling instructions

## Next three improvements

Include only deliberately deferred improvements.

---

# FINAL START COMMAND FOR CLAUDE CODE

After saving this file at the repository root, send this exact prompt:

```text
Read @PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md in full.

Treat it as the implementation specification for this repository.

Inspect the repository and current git state first. Preserve unrelated work.

Create the required project memory, skills, subagents, hooks, documentation, motion lab, procedural engine, tests, and portfolio integration. Work through the phases in order. Delegate focused tasks where useful, but inspect and validate delegated changes yourself.

Do not stop after planning. Continue until all achievable completion gates pass. Run the available format, lint, TypeScript, unit, browser, build, and performance checks. Fix introduced failures. Record pre-existing failures separately.

Do not copy the reference mascot or branding. Build an original symmetric dot creature with second-order motion, constrained spine deformation, genuine secondary motion, autonomous procedural wandering, cached rectangle-aware DOM interaction, reduced-motion support, and lazy-loaded production integration.

Use Canvas 2D first. Add PixiJS, Workers, OffscreenCanvas, FABRIK legs, or Pretext effects only after their gates are met.

At the end, write docs/mascot/FINAL_REPORT.md and respond using the final response format in the specification.
```

---

# QUICK LAUNCH ALTERNATIVE

After `.claude/agents/mascot-coordinator.md` exists:

```bash
claude --agent mascot-coordinator
```

Then:

```text
Execute @PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md completely. Resume from docs/mascot/IMPLEMENTATION_STATUS.md when work already exists.
```

---

# END OF MASTER SPECIFICATION
