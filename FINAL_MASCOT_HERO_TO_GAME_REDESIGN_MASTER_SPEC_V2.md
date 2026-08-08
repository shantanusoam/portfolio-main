# FINAL MASCOT + HERO-TO-GAME REDESIGN MASTER SPEC — V2

> **This V2 supersedes the previous final redesign spec where they conflict.**
>
> **Primary direction:** Preserve the current strong procedural motion and musical-string system, but transform the mascot into a readable character and make the **actual portfolio hero visually transform into the game**, with no abrupt modal/menu break.
>
> **Final game direction:** **Resonance Weaver** — a musical physics game born directly from the hero UI.

---

# 0. MASTER DECISION

The current implementation has strong underlying systems:

- smooth procedural motion
- second-order dynamics
- drag behavior
- string interaction
- audio
- dark musical hero
- game infrastructure
- responsive Next.js integration

But the current visible result still falls short because it behaves like:

```text
interactive procedural effect
```

instead of:

```text
character living inside the interface
```

The reference succeeds because:

```text
real UI
-> character physically interacts with UI
-> UI becomes game geometry
-> character continues seamlessly into gameplay
```

Our final experience should use the same **interaction philosophy**, but remain visually and mechanically original.

---

# 1. FINAL CREATIVE NORTH STAR

Build:

> **A cute musical signal-creature that physically lives inside the hero, plays and pulls the existing guitar strings, perches on UI lines, reacts facially to velocity and impact, then tears the hero loose into a musical physics game where the hero's own bars, letters and strings become the world.**

The experience should feel continuous:

```text
portfolio
↓
living character
↓
drag / pluck / UI interactions
↓
string tension event
↓
hero cracks loose
↓
DOM visuals become physical proxies
↓
Resonance Weaver game
↓
collect / restore hero fragments
↓
game world reassembles into portfolio
```

No traditional:

```text
click
-> modal
-> Start button
-> unrelated game scene
```

---

# 2. KEEP THESE EXISTING IDEAS

Do not throw away the systems that are already good.

Keep:

- current smooth body movement
- drag interaction
- string crossing and sound production
- second-order response
- procedural deformation
- cached DOM geometry
- local-quality/performance tiers
- reduced-motion architecture
- lazy-loading approach
- current dark/black hero
- neon violet/cyan/pink visual language
- current strings as an interaction surface

The next sprint is not a rewrite.

It is a **character + interaction + transition redesign**.

---

# 3. STOP OPTIMIZING THE CURRENT RIBBON

The existing visible creature still reads as:

- ribbon
- leaf
- crescent
- comet
- tail-first particle brush

Do not keep making the same form prettier.

Replace the neutral silhouette.

Required neutral proportions:

```text
head: 28–32%
torso: 40–45%
tail: 25–30%
```

The body should be compact.

The tail is secondary.

The head must be immediately recognizable.

---

# 4. CHARACTER DESIGN

Final direction:

## Musical Signal Familiar

A hybrid of:

- tiny manta-like creature
- compact bean/plush body
- futuristic signal spirit
- constellation toy
- instrument familiar

It should have:

- stable rounded head
- compact torso
- short expressive tail
- two side fins / ear-like appendages
- two readable eyes
- eyelids
- tiny mouth
- optional embedded resonance core
- body-local printed texture
- sparse structural dots

Do not make it realistic.

Do not copy a known mascot.

---

# 5. FACIAL MATRIX — VELOCITY-DRIVEN ACTING

The new information from the reference comparison is critical:

**the face should respond directly to motion and interaction.**

Do not treat expression as only a random state timer.

Create a facial parameter matrix driven by:

- horizontal velocity
- vertical velocity
- acceleration
- drag tension
- proximity to target
- collision impulse
- string tension
- falling state
- landing state

Example:

```ts
interface FacialMotionInput {
  velocityX: number;
  velocityY: number;
  accelerationX: number;
  accelerationY: number;

  speed: number;
  fallingSpeed: number;

  dragTension: number;
  collisionImpulse: number;
  stringTension: number;

  targetDirectionX: number;
  targetDirectionY: number;
}
```

Output:

```ts
interface FacialPose {
  pupilX: number;
  pupilY: number;

  eyeScaleX: number;
  eyeScaleY: number;

  eyelid: number;
  mouthOpen: number;
  mouthCurve: number;

  headLean: number;
  cheekIntensity: number;
}
```

---

# 6. FACIAL REACTION RULES

Use these as initial art-direction rules.

## Fast horizontal drag

```text
eyes look ahead
eyelids narrow slightly
head leans into motion
fins sweep backward
mouth tightens
```

## Fast falling

```text
eyes widen
pupils look downward
mouth opens slightly
fins raise
tail trails upward
```

## Strong string impact

```text
eyes compress for 1–2 frames
mouth opens
head squashes
contact-side fin reacts
then eyes rebound wider
```

## High drag tension

```text
eyes squint
body stretches toward pointer
head stays anchored
fins angle backward
```

## Rest

```text
eyelids lower
pupils move slowly
mouth neutral
tail curls
breathing slows
```

## Successful musical chord

```text
eyes brighten / widen gently
small smile
tiny fin flutter
resonance core pulse
```

---

# 7. FACE MUST BE LOCALLY ATTACHED

Create a stable local head frame.

```ts
interface FaceFrame {
  centerX: number;
  centerY: number;

  forwardX: number;
  forwardY: number;

  normalX: number;
  normalY: number;

  width: number;
  height: number;

  rotation: number;
}
```

Every face feature derives from this.

Do not use world-space eye offsets.

Do not let the current white orb float separately from the body.

If the orb remains:

```text
embed it inside torso/head
treat as resonance core
not as the complete face
```

---

# 8. SQUASH MATRIX

Create one body transform matrix for character acting.

```ts
interface CharacterDeformation {
  scaleForward: number;
  scaleNormal: number;

  headScaleX: number;
  headScaleY: number;

  tailStretch: number;
  finSpread: number;

  rotation: number;
  impactWave: number;
}
```

Examples:

## Drag tension

```text
scaleForward > 1
scaleNormal < 1
tailStretch increases
```

## Collision

```text
scaleForward decreases
scaleNormal increases
```

## Launch

```text
brief compression
then strong forward/vertical stretch
```

---

# 9. VISUAL TEXTURE DIRECTION

Keep the previous requirement:

- solid readable silhouette first
- texture second
- particles last

Do not make noise the body.

Recommended visual hierarchy:

```text
1. deep-violet silhouette
2. warm-cream face
3. local-space muted lavender texture
4. sparse cyan signal decals
5. sparse magenta accent
6. rim light
7. temporary music FX
```

Reduce saturated cyan/magenta coverage heavily compared with the current character.

---

# 10. GENERATED TEXTURE / SPRITE REQUIREMENT

If image-generation tooling exists, actually use it for:

- terrazzo decal sheet
- constellation freckle sheet
- organic circuit decal sheet
- subtle velvet microtexture
- resonance FX sprite sheet
- game ornament sheet

Do not generate a pre-rendered animated mascot.

Generated art is for:

```text
surface
FX
ornaments
```

The rig remains procedural.

If image generation is unavailable:

- create a blocker document
- include prompts
- do not falsely mark the phase complete

---

# 11. UI INTERACTION PHILOSOPHY

The reference feels magical because the character interacts with the **actual interface**.

We need the same conceptual behavior.

The creature should interact with:

- hero bars
- guitar strings
- separator lines
- project teaser rails
- large hero typography bounds
- safe button edges
- decorative UI fragments

The character must not behave like a separate overlay floating above everything.

---

# 12. IMPORTANT IMPLEMENTATION CORRECTION: DO NOT TURN LIVE DOM INTO A PHYSICS ENGINE

Do **not** directly convert semantic DOM nodes into continuously simulated rigid bodies.

That causes:

- layout thrashing
- accessibility problems
- React state conflicts
- fragile responsive behavior
- difficult reset logic

Instead use:

# DOM SHADOW PROXIES

The real DOM remains semantic.

When a transition begins:

1. measure selected elements once with `getBoundingClientRect()`
2. capture their:
   - text
   - box size
   - position
   - visual style reference
3. create Canvas/game proxy objects
4. fade the real DOM visually
5. animate the proxies with physics
6. restore the DOM at the end

Architecture:

```text
semantic DOM
    |
    | snapshot geometry
    v
Canvas Proxy World
    |
    | simulate
    v
game
    |
    | interpolate back
    v
semantic DOM restored
```

This gives the visual illusion that the UI fell apart without actually destroying React layout.

---

# 13. UI PROXY DATA

```ts
interface HeroProxyObject {
  id: string;

  sourceElement: HTMLElement | null;

  type:
    | "letter"
    | "word"
    | "bar"
    | "string"
    | "dot"
    | "buttonEdge"
    | "decorativeLine";

  homeX: number;
  homeY: number;

  x: number;
  y: number;

  previousX: number;
  previousY: number;

  velocityX: number;
  velocityY: number;

  rotation: number;
  angularVelocity: number;

  width: number;
  height: number;

  opacity: number;

  collected: boolean;
}
```

Do not allocate these continuously.

Build only during transition/game entry.

---

# 14. HERO UI INTERACTION BEFORE GAME

Even before game mode, add small physical interactions.

## Perch

Character lands on decorative bars.

## Slide

Character can slide along a horizontal hero line.

## Peek

Character can move partially behind title bounds.

## Inspect

Character looks at interesting hero elements.

## Button-edge sit

Character may sit on a safe edge without blocking click.

## Drag resistance

Dragging toward a hard UI rectangle:

```text
body stretches
face squints
root resists
release causes rebound
```

These interactions should be sparse.

Do not turn the homepage into a constant circus.

---

# 15. STRINGS REMAIN THE SIGNATURE INTERACTION

The guitar strings are the strongest original feature.

Make them more physical.

Every string needs:

- visible local bend
- traveling wave
- semantic contact event
- musical note event
- tension value
- visual glow
- body reaction

The string should visibly react enough that a viewer understands:

> “the creature just played that string.”

---

# 16. DRAGGED STRING TENSION

Add a deliberate string-tension mechanic.

When dragging the creature while attached to or pulling a string:

```ts
const tension =
  clamp(
    distance(currentDragPoint, stringRestPoint) /
      MAX_STRING_PULL,
    0,
    1,
  );
```

Use tension for:

- visual bend
- pitch bend or timbre
- character stretch
- eye squint
- camera micro-response
- transition trigger

Do not use tension directly as raw gain.

---

# 17. GAME TRIGGER — SLINGSHOT / SNAP

This is a better transition trigger than a conventional Start modal.

Use:

```text
drag creature
-> catch / pull hero string
-> tension increases
-> threshold reached
-> visual warning / glow
-> release
-> SNAP
```

Trigger condition:

```ts
interface ResonanceGateState {
  attachedToString: boolean;
  pullTension: number;
  releaseVelocity: number;
  pointerReleased: boolean;
  triggerCooldown: number;
}
```

Example:

```text
pullTension > 0.82
AND pointerReleased
AND releaseVelocity passes threshold
```

Then:

```ts
beginHeroFractureTransition();
```

---

# 18. ACCESSIBLE GAME ENTRY

The slingshot is a magical bonus interaction.

It cannot be the only entry.

Also provide a visible compact control:

```text
Enter Resonance
```

or:

```text
Play Hero
```

No modal start menu.

Clicking it should begin the transition directly.

---

# 19. HERO FRACTURE TRANSITION

This is now the final chosen transition.

## Beat 1 — Tension

- string is pulled
- character stretches
- eyes squint
- hero lights subtly respond

## Beat 2 — Snap

- string releases
- short audio snap
- small screen impulse
- character shoots/freefalls

## Beat 3 — UI unlock

Selected hero visual elements visually detach:

- title letters
- bars
- string segments
- decorative dots

Important:
use Canvas proxies.

Do not physically mutate all DOM nodes.

## Beat 4 — Falling UI

Hero proxies begin falling or drifting.

Some rotate.

Some bounce on strings.

## Beat 5 — Character transition

Creature changes from hover/follow mode into explicit game-root physics.

## Beat 6 — Game camera

Hero remains visible but darkens and becomes world backdrop.

## Beat 7 — Gameplay begins immediately

No extra Start popup.

---

# 20. FINAL GAME CONCEPT — RESONANCE WEAVER

This is more original and more connected to the hero than the previous generic vertical climb.

The game combines:

```text
musical strings
+
falling hero fragments
+
elastic physics
+
character movement
+
collection / restoration
```

---

# 21. RESONANCE WEAVER CORE LOOP

Initial event:

```text
hero fractures
-> title / bars become proxy objects
-> creature falls into hero space
```

Player objective:

```text
use existing and temporary resonance strings
to bounce / guide the creature
through falling UI fragments
and collect / restore them
```

The game ends when enough hero fragments are recovered.

Then they fly back to their original layout.

This creates a complete narrative:

```text
break hero
-> play inside hero
-> rebuild hero
```

---

# 22. MOVEMENT MODEL

The character uses explicit game-root velocity.

```ts
interface GameRoot {
  x: number;
  y: number;

  previousX: number;
  previousY: number;

  velocityX: number;
  velocityY: number;

  radius: number;
}
```

The procedural rig follows this root.

Do not use pointer-follow second-order root motion during gameplay.

---

# 23. PLAYER CONTROL OPTIONS

Recommended primary control:

## Horizontal steering

Desktop:

- pointer X
- A / D
- left/right arrows

Touch:

- horizontal drag

Secondary interaction:

## String placement / pulling

Allow the player to pull or activate limited temporary strings.

Do not allow unlimited freehand strings immediately.

Start with:

```text
2–3 active temporary strings
```

This keeps gameplay understandable.

---

# 24. STRING WEAVING MECHANIC

The player can create a temporary resonance string between allowed anchor zones.

Interaction:

```text
pointer down on anchor
-> drag
-> preview string
-> release
-> string becomes active
```

Creature can bounce from it.

Every impact plays a note.

String has:

- lifetime
- tension
- note
- energy
- collision geometry

This is the distinctive game mechanic.

---

# 25. WHY STRING WEAVING IS BETTER FOR THIS PORTFOLIO

It matches the existing brand language:

- systems
- engineering
- music
- physics
- interaction
- creative coding

It is more original than:

- ordinary jumping platforms
- endless runner
- bullet hell
- generic Doodle Jump clone

The visitor is **building the game surface** while playing.

---

# 26. FALLING HERO FRAGMENTS

Selected hero elements become visual game objects.

Examples:

- letters from “SHANTANU SOAM”
- tiny label fragments
- decorative bars
- accent dots
- bracket-like UI pieces

Do not turn every piece of text into an object.

Use a curated subset.

---

# 27. LETTER / FRAGMENT COLLECTION

A fragment is collected when the creature intersects it.

Use simple circle/rect or capsule/rect collision.

Example:

```ts
function circleVsRect(
  circleX: number,
  circleY: number,
  radius: number,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
): boolean {
  const nearestX = Math.max(
    rectX,
    Math.min(circleX, rectX + rectW),
  );

  const nearestY = Math.max(
    rectY,
    Math.min(circleY, rectY + rectH),
  );

  const dx = circleX - nearestX;
  const dy = circleY - nearestY;

  return dx * dx + dy * dy <= radius * radius;
}
```

For fast movement, use swept collision or previous/current bounds.

Do not rely only on point sampling.

---

# 28. COLLECTION REACTION

On collection:

- object compresses
- dissolves into tiny resonance fragments
- musical tone plays
- object is marked collected
- combo increases
- a ghost line points toward its original hero position

Do not immediately restore it.

Restore everything during exit/resolution.

---

# 29. COMBO SYSTEM

Combo represents:

```text
continuous musical interaction
+
fragment recovery
+
clean string bounces
```

Example:

```text
x1:
single pluck

x2:
secondary harmonic

x4:
small bass pulse

x6:
constellation trail

x8+:
subtle ambient chord layer
```

Keep layers bounded.

---

# 30. GAME SPACE

Do not create an unrelated new visual background.

Use the hero itself:

- dark page stays
- hero title fades but remains ghosted
- strings remain
- bars drift
- typography fragments fall
- sections become distant layers

The game exists inside the hero composition.

---

# 31. CAMERA

Avoid a huge separate scrolling world initially.

The first version can work in a **hero-sized physics arena**.

Recommended:

```text
viewport-sized arena
with controlled vertical extension
```

If the game later expands vertically, use a camera.

But the first priority is the illusion that the actual hero transformed.

---

# 32. GAME PHASES

## Phase A — Fracture

UI unlocks.

## Phase B — Catch

Player stabilizes the falling character with strings.

## Phase C — Weave

Player creates strings and collects fragments.

## Phase D — Resonance

Combo builds and music becomes richer.

## Phase E — Restore

Collected fragments fly to original positions.

## Phase F — Portfolio

Canvas proxies fade.

Real DOM fades back in.

Character returns to ambient state.

---

# 33. RESTORE TRANSITION

This is as important as entry.

When completion occurs:

1. gravity reduces
2. strings resonate
3. collected fragments freeze
4. each proxy gets its `homeX/homeY`
5. use second-order or critically damped motion toward home
6. rotation decays
7. real DOM fades back in
8. proxies fade out
9. character lands on a hero bar
10. game input releases
11. normal homepage interaction resumes

The visitor should feel:

> “I rebuilt the portfolio.”

---

# 34. FAILURE / EARLY EXIT

If the visitor fails or exits:

- do not reload
- do not leave broken DOM
- proxies smoothly return
- real DOM restores
- character returns to a safe string
- combo resets

Always prioritize clean restoration.

---

# 35. GAME MUSIC

The string interaction already produces sound.

Extend it.

## Existing hero strings

Fixed musical identity.

## Player-created strings

Map to notes within current scale.

Possible mapping:

```text
vertical anchor -> pitch region
string length -> timbre / register
tension -> brightness
impact velocity -> velocity
```

Quantize pitch.

Do not allow arbitrary microtonal chaos unless intentionally in an experimental mode.

---

# 36. CHARACTER MATERIAL OPTIONS

Do not blindly choose a WebGL shader.

Two possible styles may be tested.

## Preferred default — Soft Signal Plush

- deep violet solid body
- subtle velvet microtexture
- small neon printed decals
- warm face
- low-cost Canvas
- cute and readable

## Optional experimental — Fiber Optic

- translucent body
- internal moving pulse
- mild refraction
- WebGL/Pixi only after performance gate

Do not make “glass” the default merely because it is technically impressive.

Character readability wins.

---

# 37. NEON THREAD STYLE

The “Synth-Wave Thread” idea can be retained for:

- tail trail
- temporary string energy
- transition snap
- speed effect

Do not make the entire body a neon tube.

Use it as an FX language.

---

# 38. GAME ENTRY WITHOUT MODAL

Delete or bypass any start popup if the current implementation still uses one.

The flow should be:

```text
user trigger
-> transition
-> game immediately becomes interactive
```

If controls need explanation:

show a small inline overlay for 1–2 seconds:

```text
MOVE ← →
WEAVE: DRAG BETWEEN NODES
ESC: EXIT
```

Then fade it.

No centered Start modal.

---

# 39. DOM MEASUREMENT

Use cached measurement.

Do:

```text
measure at transition start
build proxy objects
simulate proxies
```

Do not call:

```ts
getBoundingClientRect()
```

for every proxy every frame.

After transition begins, the proxy simulation is authoritative.

---

# 40. RESPONSIVE DESIGN

On mobile:

- use fewer falling fragments
- use larger collision targets
- use fewer simultaneous strings
- reduce FX
- reduce proxy count
- provide simple drag-to-steer
- provide large anchor nodes for weaving

The game must remain readable in portrait.

---

# 41. REDUCED MOTION

Reduced mode:

- no violent fracture
- UI elements softly detach
- minimal tumble
- no screen shake
- strings still respond gently
- game remains playable
- restore transition uses slow fades / short moves

---

# 42. ACCESSIBILITY

The visual DOM fracture uses proxies only.

The underlying semantic DOM stays valid.

During active game:

- mark underlying hero interactive controls inert when appropriate
- game overlay has clear accessible controls
- Escape exits
- sound remains optional
- no gameplay objective depends only on audio
- visible labels exist for important interactions

---

# 43. REQUIRED MOTION-LAB PANELS

Expand the current lab.

## Character

- eyes
- blink
- mouth
- head lean
- fins
- body proportions
- texture

## Velocity Face

Controls to simulate:

- velocity X
- velocity Y
- acceleration
- drag tension
- impact
- fall
- pluck

This panel is mandatory.

## UI Interaction

- perch
- hard obstacle
- slide
- inspect
- drag resistance

## String

- string tension
- contact type
- tail brush
- fin touch
- snap threshold

## Transition

Play:

- tension
- snap
- fracture
- proxy fall
- game start
- restore

## Game

- player steering
- weave anchors
- proxy fragments
- collection
- combo
- restoration

---

# 44. NEW GAME DEBUG VIEW

Add:

```text
/motion-lab?panel=resonance-weaver
```

It should support:

- static hero proxy set
- game without transition
- fixed seed
- collect all button
- reset
- draw collision boxes
- draw string collision
- show proxy home positions
- show FPS
- show audio voice count

---

# 45. VISUAL ACCEPTANCE GATE

Do not proceed to game polish until:

```text
[ ] Character no longer reads as ribbon.
[ ] Face is readable immediately.
[ ] Eyes respond to velocity.
[ ] Falling expression works.
[ ] Drag tension expression works.
[ ] Pluck reaction works.
[ ] Landing squash works.
[ ] Fins make the character more readable.
[ ] Tail remains secondary.
[ ] Character works without particles.
[ ] Texture does not obscure face or silhouette.
```

---

# 46. UI ACCEPTANCE GATE

```text
[ ] Character perches on hero bar.
[ ] Character slides along safe UI line.
[ ] Character inspects a hero item.
[ ] Character never blocks nav/CTA.
[ ] Dragging into obstacle shows physical resistance.
[ ] String visibly bends.
[ ] Tail strum works.
```

---

# 47. TRANSITION ACCEPTANCE GATE

```text
[ ] No Start modal.
[ ] Visible accessible game trigger exists.
[ ] Slingshot trigger works as optional secret.
[ ] String tension visibly builds.
[ ] Snap is readable.
[ ] Hero proxies detach.
[ ] Real DOM stays semantically intact.
[ ] Falling UI feels connected to original positions.
[ ] Character uses game-root physics after snap.
[ ] Game begins without visual cut.
```

---

# 48. RESONANCE WEAVER ACCEPTANCE GATE

```text
[ ] Character can be steered.
[ ] Temporary strings can be created or activated.
[ ] Character bounces on strings.
[ ] String contacts create music.
[ ] Hero fragments can be collected.
[ ] Combo works.
[ ] Game remains playable muted.
[ ] Exit works.
[ ] Completion restores hero.
[ ] Real DOM returns exactly.
[ ] No page reload.
```

---

# 49. PERFORMANCE RULES

Preserve all previous performance rules.

Additional hard limits:

- curated proxy fragments, not every DOM node
- bounded temporary strings
- bounded visual string control points
- bounded audio voices
- no DOM layout reads in game loop
- no React state per frame
- no per-frame text rasterization

Suggested first-version caps:

```text
hero proxy fragments: 18–35
temporary active strings: 3
string simulation control points: 9–15 per string
active particles: quality-dependent and bounded
audio voices: 8–12 typical
```

---

# 50. IMPLEMENTATION PHASES

## Phase 0 — Baseline
Inspect current code, current videos, hero, current game, current string/audio system.

## Phase 1 — Character rescue
Compact anatomy, stable head, fins, face.

## Phase 2 — Facial matrix
Velocity, acceleration, drag tension, collision, fall, pluck.

## Phase 3 — Surface
Generated/local-space decals, microtexture, clean hierarchy.

## Phase 4 — Hero physical interactions
Perch, slide, inspect, drag resistance.

## Phase 5 — String tension system
Strong deformation, sound, contact acting, pull tension.

## Phase 6 — Slingshot transition
Tension, snap, UI proxy creation.

## Phase 7 — DOM shadow proxy fracture
Hero letters/bars/dots detach visually.

## Phase 8 — Resonance Weaver MVP
Steering, strings, bounce, fragment collection.

## Phase 9 — Music and combo
Quantized musical strings, layered combo.

## Phase 10 — Restore flow
Rebuild hero from collected fragments.

## Phase 11 — Mobile / accessibility
Portrait, touch, reduced motion, muted.

## Phase 12 — Polish
FX, pattern reactions, transitions.

## Phase 13 — Validation
Build, unit, browser, audio, visual review, performance.

---

# 51. REQUIRED AGENT ROLES

Use:

```text
mascot-coordinator
character-art-engineer
rig-engineer
interaction-engineer
audio-dsp-engineer
musical-interaction-designer
transition-choreographer
resonance-weaver-game-engineer
motion-director
performance-verifier
playtest-agent
```

If `resonance-weaver-game-engineer` does not exist, create it.

---

# 52. RESONANCE WEAVER AGENT

Create:

```text
.claude/agents/resonance-weaver-game-engineer.md
```

Suggested contents:

```markdown
---
name: resonance-weaver-game-engineer
description: Builds the in-hero Resonance Weaver physics game using DOM shadow proxies, falling hero fragments, player-created musical strings, bounce physics, collection, combo, restoration, responsive controls, and clean page recovery.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own the Resonance Weaver game modules and tests.

Requirements:

- preserve semantic DOM
- use snapshot proxy objects
- never measure DOM during game frames
- separate game-root physics from procedural character deformation
- bound fragment and string counts
- support muted play
- restore hero exactly
- no page reload
- no modal-style start screen
- test desktop and touch
```

---

# 53. FINAL REPORT

Create:

```text
docs/mascot/FINAL_V2_REPORT.md
```

Include:

- previous failure diagnosis
- new character anatomy
- facial matrix
- string interaction
- hero proxy system
- transition
- Resonance Weaver
- audio
- accessibility
- performance
- exact tests
- screenshots / recordings
- limitations

---

# 54. FINAL CLAUDE CODE PROMPT

Use this exact prompt:

```text
Read @FINAL_MASCOT_HERO_TO_GAME_REDESIGN_MASTER_SPEC_V2.md in full.

This V2 is the final direction and supersedes earlier visual/game directions
where they conflict.

Keep the current smooth procedural motion, drag behavior, guitar-string audio,
hero atmosphere and performance architecture. Do not keep polishing the
existing ribbon/comet body.

First redesign the mascot into a compact original Musical Signal Familiar with
a stable head, readable face, expressive fins/ears, short secondary tail,
body-local texture and a velocity-driven facial matrix. Eyes, eyelids, mouth,
head lean and squash/stretch must respond to velocity, falling, drag tension,
collision and string contact.

Second, make the mascot physically live in the real hero: perch on bars, slide
along safe lines, inspect selected UI elements, resist dragging into hard UI,
and strongly deform/play the existing guitar strings.

Third, remove the modal-style game transition. Implement a deliberate string
slingshot/snap interaction plus a visible accessible game trigger. At game
entry, snapshot selected hero DOM elements into Canvas shadow proxies, fade the
real DOM visually, and let the proxy letters/bars/dots fall into the same hero
space. Never continuously simulate semantic DOM nodes.

Build the final game as Resonance Weaver: the visitor steers the same character
and uses/creates a small number of temporary musical strings to bounce through
falling hero fragments, collect them, build musical combo, then restore those
fragments to their original hero positions. The game should feel like the hero
became playable, not like another screen opened.

Do not use a Start modal. Do not reload the page. Preserve muted gameplay,
reduced motion, mobile controls and semantic accessibility. Keep all proxies,
strings, particles and audio voices bounded. Do not read DOM geometry in the
game RAF.

Do not stop after planning. Work through the phases, delegate to project agents,
review their diffs, run the available type/lint/unit/browser/build/performance
checks, capture the visual states, and write docs/mascot/FINAL_V2_REPORT.md.
```

---

# END OF FINAL V2 SPEC
