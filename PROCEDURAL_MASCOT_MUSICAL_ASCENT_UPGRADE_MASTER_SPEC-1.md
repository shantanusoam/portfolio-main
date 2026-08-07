# PROCEDURAL MASCOT — CHARACTER, MUSICAL STRINGS, AND ASCENT GAME UPGRADE

> **Companion specification to:** `PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md`  
> **Working character name:** Chordling / Strumfin / Neon Familiar  
> **Working game name:** Strumrise  
> **Target stack:** Next.js, React, TypeScript, Canvas 2D, Web Audio API  
> **Optional after profiling:** AudioWorklet for plucked-string synthesis, PixiJS WebGL for rendering  
> **Primary outcome:** Turn the current particle ribbon into a cute, readable, textured procedural character that plays the homepage guitar strings and transitions into an original vertical musical ascent game.

---

# HOW TO USE THIS DOCUMENT

Place this file in the repository root beside:

```text
PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md
```

Then run Claude Code from the repository root and send:

```text
Read @PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md and
@PROCEDURAL_MASCOT_MUSICAL_ASCENT_UPGRADE_MASTER_SPEC.md in full.

Treat the first document as the architecture and performance foundation.
Treat the second document as the visual-character, musical-interaction,
and ascent-game upgrade specification.

Inspect the current implementation and git state before editing.
Do not stop after planning. Implement the work in gated phases, test it,
profile it, preserve unrelated code, and write the required reports.
```

This is an implementation specification, not a request for another brainstorm.

---

# MASTER DIRECTIVE

The current mascot has useful engineering:

- fixed-step procedural motion
- a 24-joint body
- second-order dynamics
- Verlet appendages
- a behavior state machine
- seeded wandering
- cached DOM obstacles
- a motion-lab route
- production lazy loading
- unit tests

However, the visible result does not yet communicate the intended character or reference quality.

The supplied screenshot reads as:

- a long particle smear or ribbon
- an unclear body silhouette
- a white circular anchor rather than a face
- uniform high-frequency cyan and magenta noise
- insufficient visual hierarchy
- no stable head, eyes, cheeks, mouth, ears, fins, paws, or expressive core
- no clear mass distribution
- no recognisable cute pose
- no visible squash, stretch, tumble, landing, or rebound performance
- no semantic relationship to the guitar strings
- no transition into the vertical game shown in the reference experience

The next implementation must not discard the procedural engine.

It must **art-direct the existing engine**.

The objective is to transform the character from:

```text
procedural simulation visualisation
```

into:

```text
original portfolio mascot + playable musical instrument + game avatar
```

Do not solve this by increasing the number of dots.

Do not solve this by adding more particle noise.

Do not solve this by copying the reference mascot.

Do not solve this by replacing the procedural system with a static sprite.

Build a stable, cute, original shape first. Use dots, texture, glow, and secondary particles as surface treatment around that shape.

---

# EXECUTION ORDER

```text
inspect current result
-> diagnose visual hierarchy
-> create a character appearance lab
-> establish a readable solid silhouette
-> add stable face and expression anchors
-> add local-space procedural skin
-> add layered dot treatment
-> tune motion around the new body
-> map homepage guitar strings
-> add visual string deformation
-> implement audio gesture gate
-> build a safe musical note system
-> add plucked-string sound
-> connect creature/string collisions to music
-> choreograph drop-to-game transition
-> build vertical ascent game
-> integrate musical progression
-> profile audio and graphics
-> test desktop, mobile, reduced motion, and mute
-> document and ship
```

Do not begin the full game before the character is readable in the appearance lab.

Do not begin custom AudioWorklet DSP before a simple musical prototype proves the interaction is fun.

Do not activate audio before a user gesture.

---

# RESEARCH-BACKED PLATFORM RULES

## Audio must be explicitly activated

Browsers commonly block audible Web Audio until the user has interacted with the page. Create or resume the `AudioContext` from a user gesture and expose a clear sound control.

Required behavior:

```text
initial state: silent and suspended
first valid click/tap/key interaction: initialize or resume audio
mute control: always available
hidden tab: suspend or reduce audio
return to visible tab: resume only when appropriate
```

References:

- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay

## Use the audio clock for musical timing

Do not use visual frame timestamps as the source of truth for note timing.

Schedule notes and parameter changes against:

```ts
audioContext.currentTime
```

Use a short look-ahead scheduler for rhythms, sequences, and game-generated phrases.

References:

- https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime
- https://web.dev/articles/audio-scheduling
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques

## Use AudioWorklet only for justified custom DSP

An `AudioWorkletProcessor` runs on the Web Audio rendering thread. It is the correct platform for custom real-time synthesis after a simple prototype proves the feature.

Do not run a sample-by-sample plucked-string loop in the React render path or visual animation loop.

References:

- https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet

AudioWorklet requires a secure context in supporting browsers.

## Use Web Audio automation for envelopes

Use `AudioParam` scheduling for:

- gain envelopes
- filter cutoff
- pitch bends
- mute damping
- effect sends
- transitions

References:

- https://developer.mozilla.org/en-US/docs/Web/API/AudioParam
- https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime

## Protect the master output

Multiple simultaneous notes can clip.

Use a master gain and a conservative compressor or limiter-style safety stage.

Reference:

- https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode

## Reverb must be optional and bounded

A `ConvolverNode` can apply impulse-response reverb, but convolution should not be mandatory for low-quality mode.

Reference:

- https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode

## Plucked-string synthesis direction

The Karplus–Strong method is a compact digital-waveguide-style approach that starts from a short noise excitation and recirculates it through a damped delay/filter loop. It is suitable as a research direction for an original synthetic guitar-like voice.

References:

- Karplus and Strong, “Digital Synthesis of Plucked-String and Drum Timbres,” 1983
- https://crypto.stanford.edu/~blynn/sound/karplusstrong.html

Do not claim that a basic Karplus–Strong loop perfectly models a real guitar.

## Canvas can create procedural internal texture

Canvas supports retained paths, repeated patterns, and compositing masks.

Use these to attach texture to a stable silhouette.

References:

- https://developer.mozilla.org/en-US/docs/Web/API/Path2D
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createPattern
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation

## Keep heavy browser systems lazy

Use `next/dynamic` for browser-only Client Components and optional heavy libraries. When using `ssr: false`, declare the dynamic import inside a Client Component.

Reference:

- https://nextjs.org/docs/app/guides/lazy-loading

---

# NON-GOALS

Do not:

- copy the reference character
- copy another game's art or level layout
- generate external image assets in this phase
- use AI image generation for the character
- add a heavy 3D engine
- turn particles into DOM nodes
- play sound without consent
- make the musical interaction random and dissonant
- simulate every string point with expensive full physics
- make the game impossible to exit
- obscure navigation or portfolio text
- force game mode on visitors
- ship DSP without a fallback
- use visual frame timing for musical scheduling
- make character texture swim in world space
- add thousands of dots to hide a weak silhouette

---

# HIGH-LEVEL CREATIVE VISION

The mascot should become a **small musical creature made of signal, velvet, confetti, and starlight**.

It is not a snake.

It is not a particle trail.

It is not a realistic fish.

It should read as a compact creature with:

- a clear head
- a soft body
- a tapering tail
- two expressive side fins or ears
- one or two stable eyes
- optional cheeks
- a small mouth or core
- a recognisable resting pose
- a recognisable falling pose
- a recognisable bounce pose

The procedural spine remains inside the character.

The user should not perceive the spine as the final artwork.

The guitar strings become:

- environmental objects
- musical instruments
- elastic platforms
- game triggers
- level geometry
- narrative elements

The vertical game should feel hidden inside the homepage.

---

# WORKING NAMES

Character:

- Chordling
- Strumfin
- Ampy
- Gliss
- Plucklet
- Signal Manta
- Lattice Koi
- Resonance Familiar

Game:

- Strumrise
- Fretfall
- Chord Climber
- Resonance Run
- Harmonic Ascent
- Up the Neck
- Stringbound
- Scale Runner

Use one coherent identity after testing.

---

# CORE EXPERIENCE LOOP

```text
visitor arrives
-> mascot is dormant or gently alive
-> visitor moves pointer
-> mascot follows and investigates
-> visitor activates sound
-> mascot touches or crosses a guitar string
-> string visibly bends
-> a plucked note sounds
-> fast movement across several strings creates a strum
-> a deliberate downward drop gesture activates the game gate
-> mascot tumbles and lands
-> vertical ascent game begins
-> every landing builds music
-> ascent changes harmony and visual atmosphere
-> failure returns mascot to homepage gracefully
-> completion produces a short musical resolution
```

The homepage must still work when the visitor ignores the mascot.


---

# PRIMARY DESIGN PROBLEMS TO FIX

## Problem 1: no stable silhouette

The current particle field creates a noisy outline. The shape changes too much between frames and reads as a brush stroke.

Required solution:

- render an underlying body silhouette
- keep face anchors stable
- use dots as a skin layer
- preserve a clear head-to-body ratio
- cap tail length visually
- reduce dot density near the outer edge
- use a controlled rim instead of random edge noise

## Problem 2: texture is not attached to the creature

If colour noise is generated in world space, it appears to swim through the body.

Required solution:

- define body-local coordinates
- give every texture point a stable longitudinal and lateral coordinate
- deform those coordinates with the rig
- generate spots, stripes, freckles, and symbols from stable local seeds
- make all pattern motion come from rig deformation, not changing random values

## Problem 3: no visual hierarchy

Cyan, magenta, white, and black currently compete equally.

Use this hierarchy:

```text
1. silhouette and face
2. primary body colour
3. secondary printed pattern
4. rim light
5. sparse structural dots
6. temporary interaction particles
```

## Problem 4: no cute facial performance

A single white circle does not establish character.

Required solution:

- add stable eye anchors
- add eyelids
- add a mouth, nose, or luminous core
- add cheeks only in selected states
- make gaze lead movement
- blink sparsely and intentionally
- never scatter facial features independently during ordinary movement

## Problem 5: movement is continuous but not performed

The creature follows paths but does not visibly anticipate, land, react, or recover.

Required solution:

- add pose states
- add squash and stretch
- add rotation and tumble during drops
- add impact emphasis
- add facial reaction
- add fin and tail follow-through
- add recovery and settling

## Problem 6: guitar strings are decorative only

Required solution:

- register strings as physical and musical entities
- simulate local displacement
- map contacts to notes
- quantize harmony
- add visual and audio feedback
- reuse strings as game platforms

## Problem 7: the game is absent

Required solution:

- add an explicit drop-to-play transition
- build a separate state and camera
- reuse the mascot rig and renderer
- convert strings into ascending platforms
- make every successful landing part of a melody

---

# CHARACTER APPEARANCE LAB

Create a dedicated route or extend the current motion lab with a focused appearance tab:

```text
/motion-lab?panel=appearance
```

The appearance lab must isolate character art from homepage complexity.

Required controls:

- solid silhouette on/off
- dot skin on/off
- internal print on/off
- rim light on/off
- structural dots on/off
- face on/off
- expression
- body profile
- head scale
- tail length
- fin or ear scale
- eye spacing
- eye scale
- cheek scale
- mouth shape
- palette
- pattern recipe
- dot density
- dot size
- pattern scale
- pattern contrast
- body opacity
- rim width
- glow intensity
- tumble
- squash
- stretch
- turn
- landing impact
- reduced-motion preview
- 96-pixel preview
- light background
- dark background
- screenshot mode

Add presets:

```text
Cute Bean
Signal Manta
Velvet Comet
Lattice Koi
Circuit Catfish
Constellation Wisp
```

Do not allow a preset to change engine architecture.

Presets are configuration recipes.

---

# CHARACTER SILHOUETTE REDESIGN

The current long tapered body is too dominant.

Use a compact three-zone silhouette.

```text
head and face zone
soft torso zone
tail and propulsion zone
```

Suggested proportions:

```text
head length: 25% to 32%
torso length: 38% to 48%
tail length: 25% to 38%
maximum width near head/torso boundary
tail visually thinner but not longer than the rest of the character by several times
```

The character should remain readable when:

- moving quickly
- rotating
- squashing
- viewed at 96 pixels
- dot layer disabled
- reduced-motion mode active

## Recommended body construction

Build the base body from multiple rig-attached implicit shapes:

- head ellipse or rounded capsule
- torso ellipse
- shoulder or fin capsules
- tail capsule chain
- optional ear or antenna capsules

Do not render the final body as only a polyline expanded by one radius.

Use a stable contour generator.

Possible Canvas-first implementation:

1. calculate left and right body rails from spine normals
2. build a closed `Path2D`
3. use quadratic or cubic curves through the rails
4. close around the head and tail
5. cache reusable topology
6. update only point coordinates each frame
7. fill the shape as the base silhouette

If `Path2D` rebuilding becomes a measurable cost, use direct context paths or a simpler body mesh.

Do not assume retained paths are automatically faster. Profile.

---

# CUTE DESIGN RULES

The character should look cute through proportion and performance, not through copied details.

Use:

- a relatively large head
- eyes that remain visible at small sizes
- rounded body transitions
- short facial feature distances
- small mouth
- soft landing deformation
- curious head tilt
- occasional asymmetric blink
- fins or ears that react after the head
- a tail that curls during rest
- slow breathing when idle

Avoid:

- many tiny facial details
- thin unreadable limbs
- hyperactive blinking
- constant smile
- large white orb with no surrounding face structure
- eyes sliding independently around the body
- excessive particle explosions
- random expression changes

## Stable face frame

Define a local face coordinate system from:

- head center
- head forward tangent
- head normal
- head width
- head height

All face elements use this frame.

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

Eye positions must be derived from this frame, not from world-space offsets.

## Gaze

Gaze follows:

- movement direction during sprint
- pointer during follow
- interest target during inspect
- next landing platform during game
- downward direction during fall
- upward direction near a jump apex

Clamp pupil travel.

Use second-order smoothing for gaze.

## Blink system

Use deterministic state-aware blinking.

Rules:

- no blink during a high-impact contact frame
- blink after a landing recovery
- squint during sprint
- wide eyes during fall
- relaxed eyelids during rest
- avoid a perfectly fixed blink interval

Use seeded timing with bounded randomness.

---

# APPEARANCE RENDER PIPELINE

Render in this order:

```text
1. soft shadow or grounding aura
2. base silhouette
3. internal base gradient
4. clipped procedural print
5. clipped secondary spots or marks
6. sparse structural dots
7. edge rim
8. face
9. highlights
10. temporary particles
11. debug overlays
```

Do not render all layers in every quality mode.

Suggested quality behavior:

```text
reduced:
  base silhouette + face

low:
  base silhouette + one flat print + face + simple rim

medium:
  full print + sparse dots + rim + restrained particles

high:
  denser print + secondary highlights + richer particles
```

---

# BASE BODY COLOUR

Use one dominant body colour.

Recommended palette families:

## Night Candy

```text
base: deep violet
highlight: warm lavender
print A: cyan
print B: hot pink
face: cream
shadow: ink blue
```

## Deep Sea Toy

```text
base: teal-black
highlight: mint
print A: coral
print B: lilac
face: pale aqua
shadow: navy
```

## Signal Plush

```text
base: graphite
highlight: pearl
print A: electric green
print B: electric blue
face: warm white
shadow: black-purple
```

Do not use saturated cyan and magenta at equal density over the entire body.

One colour should dominate.

One colour should support.

One colour should accent.

---

# LOCAL-SPACE PROCEDURAL PRINT

The internal print is the most important visual upgrade.

Use a stable body-space coordinate system:

```ts
interface SkinCoordinate {
  u: number; // head to tail, 0 to 1
  v: number; // left to right, -1 to 1
}
```

Every pattern sample retains its `u`, `v`, seed, colour role, scale, and layer.

At runtime:

1. evaluate the spine position at `u`
2. evaluate the local normal
3. evaluate body half-width
4. place the sample at `normal * v * width`
5. apply body deformation
6. render

The print should remain attached during:

- turning
- stretching
- squashing
- tumbling
- landing
- game bouncing

## Pattern recipes

Implement several original procedural recipes.

### 1. Terrazzo Confetti

- medium irregular blobs
- low total coverage
- stable local seeds
- two accent colours
- varied rotation
- no frame-to-frame randomness

### 2. Constellation Freckles

- sparse bright points
- a few short connecting lines
- increased density near shoulders
- reduced density near face
- pulse gently with breathing

### 3. Circuit Garden

- short local-space traces
- rounded junction nodes
- asymmetric internal route while external body stays symmetric
- occasional animated signal pulse

### 4. Soft Stripes

- broad curved bands across `v`
- distorted by spine curvature
- low contrast
- useful for showing deformation

### 5. Musical Scales

- tiny abstract marks based on note intervals
- marks become brighter when strings are played
- avoid literal copyrighted logos or notation assets
- use simple dots, bars, crescents, and diamonds

### 6. Velvet Speckles

- small low-contrast noise
- sparse high-contrast glints
- creates plush depth
- no high-frequency static everywhere

---

# TEXTURE IMPLEMENTATION OPTIONS

## Option A: Direct local-space primitives

Best initial option.

Generate a bounded list of:

- circles
- capsules
- triangles
- rounded rectangles
- short curves

Deform and draw them with the body.

Advantages:

- fully procedural
- stable
- art-directable
- no external assets
- easy quality control

## Option B: Offscreen pattern canvas

Create a small procedural pattern once.

Use `createPattern()` and a local transform.

Clip it into the body through:

- `context.clip(bodyPath)`
- or compositing with `source-in`

Use only when the pattern transformation remains attached to the body.

A world-space repeating pattern is not acceptable.

## Option C: Dot-skin points

Keep the existing dot system but reduce it to a sparse surface layer.

Dots should:

- reinforce form
- cluster around highlights
- follow local coordinates
- vary in scale
- leave the face clear
- reduce near the outer silhouette
- avoid a noisy, crawling outline

## Option D: Pixi shader

Gate this behind profiling.

A future shader can evaluate:

- body-local pattern coordinates
- signed-distance edge band
- animated signal pulses
- colour mixing
- impact ripple

Do not introduce it before the Canvas design is approved.

---

# EDGE AND RIM DESIGN

The current edge is created by noisy dots.

Replace it with a stable rim.

Options:

- draw body shape with a wider dark stroke behind the fill
- draw a narrow light stroke on the illuminated side
- create an offset highlight along selected body rail
- use a low-opacity additive glow only in medium and high quality

The rim must:

- preserve small-size readability
- not become a neon tube
- not use a large expensive blur each frame
- remain thinner near the face
- react subtly to sound and impact

---

# STRUCTURAL DOTS

Structural dots can remain part of the identity.

Use them for:

- selected spine points
- fin joints
- circuit nodes
- string contact points
- temporary music pulses
- game combo feedback

Do not render every joint as an equally bright white dot.

Use:

```text
primary core node: strongest
face highlights: strong
shoulder nodes: medium
tail nodes: subtle
debug spine nodes: development only
```

---

# EXPRESSIONS

Required expressions:

```ts
type MascotExpression =
  | "neutral"
  | "curious"
  | "happy"
  | "focused"
  | "surprised"
  | "squint"
  | "sleepy"
  | "dizzy"
  | "determined";
```

Map expressions to state:

```text
dormant -> sleepy
wake -> surprised
follow -> curious
inspect -> focused or curious
sprint -> squint
fall -> surprised
landing -> compressed/dizzy for a brief moment
game combo -> happy
game danger -> determined
rest -> sleepy
```

Keep transitions smooth.

Do not change expressions every few frames.

---

# SQUASH, STRETCH, AND TUMBLE

Add body deformation parameters:

```ts
interface BodyDeformation {
  longitudinalScale: number;
  lateralScale: number;
  headSquash: number;
  tailStretch: number;
  finSpread: number;
  impactWave: number;
  tumbleRotation: number;
}
```

## Fall

- body lengthens slightly
- fins lift
- eyes widen
- tail points upward with lag
- slow rotation begins only after a threshold

## Landing

- longitudinal scale decreases
- lateral scale increases
- eyes compress
- fins flatten
- string bends
- impact wave travels from contact point toward head and tail
- recovery overshoots once

## Launch or bounce

- anticipation compresses
- upward stretch follows
- tail leaves string last
- face looks toward next target

## Tumble

Tumble should not spin constantly.

Use:

- controlled quarter or half rotations
- velocity-dependent rotation
- damping near landing
- face remains attached to head
- motion readable at normal size

---

# CHARACTER ART ACCEPTANCE TESTS

The character appearance phase passes only when:

- silhouette is readable with dots disabled
- face is readable at 96 pixels
- the head is unmistakable
- the tail does not dominate the entire frame
- texture stays attached during hard turns
- cyan and magenta no longer create uniform visual static
- at least three pattern recipes are meaningfully different
- reduced mode still looks like the same character
- landing pose reads clearly in a still image
- fall pose reads clearly in a still image
- rest pose reads clearly in a still image
- no external generated image asset is required


---

# HOMEPAGE GUITAR STRING SYSTEM

The horizontal guitar strings on the homepage should become first-class interactive entities.

Do not treat them as generic obstacle rectangles.

Each string needs:

- a visual line or curve
- physical rest position
- thickness
- interaction radius
- note identity
- musical role
- displacement state
- velocity state
- damping
- cooldown
- last pluck time
- current energy
- optional fret or harmonic zones

Suggested data:

```ts
interface MusicalString {
  id: string;
  index: number;
  start: Point;
  end: Point;
  restY: number;
  note: MusicalNote;
  role: "bass" | "mid" | "treble";
  thickness: number;
  interactionRadius: number;
  displacement: Float32Array;
  previousDisplacement: Float32Array;
  damping: number;
  stiffness: number;
  energy: number;
  lastPluckTime: number;
  cooldownMs: number;
  enabled: boolean;
}
```

The actual representation may be simpler if the current strings are DOM or SVG elements.

Inspect existing implementation first.

---

# STRING COORDINATE AND REGISTRATION

Add explicit markup when strings are DOM elements:

```tsx
<div
  data-musical-string="E2"
  data-string-index="0"
  data-string-role="bass"
/>
```

Or maintain a known Canvas/hero geometry adapter.

Create:

```text
lib/mascot/music/StringRegistry.ts
```

Responsibilities:

- discover or receive string geometry
- cache endpoints
- track viewport changes
- expose closest-point queries
- expose intersection or crossing events
- map DOM coordinates to mascot world coordinates
- avoid layout reads inside RAF
- invalidate on resize and section changes

Do not query the DOM every frame.

---

# VISUAL STRING PHYSICS

The string must visibly respond when the character touches or crosses it.

Do not simulate a full high-resolution wave equation unless profiling proves it necessary.

Start with a modal or segmented approximation.

## Option A: damped control points

Use 9 to 17 points per string.

Endpoints remain pinned.

Every internal point stores:

- displacement
- velocity

Update with:

```text
spring force from left neighbour
+ spring force from right neighbour
+ restoring force to rest
- damping
```

Render a smooth curve through points.

Advantages:

- simple
- readable
- enough for the homepage
- easy to couple to character contact

## Option B: modal string approximation

Represent a string with a few sine modes:

```text
mode 1: fundamental
mode 2: second harmonic
mode 3: third harmonic
```

A pluck adds energy to modes based on contact position.

Evaluate:

```ts
y(x, t) =
  amplitude1 * sin(pi * x) +
  amplitude2 * sin(2 * pi * x) +
  amplitude3 * sin(3 * pi * x);
```

Decay every amplitude separately.

Advantages:

- extremely cheap
- visually smooth
- naturally string-like
- contact position affects shape

Use this option if multiple strings and mobile performance are priorities.

## String pluck position

Normalize contact position:

```ts
const pluckPosition =
  clamp((contactX - string.start.x) / stringLength, 0, 1);
```

Use it to alter:

- visual mode amplitudes
- timbre brightness
- stereo pan
- harmonic emphasis
- optional pitch bend

## Character force

Map character motion to string energy:

```ts
impact =
  normalVelocity * massFactor +
  tailVelocity * tailFactor +
  sprintBonus;
```

Clamp impact.

Do not allow extreme velocity to create extreme volume.

---

# CONTACT DETECTION

A string crossing event is not the same as continuous overlap.

Track signed distance from the relevant mascot contact point to the string.

A crossing occurs when:

```text
previous signed distance and current signed distance have opposite signs
AND the projected point lies within string endpoints
AND normal speed exceeds minimum threshold
AND cooldown has expired
```

Use swept motion to avoid missing fast contacts.

Possible contact points:

- body core
- tail tip
- left fin
- right fin
- game feet or landing point

Different contacts create different musical articulation.

## Contact articulation

```text
core crossing -> normal pluck
tail crossing -> soft brush or arpeggio
fin crossing -> harmonic ping
hard landing -> strong bass pluck
slow drag along string -> muted scrape or tremolo
rapid crossing of several strings -> strum
```

Do not trigger a note every frame while overlapping.

Use hysteresis and per-contact cooldown.

---

# MUSICAL DESIGN GOAL

The visitor should be able to make pleasing sound without musical training.

The system should not produce arbitrary chromatic chaos.

Use two layers:

```text
physical string identity
+
harmonic director
```

The physical strings provide tactile consistency.

The harmonic director keeps the result musically coherent.

---

# STRING TUNING MODES

Implement at least two modes.

## Mode A: Guitar mode

Use a six-string guitar-inspired mapping:

```text
E2
A2
D3
G3
B3
E4
```

This mode is direct and recognisable.

## Mode B: Portfolio harmony mode

Map strings to scale degrees rather than fixed guitar tuning.

Example in a pentatonic scale:

```text
root
fifth
octave
minor or major third
second octave fifth
colour tone
```

This mode makes random interaction more consonant.

Use portfolio harmony mode by default if the visual string order or count does not match a real guitar.

## Optional section harmonies

Each portfolio section may own a harmonic colour:

```text
hero -> suspended/open chord
about -> warm major or modal chord
experience -> driving minor pentatonic
projects -> brighter layered harmony
contact -> resolved home chord
```

Do not abruptly retune a sounding string.

Schedule harmonic changes at safe boundaries or after decay.

---

# NOTE EVENT MODEL

Define a semantic note event before creating audio nodes.

```ts
interface StringPluckEvent {
  stringId: string;
  stringIndex: number;
  contactType: "core" | "tail" | "fin" | "landing" | "drag";
  contactPosition: number;
  velocity: number;
  direction: -1 | 1;
  worldX: number;
  worldY: number;
  gameMode: boolean;
  combo: number;
  timestamp: number;
}
```

The musical director converts this into:

```ts
interface MusicalEvent {
  midiNote: number;
  frequency: number;
  velocity: number;
  brightness: number;
  damping: number;
  pan: number;
  reverbSend: number;
  articulation: "pluck" | "harmonic" | "muted" | "strum" | "bass";
  scheduledTime: number;
}
```

Keep physical collision independent from DSP implementation.

---

# AUDIO ACTIVATION UX

Add a small, tasteful control:

```text
Sound Off
Sound On
```

Or a musical icon with accessible text.

Before activation:

- visual strings still move
- no sound plays
- the first string contact may show a small “tap to hear strings” hint
- hint disappears after activation or dismissal

Activation sources:

- clicking sound control
- tapping the mascot with a clear audio affordance
- pressing a documented keyboard key

Do not silently treat pointer movement as audio consent.

Persist mute preference only.

Do not persist an active `AudioContext`.

---

# AUDIO ARCHITECTURE

Create:

```text
lib/mascot/music/
  AudioDirector.ts
  AudioGestureGate.ts
  AudioScheduler.ts
  StringRegistry.ts
  StringContactDetector.ts
  MusicalDirector.ts
  HarmonyMap.ts
  NoteQuantizer.ts
  VoicePool.ts
  PluckVoice.ts
  KarplusStrongVoice.ts
  EffectsBus.ts
  MusicTelemetry.ts
```

Optional worklet:

```text
public/
  audio-worklets/
    karplus-strong-processor.js
```

Or use a build-supported TypeScript worklet pipeline if the repository already has one.

Do not assume Next.js automatically bundles an AudioWorklet module correctly.

Test production paths.

---

# AUDIO GRAPH

Recommended graph:

```text
individual voice
-> voice gain
-> voice filter
-> dry bus
-> master compressor
-> master gain
-> destination

individual voice
-> optional reverb send
-> convolver or lightweight reverb
-> reverb gain
-> master compressor
```

Rules:

- conservative master level
- no sound should be painfully loud
- cap simultaneous voices
- use short notes by default
- low mode disables convolution
- reduced motion does not automatically imply mute, but sound remains opt-in
- hidden tab suspends or silences nonessential audio
- game pause suspends sequencing

---

# AUDIO PROTOTYPE LADDER

Do not jump directly to custom DSP.

## Prototype 1: oscillator and noise pluck

Use built-in nodes:

- short noise or oscillator excitation
- gain envelope
- low-pass filter
- optional short delay
- compressor

Goal:

- validate note mapping
- validate string contact
- validate timing
- validate volume
- validate user gesture

This is temporary.

## Prototype 2: pre-rendered procedural pluck buffers

Use `OfflineAudioContext` to render a small set of original pluck buffers at startup after sound activation.

Possible benefits:

- stable CPU use
- no external sound assets
- consistent fallback
- easy voice pooling

Do not render hundreds of buffers.

Render a small pitch set and use controlled playback rate only within an acceptable range.

## Prototype 3: AudioWorklet physical model

Implement Karplus–Strong-style voices only after prototypes 1 and 2 prove the interaction.

The processor may support:

- frequency
- excitation brightness
- damping
- loss
- pick position
- mute
- pitch bend
- voice ID

Do not send high-frequency messages from the visual RAF.

Send discrete pluck and parameter events.

---

# KARPLUS–STRONG IMPLEMENTATION REQUIREMENTS

A basic voice uses:

- a circular delay buffer
- seeded noise excitation
- fractional or rounded delay length
- low-pass feedback
- loss factor
- gain envelope
- finite lifetime

Conceptual loop:

```text
excitation fills delay
output reads delay
next sample is filtered combination of delayed samples
filtered sample is written back
energy decays
```

Required protections:

- clamp frequency
- clamp delay length
- clamp feedback
- stop silent voices
- reset reused buffers
- no allocation inside `process()`
- fixed maximum polyphony
- deterministic test mode
- avoid denormal performance problems
- no console logging in audio render thread
- return `false` when a voice or processor can terminate when architecture permits

A simple implementation is acceptable.

Do not spend weeks pursuing acoustic realism.

The desired sound is:

```text
cute synthetic pluck
+
small toy guitar
+
digital constellation
```

---

# VOICE POOL AND POLYPHONY

Suggested limits:

```text
homepage low quality: 4 voices
homepage medium: 8 voices
homepage high: 12 voices
game low: 6 voices
game medium/high: 12 to 16 voices
```

Use voice stealing.

Steal in this order:

1. quiet released voice
2. oldest quiet voice
3. oldest voice
4. never exceed hard cap

Avoid creating and abandoning large audio graphs per contact.

Disconnect completed nodes.

---

# AUDIO SCHEDULER

For direct plucks caused by immediate contact:

- schedule at `audioContext.currentTime + smallSafetyOffset`
- use a tiny offset to avoid scheduling in the past
- preserve responsiveness

For arpeggios, combos, and game phrases:

- use look-ahead scheduling
- maintain a queue
- use the audio clock
- allow tempo changes
- do not schedule too far ahead

Initial scheduler values may start near:

```text
lookahead interval: 20 to 30 ms
schedule-ahead window: 80 to 120 ms
```

Tune through real profiling.

Visual effects should use queued note timestamps and compare them to the audio clock where synchronization matters.

---

# MUSICAL SAFETY SYSTEM

Create a `MusicalDirector`.

Responsibilities:

- current key
- current scale
- current chord
- string mapping
- note quantization
- repetition avoidance
- phrase memory
- combo resolution
- intensity
- section transition
- game progression

## Quantization

When physical tuning is not strict guitar mode:

```ts
function quantizeToScale(
  requestedMidi: number,
  scale: readonly number[],
  root: number,
): number
```

Choose nearest allowed note.

Add register limits.

## Repetition control

Avoid:

- the same note retriggering rapidly from jitter
- all strings triggering at once from one collision bug
- endless high notes
- excessive bass overlap

Use:

- note cooldown
- contact cooldown
- repeated-note velocity reduction
- phrase-level variety
- voice limit

## Strum recognition

A strum is a sequence of string crossings:

```text
three or more distinct strings
within a short time window
with consistent crossing direction
```

Then:

- preserve note order
- schedule a tight arpeggio
- add a small chord glow
- increment a musical combo
- avoid separately blasting all collision sounds at full volume

## Chord completion

When the visitor plays a recognised set:

- create a gentle resolved chord
- show a short constellation connection
- let mascot react happily
- do not open game mode automatically

---

# STRING TIMBRE MAPPING

Map physical variables to bounded timbre parameters.

```text
normal velocity -> loudness
contact position -> brightness / pick position
crossing direction -> stereo or arpeggio direction
tail contact -> softer attack
fin contact -> harmonic emphasis
landing -> low-frequency body resonance
combo -> reverb send and brightness
```

Clamp all mappings.

Do not map speed linearly to raw gain.

Use perceptual curves.

Example:

```ts
velocity =
  Math.pow(clamp(normalSpeed / speedReference, 0, 1), 0.6);
```

---

# AUDIO EFFECTS

Use effects sparingly.

## Filter

A low-pass or band-pass filter can shape:

- muted contacts
- distance
- game danger
- section colour

## Reverb

Use a short original impulse or procedurally generated impulse.

Do not download an unlicensed impulse response.

Low quality may use:

- no reverb
- or a lightweight delay network

## Compression

Use conservative settings.

Do not master the site like a loud commercial track.

## Stereo

Pan by contact position, but keep the centre stable.

Avoid extreme hard-panning on headphones.

---

# AUDIO ACCESSIBILITY AND CONTROL

Required controls:

- mute
- volume
- sound activation status

Optional:

- reduced audio intensity
- musical mode selection
- authentic guitar mode
- harmony mode

Keyboard:

- provide a key for sound toggle only if documented
- do not steal keys from forms
- game keyboard controls must be shown

Store:

- mute preference
- volume preference if added

Do not store:

- audio context state
- current voice graph
- arbitrary permissions

---

# HOMEPAGE MUSICAL INTERACTION IDEAS

Implement a restrained subset first.

## 1. Tail strum

The tail crosses multiple strings and creates an ordered arpeggio.

## 2. Belly bounce

The body lands on a string and creates a low, warm note.

## 3. Fin harmonic

A fin tip creates a quieter octave or harmonic.

## 4. String drag

Slow movement along a string creates a muted, filtered tremolo.

Use a strong cooldown.

## 5. Chord constellation

Playing a valid chord connects temporary glowing points around the character.

## 6. Section motif

Each portfolio section changes the available harmonic colour.

## 7. Call and response

The visitor strums.

The mascot replies with a tiny two-note phrase after a short delay.

Use sparingly and only after sound activation.

## 8. Sleep lullaby

When idle for a long time, the character rests near a string and produces an extremely quiet optional harmonic pulse.

Disable by default if it risks surprising the visitor.

## 9. Scroll glissando

Fast scroll produces visual string motion and a subtle filtered glissando only when sound is enabled.

Do not tie every scroll event to a note.

## 10. Secret chord

A particular intentional string sequence unlocks the game portal or special animation.

Provide another accessible route to the game.

---

# STRING SYSTEM ACCEPTANCE TESTS

The homepage musical phase passes when:

- sound never starts without activation
- mute is always available
- one crossing creates one note
- resting overlap does not retrigger
- fast motion does not miss crossings
- multiple strings can form a strum
- notes remain musical
- master output does not clip audibly
- voice count remains capped
- strings visibly deform
- deformation settles
- visuals still work while muted
- low quality remains smooth
- hiding the tab does not leave a runaway scheduler
- production AudioWorklet path works when used
- a non-worklet fallback exists


---

# DROP-TO-GAME TRANSITION

The game should feel discovered through character motion, but it must not activate accidentally.

Use an explicit, readable game gate.

## Preferred trigger: deliberate drop gesture

The visitor:

1. engages the mascot
2. drags or guides it downward
3. crosses a visible threshold or sound-hole-like gate
4. releases with sufficient downward intent
5. receives a short transition cue
6. enters game mode

Possible affordance:

```text
Drop to play
```

Display only after the visitor has interacted with the mascot.

## Alternative triggers

- click a small “Play Strumrise” control
- perform a secret chord
- press a documented key
- tap an accessible game-launch button
- drag the mascot through the lowest string

Always provide a visible accessible trigger.

Do not require a secret gesture.

## Trigger conditions

Example:

```ts
interface GameGateCondition {
  pointerReleased: boolean;
  downwardVelocity: number;
  crossedGate: boolean;
  characterInsideSafeRegion: boolean;
  audioDecisionKnown: boolean;
  cooldownExpired: boolean;
}
```

The gate should not activate from normal scroll.

The gate should not activate when the user clicks a navigation control.

---

# TRANSITION CHOREOGRAPHY

The transition is central to matching the emotional quality of the reference.

It must include:

```text
anticipation
drop
tumble
string contacts
landing
camera reframe
game reveal
```

## Step 1: anticipation

- mascot looks downward
- fins or ears lift
- body compresses
- guitar strings dim except the target string
- optional “drop to play” pulse

## Step 2: release

- input detaches
- root becomes gravity-driven
- body stretches
- tail lags
- eyes widen
- sound remains silent if not activated

## Step 3: string cascade

As the mascot falls through strings:

- every crossing bends a string
- each enabled crossing plays one note
- notes descend or ascend according to direction
- contacts are time-ordered
- colour pulses travel along strings
- the body rotates in controlled increments

## Step 4: final landing

- target platform or thick string catches the mascot
- platform bends
- mascot squashes
- face reacts
- impact wave travels through body
- music resolves
- camera begins transition

## Step 5: page-to-game morph

Options:

### Overlay expansion

- Canvas layer expands
- portfolio content darkens but remains underneath
- game HUD fades in
- new platforms appear from existing strings

### Portal reveal

- a sound hole or circular portal opens
- mascot falls through
- game scene loads in a separate overlay

### Section transformation

- hero strings detach from layout
- they become world-space game platforms
- background shifts to an abstract fretboard/space environment

Preferred initial approach:

```text
full-screen overlay expansion
```

It is easier to make stable and accessible.

## Step 6: game ready

- show controls briefly
- pause until first input when necessary
- provide exit
- preserve mute state
- do not replay a long intro after every retry

---

# GAME CONCEPT: STRUMRISE

Build an original vertical auto-bounce ascent game.

The mascot automatically rebounds from strings and platforms.

The player controls horizontal movement and limited air influence.

Every landing generates part of a musical phrase.

The objective is to climb through a changing instrument-world while maintaining rhythm, harmony, and momentum.

This is not a clone of an existing vertical jumper.

Distinctive identity:

- strings are platforms
- notes are gameplay
- chords create powers
- musical phrases control the environment
- the character’s procedural body deforms on every bounce
- missed notes and muted strings alter the route
- the homepage’s visual language becomes the game world

---

# GAME STATES

```ts
type AscentGameState =
  | "inactive"
  | "transitioningIn"
  | "ready"
  | "playing"
  | "paused"
  | "fallingOut"
  | "gameOver"
  | "sectorComplete"
  | "victory"
  | "transitioningOut";
```

Game mode must not reuse homepage behavior conditions in an uncontrolled way.

Create a dedicated controller.

---

# GAME INPUT

Desktop:

- left/right arrows
- A/D
- pointer horizontal steering
- P or Escape for pause
- Enter or Space for start/retry when not conflicting
- optional action button for a special ability

Touch:

- drag left or right
- or left/right screen zones
- large pause button
- large special-action button when added

Input requirements:

- no page scroll while interacting with game canvas
- no accidental browser gestures in game area
- proper cleanup on exit
- input buffering for brief transitions
- no hidden controls

---

# PLAYER MOVEMENT

Use auto-bounce vertical movement.

Core variables:

```ts
interface AscentPlayerState {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  velocityX: number;
  velocityY: number;
  groundedStringId: string | null;
  coyoteTimer: number;
  inputX: number;
  combo: number;
  lives: number;
  energy: number;
  invulnerableTimer: number;
}
```

Movement:

- gravity
- maximum fall speed
- horizontal acceleration
- horizontal drag
- limited air control
- automatic bounce on valid landing
- stronger bounce from powered strings
- weak bounce from muted strings

Do not use the mascot’s second-order pointer target as the game physics root.

The game root uses explicit velocity integration.

The procedural rig follows the game root.

This separation is mandatory.

---

# LANDING DETECTION

Use swept vertical collision.

A landing is valid when:

- player was above the string or platform in previous step
- player crosses the platform top during current step
- vertical velocity is downward
- horizontal footprint overlaps the platform
- platform is active
- collision is not on cooldown

Resolve:

- move root to contact
- set bounce velocity
- trigger deformation
- trigger string displacement
- emit note event
- update combo
- set grounded reference briefly

Do not resolve upward collision as a landing.

Do not allow tunnelling at high fall speed.

---

# GAME PLATFORMS

The primary platform is a string.

Platform types:

```ts
type StringPlatformKind =
  | "normal"
  | "bass"
  | "treble"
  | "harmonic"
  | "muted"
  | "slide"
  | "moving"
  | "fading"
  | "split"
  | "chord"
  | "boost"
  | "rest";
```

## Normal

- standard bounce
- one scale note
- stable

## Bass

- wider
- lower note
- heavy deformation
- stronger squash

## Treble

- narrow
- high note
- brighter visual
- slightly higher bounce

## Harmonic

- small contact zone
- clear bell-like note
- grants energy

## Muted

- damped sound
- weak bounce
- warns before fading

## Slide

- slanted or horizontally moving
- glissando effect
- changes horizontal momentum

## Moving

- controlled lateral motion
- speed communicates rhythm
- no impossible acceleration

## Fading

- visible decay
- disappears after contact
- clear telegraph

## Split

- two small strings
- left and right note choices

## Chord

- multiple connected strands
- landing completes harmony
- creates a power or checkpoint

## Boost

- large upward launch
- arpeggio
- strong stretch

## Rest

- checkpoint
- reduced motion
- short musical resolution
- safe pause point

---

# LEVEL GENERATION

Use deterministic seeded generation.

Do not place platforms through unrestricted random coordinates.

Generate reachable candidates based on movement envelope.

For each next platform:

1. calculate maximum vertical reach
2. calculate horizontal reach at relevant times
3. choose platform type from difficulty table
4. choose safe position
5. verify reachability
6. verify no impossible overlap
7. assign musical note
8. verify phrase rules
9. store seed and generation reason

Required data:

```ts
interface GeneratedPlatform {
  id: string;
  kind: StringPlatformKind;
  x: number;
  y: number;
  width: number;
  movement?: PlatformMovement;
  note: MusicalNote;
  chordRole: number;
  difficulty: number;
  seed: number;
}
```

## Reachability test

A generated platform must have at least one valid intercept window under maximum allowed horizontal control.

Add automated tests.

## Safety rules

- first platforms are generous
- no blind leaps
- no platform directly hidden under HUD
- no long sequence of narrow platforms
- recovery platform appears after difficult sequence
- game cannot generate only muted strings
- mobile width affects generation
- camera movement is considered

---

# CAMERA

Use a soft upward camera.

Behavior:

- camera follows only after player reaches upper threshold
- avoid constant vertical jitter
- platforms move downward in view while world coordinates remain stable
- camera catches up smoothly after boost
- game over can briefly show fall
- landing feedback should not be cancelled by camera movement

Separate:

```text
world coordinates
camera coordinates
screen coordinates
```

Do not mutate every platform’s world Y simply because the camera scrolls.

---

# MUSICAL LEVEL GENERATION

The route should generate a playable phrase, not random notes.

Use a phrase grammar.

Example:

```text
start on chord tone
move by scale step
repeat or answer
approach tension
resolve at rest platform
```

Every platform receives:

- scale degree
- octave
- chord role
- phrase index
- rhythmic weight

A player may skip notes.

The phrase system must still sound acceptable when only some platforms are hit.

Use a pentatonic or similarly robust scale for the first prototype.

## Landing timing

Do not force exact rhythm in the earliest version.

Instead:

- measure landing interval
- softly quantize accompaniment
- reward consistent timing
- avoid punishing normal movement latency

Later rhythm layer:

- pulse ring communicates beat
- landing near beat increases combo
- off-beat landing still plays
- accessibility mode can disable rhythm scoring

---

# SCORE AND COMBO

Score sources:

- height
- successful landing
- new string
- chord completion
- rhythm accuracy
- harmonic platform
- no-miss sequence
- risky edge landing
- collected note glyph
- sector completion

Combo should increase musical richness, not only number size.

Combo tiers:

```text
1 to 3: single pluck
4 to 7: subtle bass support
8 to 11: extra harmonic
12+: restrained percussion or ambient pad
```

Cap layer count.

Do not create audio clutter.

---

# GAME POWER IDEAS

Implement only a small stable set.

## Resonance Shield

- protects one miss or hazard
- visual ring
- soft chord

## Double Bounce

- next string launches higher
- body stretches
- octave note

## Magnet Note

- nearby note collectibles drift toward player
- no effect on platform collision

## Time Rubato

- temporarily slows moving platforms
- audio tempo transitions smoothly
- does not pitch-shift existing voices unexpectedly

## Harmony Wings

- brief wider air control
- fins expand
- adds harmony note

## Chord Burst

- clears temporary hazards
- plays resolved chord
- does not delete level geometry

---

# HAZARDS

Keep hazards musical and readable.

Ideas:

## Dead String

- visually frayed
- no bounce
- no note
- clearly telegraphed

## Feedback Knot

- oscillating obstacle
- hums quietly when sound enabled
- predictable movement

## Mute Cloud

- temporarily dampens next note and bounce
- soft visual fog
- not a sudden invisible penalty

## Broken Fret

- blocks one lane
- clear silhouette

## Tempo Pulse

- periodic moving wave
- changes platform positions predictably

Do not create dense bullet-hell patterns.

This is a vertical musical platformer.

---

# SECTORS

Create three strong sectors before adding more.

## Sector 1: Open Strings

Visual:

- homepage-derived dark field
- clean white/cyan strings
- simple platforms

Music:

- open suspended harmony
- sparse plucks

Gameplay:

- wide strings
- tutorial
- no harsh hazards

## Sector 2: Neon Fretboard

Visual:

- glowing fret markers
- stronger magenta/cyan accents
- moving strings

Music:

- pentatonic melody
- subtle bass layer

Gameplay:

- slides
- moving platforms
- chord choices

## Sector 3: Resonance Sky

Visual:

- constellation patterns
- strings become arcs
- distant pulse rings

Music:

- fuller harmony
- resolved phrases

Gameplay:

- harmonic nodes
- boosts
- final ascent sequence

Each sector needs:

- intro title
- palette
- harmonic map
- platform table
- background behavior
- completion phrase
- difficulty rules

---

# GAME HUD

Display only necessary data:

- score
- height or sector progress
- combo
- lives or safety state
- current harmony
- mute
- pause
- exit

Do not cover platforms.

On mobile:

- compact top bar
- safe-area padding
- touch controls remain clear

Menu screens:

- ready
- paused
- game over
- sector complete
- victory

The game must have an obvious exit back to the portfolio.

---

# GAME OVER AND RETURN

Failure should remain cute.

Sequence:

- mascot misses
- eyes widen
- tail follows
- sound dampens
- brief fall
- mascot lands back on a homepage string or safe return platform
- show retry and exit

Do not punish with a long restart delay.

Do not reload the page.

Persist:

- local best score
- highest sector
- mute setting

Optional:

- best musical combo

Use safe localStorage parsing.

---

# GAME PERFORMANCE

The game reuses the mascot engine but adds:

- more strings
- platform generation
- camera
- UI
- additional audio

Budgets must remain bounded.

Suggested caps:

```text
visible platforms: 18 to 30
active string simulation points: bounded by quality
particles low: 150
particles medium: 400
particles high: 700
active audio voices: 6 to 16 by quality and mode
collectibles: under 30
floating text: under 20
```

Do not run homepage obstacle scanning while full-screen game mode is active.

Pause hidden homepage behavior.

Reuse pools.

---

# GAME ACCESSIBILITY

Required:

- game is optional
- visible launch control
- visible exit
- mute
- volume
- pause
- keyboard support
- touch support
- reduced-motion mode
- no forced rhythm precision
- colour is not the only platform distinction
- readable platform shapes
- no audio-only hazard

Reduced-motion game:

- less camera easing
- no large screen shake
- fewer particles
- simplified body deformation
- stable background

Muted game:

- all timing remains playable
- visual note feedback replaces sound cues

---

# GAME ACCEPTANCE TESTS

The first complete game passes when:

- transition starts intentionally
- mascot tumbles and lands visibly
- game begins without page reload
- horizontal controls work
- touch controls work
- automatic bounce works
- swept landing prevents tunnelling
- generated platforms are reachable
- camera scrolls smoothly
- every landing can trigger one musical event
- mute does not break gameplay
- audio remains voice-capped
- game can pause
- game can exit
- game over can retry
- local best persists
- reduced motion works
- full-screen mode cleans up on exit
- homepage mascot resumes safely


---

# CREATIVE INTERACTION BACKLOG

The following ideas should be treated as a prioritized backlog, not as simultaneous requirements.

## Tier 1: highest value

### String personality

Each string has a slightly different visual and audio temperament.

- bass strings bend more slowly
- treble strings snap quickly
- middle strings carry melody
- harmonic strings glow at nodes

### Face reacts to harmony

- consonant chord: relaxed smile
- unresolved interval: curious tilt
- repeated note: playful squint
- hard landing: compressed face
- near miss: wide eyes

### Tail as a musical brush

The tail is not only decorative.

It can:

- brush multiple strings
- leave a fading colour trail
- create a softer articulation
- complete a chord after the core lands

### Section motifs

The mascot remembers a tiny motif from each portfolio section.

When returning to the hero, it combines motifs into a short phrase.

Keep the motif system deterministic and short.

### Musical footprints

Each landing creates a temporary mark:

- note dot
- small fret line
- constellation point
- ripple

Marks fade and form a visual history of the ascent.

## Tier 2: strong additions

### Chord gates

A gate opens when the player lands on a compatible sequence of strings.

Provide visual hints.

Do not require music theory.

### Duet mode

The visitor plays strings with pointer movement while the mascot answers.

Use turn-taking:

```text
visitor phrase
pause
mascot answer
```

Avoid simultaneous clutter.

### Fret zones

Horizontal contact position changes timbre or harmonic emphasis.

Do not create dozens of literal frets at first.

Use a few broad zones.

### String knots

A string may contain a glowing knot that creates a harmonic when touched.

### Memory melody

The game records the last few landing degrees and replays a simplified resolution at sector end.

### Soft-body costume shift

Pattern recipe changes by sector:

```text
homepage -> terrazzo
open strings -> soft stripes
neon fretboard -> circuit garden
resonance sky -> constellation freckles
```

The character remains recognisable.

## Tier 3: experimental

### Text-to-music

Selected words in project headings map to short pitch motifs.

Do not use all page text.

### Pretext lyric surfaces

Pretext-rendered lines become temporary rest platforms.

Keep this inside a dedicated experiment.

### Audio-reactive body print

String energy sends a pulse through local-space circuit lines.

Use event state, not an expensive full audio analyser, unless analysis is justified.

### Ghost replay

The best previous run appears as a faint non-colliding trail.

### Shareable run seed

Generate a deterministic daily route.

Do not add backend requirements.

### Hidden chord creatures

A specific chord temporarily changes pattern or expression.

Do not copy existing mascots.

### Instrument evolution

Higher sectors gradually transform pluck timbre:

```text
toy string
-> clean digital guitar
-> glass harmonic
-> constellation harp
```

Keep master loudness consistent.

---

# VISUAL-AUDIO SYNCHRONIZATION

Do not assume visual RAF and audio events occur on the same clock.

For direct contact:

1. detect contact in simulation
2. create musical event
3. schedule audio using `AudioContext.currentTime`
4. store scheduled audio time in a small visual event queue
5. render the visual pulse when audio time is reached

For events that must feel immediate, schedule with a tiny safety offset.

For game phrases:

- use the audio scheduler
- drive beat visuals from scheduled timestamps
- avoid scheduling from `setInterval` alone
- keep look-ahead bounded

Create:

```ts
interface ScheduledVisualAudioEvent {
  id: number;
  audioTime: number;
  kind: "pluck" | "strum" | "chord" | "landing" | "sector";
  stringId?: string;
  intensity: number;
}
```

Remove completed events.

Keep queue bounded.

---

# AUDIO FAILURE FALLBACKS

If AudioWorklet fails:

1. report in development
2. use procedural AudioBuffer or oscillator fallback
3. keep mute control working
4. keep visual string interaction
5. do not break game

If audio activation fails:

- stay muted
- show a non-blocking status
- continue visual experience

If the browser has no Web Audio support:

- disable audio features
- preserve gameplay
- preserve visual string response

Do not repeatedly retry and spam the console.

---

# CHARACTER AND GAME FILE STRUCTURE

Extend the existing architecture.

```text
components/
  mascot/
    ProceduralMascotLoader.tsx
    ProceduralMascotCanvas.tsx
    MascotSoundControl.tsx
    MascotAppearancePanel.tsx
    Mascot.module.css

  strumrise/
    StrumriseOverlay.tsx
    StrumriseHud.tsx
    StrumriseMenu.tsx
    StrumriseControls.tsx
    Strumrise.module.css

lib/
  mascot/
    appearance/
      AppearanceRecipe.ts
      AppearancePresets.ts
      BodyContour.ts
      FaceRig.ts
      ExpressionController.ts
      LocalSkinCoordinates.ts
      ProceduralPrint.ts
      PatternRecipes.ts
      RimRenderer.ts
      SilhouetteRenderer.ts
      DotSkinRenderer.ts

    music/
      AudioDirector.ts
      AudioGestureGate.ts
      AudioScheduler.ts
      EffectsBus.ts
      HarmonyMap.ts
      MusicalDirector.ts
      MusicTelemetry.ts
      NoteQuantizer.ts
      PluckVoice.ts
      ProceduralPluckBuffer.ts
      StringContactDetector.ts
      StringRegistry.ts
      StringVisualSimulation.ts
      VoicePool.ts
      worklet/
        KarplusStrongNode.ts

    game/
      AscentGameController.ts
      AscentGameState.ts
      AscentInput.ts
      AscentPhysics.ts
      AscentCamera.ts
      LandingDetector.ts
      PlatformGenerator.ts
      PlatformReachability.ts
      MusicalLevelDirector.ts
      SectorDefinitions.ts
      GameScoring.ts
      GamePersistence.ts
      GameTransitionDirector.ts
      GameTelemetry.ts

public/
  audio-worklets/
    karplus-strong-processor.js

tests/
  mascot/
    appearance/
    music/
    game/

  e2e/
    mascot-appearance.spec.ts
    mascot-musical-strings.spec.ts
    strumrise-transition.spec.ts
    strumrise-gameplay.spec.ts
    strumrise-mobile.spec.ts
    strumrise-muted.spec.ts
    strumrise-reduced-motion.spec.ts

docs/
  mascot/
    APPEARANCE_REVIEW.md
    AUDIO_ARCHITECTURE.md
    MUSICAL_MAPPING.md
    STRUMRISE_DESIGN.md
    STRUMRISE_PLAYTEST.md
    UPGRADE_STATUS.md
    UPGRADE_FINAL_REPORT.md
```

Adapt names to current repository conventions.

Do not create unused files.

---

# SHARED ENGINE CHANGES

The mascot engine needs new high-level APIs.

Example:

```ts
interface ExtendedMascotEngine {
  setAppearanceRecipe(recipeId: string): void;
  setExpression(expression: MascotExpression): void;
  setSoundEnabled(enabled: boolean): Promise<void>;
  setMasterVolume(value: number): void;
  triggerStringPluck(event: StringPluckEvent): void;
  enterGame(options?: GameStartOptions): void;
  exitGame(reason: GameExitReason): void;
  getAudioStatus(): AudioStatus;
  getGameStatus(): AscentGameStatus;
}
```

Do not expose raw audio nodes to React.

Do not expose internal game arrays to React.

React receives throttled status.

---

# NEW CLAUDE CODE SKILLS

Create these project skills in addition to the skills from the first master specification.

---

# SKILL: DESIGNING PROCEDURAL CHARACTER SKINS

Create:

```text
.claude/skills/designing-procedural-character-skins/
  SKILL.md
  references/
    cuteness-and-hierarchy.md
    local-space-patterns.md
    appearance-review.md
```

## `SKILL.md`

```markdown
---
name: designing-procedural-character-skins
description: Designs and implements readable, cute, original procedural mascot silhouettes, face rigs, local-space skin patterns, rim lighting, and layered Canvas rendering. Use when the mascot looks noisy, shapeless, unreadable, overly particle-based, or needs new expressions, textures, prints, palettes, and appearance presets.
---

# Workflow

1. Review the mascot as a silhouette before reviewing dots.
2. Capture 96-pixel, light-background, and dark-background previews.
3. Identify the head, torso, tail, and face frame.
4. Stabilize the base contour.
5. Place face features in a local head frame.
6. Create print coordinates in body-local `u` and `v`.
7. Add one dominant colour, one support colour, and one accent.
8. Add dots only after the solid body reads clearly.
9. Test fall, landing, hard turn, and rest.
10. Run appearance review and performance checks.

# Invariants

- The head is recognisable.
- The face remains attached.
- Texture does not swim through the body.
- Pattern seeds do not change every frame.
- Reduced mode remains the same character.
- No copied mascot silhouette.
- Dots support the form rather than replace it.

Read the reference files before changing contour, face, or pattern systems.
```

## `references/cuteness-and-hierarchy.md`

```markdown
# Cuteness and hierarchy

Prioritize:

1. readable silhouette
2. stable face
3. large head relative to torso
4. rounded transitions
5. clear eyes at small size
6. delayed fin and tail response
7. sparse accents

Avoid:

- equally bright colours everywhere
- tiny facial details
- constant blinking
- tail longer than the readable body by several times
- high-frequency noise on the outer edge
- a floating white circle without facial structure
```

## `references/local-space-patterns.md`

```markdown
# Local-space patterns

Every pattern mark stores:

- longitudinal `u`
- lateral `v`
- stable seed
- colour role
- scale
- rotation
- layer

Resolve marks from the current spine and local normal.

Never use world-space noise as the primary skin pattern.

Regenerate only when the appearance recipe or quality tier changes.
```

## `references/appearance-review.md`

```markdown
# Appearance review

Capture:

- silhouette only
- flat colour
- final print
- 96-pixel preview
- fall
- landing
- turn
- rest
- reduced mode

Score:

- originality
- head readability
- face readability
- body balance
- texture attachment
- colour hierarchy
- motion compatibility
- performance
```

---

# SKILL: BUILDING MUSICAL WEB AUDIO

Create:

```text
.claude/skills/building-musical-web-audio/
  SKILL.md
  references/
    audio-graph.md
    scheduling.md
    plucked-string.md
    audio-safety.md
```

## `SKILL.md`

```markdown
---
name: building-musical-web-audio
description: Builds opt-in, precisely scheduled, performance-conscious Web Audio systems for interactive strings, procedural plucks, musical quantization, voice pooling, effects, and game music. Use when adding sound activation, AudioContext lifecycle, string notes, AudioWorklet synthesis, audio scheduling, musical harmony, mute controls, or audio performance tests.
---

# Workflow

1. Verify user-gesture activation.
2. Separate physical contact events from musical events and DSP.
3. Prototype with built-in nodes before custom worklets.
4. Schedule against `AudioContext.currentTime`.
5. Use bounded look-ahead for sequences.
6. Cap voices and recycle or disconnect completed nodes.
7. Protect output with conservative gain and compression.
8. Provide mute and fallback.
9. Suspend hidden or inactive audio.
10. Test production worklet paths.
11. Run muted and unsupported-audio scenarios.
12. Document graph and measured voice counts.

# Invariants

- No audible autoplay.
- No visual-clock musical scheduling.
- No unbounded polyphony.
- No allocation inside worklet processing loops.
- No audio dependency for core gameplay.
- No missing mute control.
- Worklet failure falls back safely.
```

## `references/audio-graph.md`

```markdown
# Audio graph

Recommended:

voice
-> voice gain
-> voice filter
-> dry bus
-> compressor
-> master gain
-> destination

Optional send:

voice
-> reverb send
-> reverb
-> master compressor

Keep master gain conservative.
Disable expensive effects in low mode.
```

## `references/scheduling.md`

```markdown
# Scheduling

Use `AudioContext.currentTime`.

Direct contacts:
- schedule with a tiny future safety offset

Sequences:
- use a short look-ahead interval
- schedule a bounded future window
- keep tempo changes possible
- queue visual events with audio timestamps

Do not schedule an entire long game soundtrack in advance.
```

## `references/plucked-string.md`

```markdown
# Plucked-string synthesis

Prototype order:

1. oscillator/noise envelope
2. procedural AudioBuffer fallback
3. AudioWorklet Karplus-Strong-style voice

Clamp:

- frequency
- delay length
- feedback
- damping
- gain
- lifetime

Stop silent voices.
Avoid allocation and logging in the render thread.
```

## `references/audio-safety.md`

```markdown
# Audio safety

- audio is opt-in
- mute remains visible
- volume defaults conservatively
- cap simultaneous voices
- use a master gain
- use conservative compression
- avoid extreme stereo
- suspend or silence inactive contexts
- test headphones and mobile speakers
- never treat raw velocity as raw gain
```

---

# SKILL: CHOREOGRAPHING PAGE-TO-GAME TRANSITIONS

Create:

```text
.claude/skills/choreographing-page-to-game-transitions/
  SKILL.md
  references/
    transition-beats.md
    input-safety.md
```

## `SKILL.md`

```markdown
---
name: choreographing-page-to-game-transitions
description: Designs and implements seamless transitions between the portfolio mascot and the full-screen Strumrise game, including deliberate activation, falling, tumbling, string cascades, landing, camera reframing, cleanup, and return to the page. Use when changing game gates, overlay transitions, drop gestures, intro choreography, exit flows, or page/game lifecycle.
---

# Workflow

1. Verify the game trigger is deliberate and accessible.
2. Preserve current page state.
3. Choreograph anticipation, drop, string cascade, landing, and reveal.
4. Keep input ownership explicit during transition.
5. Pause homepage-only systems in game mode.
6. Preserve mute and quality settings.
7. Provide visible exit.
8. Restore homepage engine safely.
9. Test interruption, resize, route change, and reduced motion.
10. Keep intro skippable after first play.

Read transition and input references before editing.
```

## `references/transition-beats.md`

```markdown
# Transition beats

Required order:

1. anticipation
2. release
3. controlled tumble
4. string contacts
5. landing
6. impact recovery
7. camera reframe
8. HUD reveal
9. gameplay ready

Every beat must be interruptible or safely recoverable.
```

## `references/input-safety.md`

```markdown
# Input safety

- never launch from ordinary page scroll
- never launch while clicking navigation
- use an explicit gate or control
- release pointer capture correctly
- prevent page scroll only inside active game interaction
- restore page input on exit
- handle Escape
- handle lost focus
```

---

# SKILL: BUILDING MUSICAL ASCENT GAMES

Create:

```text
.claude/skills/building-musical-ascent-games/
  SKILL.md
  references/
    reachability.md
    musical-levels.md
    game-feel.md
```

## `SKILL.md`

```markdown
---
name: building-musical-ascent-games
description: Builds and tunes an original vertical auto-bounce musical platform game using string platforms, deterministic reachable generation, swept landing collision, camera ascent, musical scoring, sectors, pause, retry, and mobile controls. Use when editing Strumrise game physics, platforms, generation, camera, score, musical progression, HUD, or game-state lifecycle.
---

# Workflow

1. Keep game root physics separate from mascot procedural rig.
2. Use fixed-step velocity integration.
3. Use swept landing collision.
4. Generate only reachable platforms.
5. Assign notes through the musical director.
6. Keep camera in separate coordinates.
7. Add one platform type at a time.
8. Test keyboard, pointer, and touch.
9. Keep mute gameplay-complete.
10. Cap platforms, particles, and voices.
11. Test pause, exit, retry, and route cleanup.
12. Record playtest results.

# Invariants

- No impossible generated route.
- No landing tunnelling.
- No page reload for retry.
- No audio-only hazard.
- No accidental game launch.
- No hidden exit.
- Muted play remains complete.
```

## `references/reachability.md`

```markdown
# Reachability

Generate candidates from the player's vertical and horizontal movement envelope.

Verify:

- vertical intercept time
- horizontal reachable interval
- platform width
- camera-safe location
- mobile width
- no blocked route
- recovery after difficult sequence

Reject candidates that fail.
```

## `references/musical-levels.md`

```markdown
# Musical levels

Assign each platform:

- scale degree
- chord role
- octave
- phrase index
- rhythmic weight

Use robust scales for early levels.
Phrase endings resolve on rest or checkpoint platforms.
Skipped notes must not destroy musical coherence.
```

## `references/game-feel.md`

```markdown
# Game feel

Prioritize:

- clear launch
- readable apex
- strong landing
- string deformation
- squash and stretch
- responsive horizontal control
- forgiving early platforms
- short retry
- visible progress
- restrained screen effects
```

---

# SKILL: TESTING AUDIO-VISUAL INTERACTIONS

Create:

```text
.claude/skills/testing-audio-visual-interactions/
  SKILL.md
  references/
    audio-test-matrix.md
    game-test-matrix.md
```

## `SKILL.md`

```markdown
---
name: testing-audio-visual-interactions
description: Tests synchronized mascot visuals, guitar-string contacts, Web Audio activation and scheduling, voice limits, game transitions, vertical gameplay, mute behavior, mobile controls, reduced motion, and cleanup. Use when validating character appearance, musical interactions, AudioWorklet paths, Strumrise gameplay, or release readiness.
---

# Workflow

1. Test appearance separately from audio.
2. Test audio activation and mute.
3. Test one string contact and contact cooldown.
4. Test strum recognition.
5. Test voice cap and output safety.
6. Test transition in and out.
7. Test game physics and generation.
8. Test muted and reduced-motion play.
9. Test mobile and lost focus.
10. Capture console and worklet errors.
11. Record frame and voice counts.
12. Block completion when introduced failures remain.

Read the matrices before final validation.
```

## `references/audio-test-matrix.md`

```markdown
# Audio test matrix

- initial silent state
- explicit activation
- mute and unmute
- one pluck
- repeated overlap
- fast crossing
- multi-string strum
- chord event
- voice cap
- hidden tab
- worklet load failure
- fallback voice
- production path
- mobile speaker
```

## `references/game-test-matrix.md`

```markdown
# Game test matrix

- visible launch
- drag/drop launch
- keyboard launch
- transition interruption
- first landing
- high-speed landing
- moving platform
- fading platform
- pause
- retry
- exit
- route change
- muted play
- reduced motion
- portrait
- landscape
```


---

# NEW CLAUDE CODE SUBAGENTS

Add these project agents beside the existing mascot agents.

---

# CHARACTER ART ENGINEER

Create:

```text
.claude/agents/character-art-engineer.md
```

```markdown
---
name: character-art-engineer
description: Redesigns the procedural mascot into a cute, readable, original character through silhouette, face rigging, local-space texture, procedural print, rim hierarchy, expressions, squash, stretch, and appearance performance.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Begin by reading both mascot master specifications and current appearance code.

Own:

- `lib/mascot/appearance`
- appearance controls in motion lab
- appearance-focused tests
- appearance documentation

Responsibilities:

1. Capture the current silhouette and 96-pixel result.
2. Stabilize the body contour before adding texture.
3. Build a local face frame.
4. Add expressions.
5. Implement local-space print recipes.
6. Reduce particle noise.
7. Preserve reduced-quality identity.
8. Review fall, landing, turn, and rest.
9. Profile appearance layers.
10. Write `docs/mascot/APPEARANCE_REVIEW.md`.

Do not copy the reference mascot.

Do not compensate for weak form with more dots.

Coordinate motion deformation with the rig engineer.
```

---

# AUDIO DSP ENGINEER

Create:

```text
.claude/agents/audio-dsp-engineer.md
```

```markdown
---
name: audio-dsp-engineer
description: Builds the opt-in Web Audio system for homepage guitar strings and Strumrise, including activation, precise scheduling, voice pooling, effects, procedural plucks, optional AudioWorklet synthesis, fallback paths, and output safety.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own:

- `lib/mascot/music`
- audio worklet processor
- audio tests
- audio documentation

Responsibilities:

1. Build explicit sound activation and mute.
2. Separate contact, musical event, and DSP layers.
3. Prototype with built-in nodes first.
4. Schedule from `AudioContext.currentTime`.
5. Implement bounded voice pool.
6. Add safe output graph.
7. Add fallback procedural pluck.
8. Add AudioWorklet only after the interaction prototype is approved.
9. Test production worklet path.
10. Measure voice count and failure behavior.
11. Write `docs/mascot/AUDIO_ARCHITECTURE.md`.

Never autoplay.

Never run sample processing in the visual RAF.

Never allow unbounded polyphony.
```

---

# MUSICAL INTERACTION DESIGNER

Create:

```text
.claude/agents/musical-interaction-designer.md
```

```markdown
---
name: musical-interaction-designer
description: Designs note mapping, harmony, strum recognition, phrase rules, section motifs, combo music, string articulations, and musical feedback for the homepage and Strumrise.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own:

- harmony definitions
- musical event mapping
- phrase grammar
- musical interaction documentation
- tests for deterministic note mapping

Responsibilities:

1. Make random visitor interaction sound intentional.
2. Define guitar and portfolio harmony modes.
3. Map contact position, speed, direction, and body part.
4. Implement repetition control.
5. Implement strum recognition.
6. Implement simple chord completion.
7. Design sector harmony.
8. Ensure muted gameplay remains complete.
9. Avoid audio clutter at high combo.
10. Write `docs/mascot/MUSICAL_MAPPING.md`.

Do not modify low-level DSP without coordination.

Do not require music theory from the visitor.
```

---

# STRUMRISE GAME ENGINEER

Create:

```text
.claude/agents/strumrise-game-engineer.md
```

```markdown
---
name: strumrise-game-engineer
description: Implements the vertical auto-bounce Strumrise game, including game-state lifecycle, root physics, swept landing collision, string platforms, deterministic reachable generation, camera, sectors, scoring, pause, retry, persistence, and mobile controls.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own:

- `lib/mascot/game`
- `components/strumrise`
- game unit tests
- game documentation

Responsibilities:

1. Keep game physics separate from mascot rig deformation.
2. Implement fixed-step player velocity.
3. Implement swept landing detection.
4. Implement reachable generation.
5. Implement camera coordinates.
6. Add platform types incrementally.
7. Connect landing events to the musical director.
8. Add pause, retry, exit, and persistence.
9. Test desktop and touch.
10. Write `docs/mascot/STRUMRISE_DESIGN.md`.

Do not copy another vertical jumper.

Do not create impossible routes.

Do not make audio required for play.
```

---

# TRANSITION CHOREOGRAPHER

Create:

```text
.claude/agents/transition-choreographer.md
```

```markdown
---
name: transition-choreographer
description: Implements the deliberate drop-to-play gesture and page-to-game transition, including anticipation, fall, tumble, string cascade, landing, camera reveal, input ownership, exit, and homepage restoration.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own:

- game gate
- transition director
- overlay transition integration
- transition tests

Responsibilities:

1. Provide a visible accessible game launch.
2. Prevent activation from normal scroll or navigation clicks.
3. Choreograph the required transition beats.
4. Preserve mute and quality state.
5. pause homepage-only systems
6. transfer input safely
7. restore homepage state on exit
8. support reduced motion
9. support interrupted transition
10. keep retry intro short

Coordinate body deformation with the character and rig engineers.
```

---

# AUDIO-VISUAL PERFORMANCE VERIFIER

Create:

```text
.claude/agents/audio-visual-performance-verifier.md
```

```markdown
---
name: audio-visual-performance-verifier
description: Profiles combined mascot appearance, string simulation, Web Audio voices, game rendering, scheduler timing, memory, lifecycle cleanup, and quality degradation.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Measure:

- mascot simulation time
- mascot render time
- string visual simulation time
- active strings
- active platforms
- active particles
- active audio voices
- scheduler queue size
- average frame time
- p95 frame time
- worst frame time
- worklet load time
- memory trend
- cleanup after exit
- initial bundle and lazy chunks

Write results to:

- `docs/mascot/PERFORMANCE.md`
- `docs/mascot/STRUMRISE_PLAYTEST.md`

Do not recommend GPU or Worker migration without bottleneck evidence.
```

---

# AGENT COORDINATION

The existing `mascot-coordinator` remains the top-level coordinator.

Update its instructions to delegate:

```text
character appearance -> character-art-engineer
DSP and audio graph -> audio-dsp-engineer
harmony and phrase rules -> musical-interaction-designer
game physics and generation -> strumrise-game-engineer
transition -> transition-choreographer
combined profiling -> audio-visual-performance-verifier
browser testing -> playtest-agent
visual motion review -> motion-director
```

Rules:

- the game engineer does not rewrite the rig
- the audio engineer does not decide gameplay scoring alone
- the character engineer does not modify low-level physics without coordination
- shared event interfaces are owned by the coordinator
- no two write agents edit the same file simultaneously
- all delegated diffs are reviewed by the coordinator

---

# DOCUMENTATION TO CREATE

Create or update:

```text
docs/mascot/APPEARANCE_REVIEW.md
docs/mascot/AUDIO_ARCHITECTURE.md
docs/mascot/MUSICAL_MAPPING.md
docs/mascot/STRUMRISE_DESIGN.md
docs/mascot/STRUMRISE_PLAYTEST.md
docs/mascot/UPGRADE_STATUS.md
docs/mascot/UPGRADE_FINAL_REPORT.md
```

## Appearance review

Include:

- before diagnosis
- silhouette screenshots
- palette
- body proportions
- pattern recipes
- expressions
- small-size results
- reduced mode
- performance cost
- unresolved visual issues

## Audio architecture

Include:

- activation flow
- graph
- scheduler
- voice pool
- fallback
- worklet
- output protection
- mute
- lifecycle
- failure handling
- measured polyphony

## Musical mapping

Include:

- string notes
- modes
- contact mapping
- strum window
- chords
- section harmony
- game sectors
- combo layers
- accessibility

## Strumrise design

Include:

- game loop
- controls
- physics
- platforms
- generation
- camera
- sectors
- scoring
- powers
- hazards
- transition
- exit
- persistence

---

# UPGRADE STATUS FORMAT

Create:

```text
docs/mascot/UPGRADE_STATUS.md
```

Use:

```markdown
# Current upgrade phase

# Character appearance

# Musical strings

# Audio

# Transition

# Strumrise

# Validation

# Performance

# Known issues

# Deferred gates

# Next action
```

Update after every phase.

---

# TEST PLAN: APPEARANCE

Unit or deterministic tests:

- face frame stays finite
- eye anchors remain inside head frame
- body contour is closed
- body width remains positive
- local pattern samples remain stable by seed
- pattern coordinates survive stretch
- expression transitions are bounded
- dot count follows quality tier
- reduced mode has no expensive pattern layer

Browser scenarios:

- hard turn
- fast follow
- fall
- tumble
- landing
- rest
- 96-pixel preview
- light background
- dark background
- mobile DPR
- reduced motion

Visual review:

- no particle smear
- head readable
- face readable
- tail balanced
- texture attached
- palette hierarchy clear

---

# TEST PLAN: STRING CONTACT

Unit tests:

- signed distance
- projected contact position
- crossing detection
- no retrigger during overlap
- high-speed swept crossing
- cooldown
- direction
- strum grouping
- contact articulation
- velocity curve
- string displacement decay

Browser scenarios:

- core crossing
- tail brush
- fin harmonic
- slow drag
- fast six-string strum
- muted state
- sound activation
- resize
- scroll

---

# TEST PLAN: AUDIO

Use a mix of unit tests, OfflineAudioContext where useful, and browser tests.

Test:

- initial context not audible
- explicit resume
- mute
- volume
- one voice
- multiple voices
- voice stealing
- note schedule order
- look-ahead queue
- filter envelope
- fallback voice
- worklet load
- worklet failure
- hidden-tab suspend
- game pause
- exit cleanup
- no persistent nodes after teardown
- master level remains conservative
- no non-finite DSP state

Do not assert subjective timbre from a unit test.

Use manual listening review for quality.

---

# TEST PLAN: GAME PHYSICS

Unit tests:

- gravity
- maximum fall speed
- horizontal acceleration
- horizontal drag
- bounce velocity
- downward-only landing
- swept collision
- high-speed landing
- platform movement
- camera threshold
- world/screen conversion
- persistence parsing

Generation tests:

- deterministic seed
- reachable route
- mobile route
- first sequence generous
- recovery platform
- no all-muted route
- no HUD obstruction
- bounded platform count
- sector transition

---

# TEST PLAN: TRANSITION

Test:

- visible launch control
- deliberate drop gesture
- no launch from scroll
- no launch from navigation click
- sound disabled
- sound enabled
- reduced motion
- transition interruption
- resize during transition
- Escape
- lost focus
- route change
- return to homepage
- repeated launch
- retry skips long intro

---

# TEST PLAN: FULL GAME

Required browser matrix:

```text
1440x900 Chromium
1280x720 Chromium
768x1024 tablet
430x932 mobile portrait
932x430 mobile landscape
360x800 small mobile
WebKit when available
```

Required sessions:

- muted first run
- sound-enabled first run
- keyboard
- pointer
- touch
- pause and resume
- game over and retry
- exit and re-enter
- sector completion
- hidden tab
- reduced motion
- low quality
- forced worklet failure
- localStorage unavailable

---

# PERFORMANCE BUDGETS

These are targets, not fabricated claims.

## Homepage medium quality

```text
mascot simulation: under 2 ms average
mascot rendering: under 4 ms average
string simulation/render: under 2 ms average
total visual feature work: under 8 ms average
audio voices: 8 or fewer typical
audio scheduler queue: bounded
```

## Game medium quality

```text
game physics and generation: under 3 ms average
mascot rig: under 2 ms average
rendering: under 6 ms average
audio scheduling/main-thread control: under 1 ms typical
total: under 12 ms average
```

## Low quality

```text
solid body
simple print
few particles
fewer string modes or control points
no convolution
lower voice cap
lower DPR
```

## Audio render thread

Do not instrument the worklet with logging.

Use main-thread telemetry:

- active voices
- messages sent
- worklet errors
- underrun symptoms where observable
- manual listening

---

# QUALITY DEGRADATION ORDER

When slow:

1. reduce decorative particles
2. reduce secondary pattern marks
3. reduce string visual modes
4. reduce dot count
5. reduce DPR
6. reduce reverb
7. reduce audio voice cap
8. reduce rig solver iterations
9. switch to flat silhouette
10. reduced mode

Do not remove face before decorative effects.

Do not disable input.

Do not make notes late to preserve extra particles.

---

# IMPLEMENTATION PHASES

## UPGRADE PHASE 0: inspect current implementation

Required:

- inspect both master specs
- inspect current code and reports
- open the motion lab
- reproduce current screenshot
- capture silhouette-only result
- inspect guitar-string DOM or Canvas implementation
- inspect current audio dependencies
- inspect game code if any
- update `UPGRADE_STATUS.md`

Do not trust the previous agent summary without checking source.

## UPGRADE PHASE 1: appearance foundation

Implement:

- appearance lab
- compact body contour
- stable head
- face frame
- silhouette renderer
- 96-pixel preview

Do not add final texture yet.

Gate:

- human-readable cute silhouette
- motion director review
- no major performance regression

## UPGRADE PHASE 2: local-space print

Implement:

- skin coordinates
- three print recipes
- palette hierarchy
- rim
- sparse structural dots
- expression controller

Gate:

- texture remains attached
- final result no longer looks like a particle smear
- reduced mode works

## UPGRADE PHASE 3: performed motion

Implement:

- fall pose
- tumble
- landing squash
- recovery
- bounce stretch
- rest curl
- expression mapping

Gate:

- still images communicate each action
- no excessive rotation
- tail follow-through remains stable

## UPGRADE PHASE 4: string visual system

Implement:

- string registry
- cached geometry
- string simulation
- swept contact
- contact event model
- muted visual response

Gate:

- string bends and settles
- one contact emits one semantic event
- no audio required

## UPGRADE PHASE 5: audio prototype

Implement:

- gesture gate
- mute
- master volume
- built-in-node pluck
- musical mapping
- voice cap
- scheduler
- output safety

Gate:

- no autoplay
- pleasing basic interaction
- no clipping
- no repeated-overlap spam

## UPGRADE PHASE 6: musical behavior

Implement:

- harmony mode
- guitar mode
- strum recognition
- section harmony
- simple chord completion
- visual audio queue

Gate:

- untrained interaction sounds coherent
- visuals and audio align acceptably

## UPGRADE PHASE 7: procedural pluck upgrade

Choose:

- OfflineAudioContext buffer fallback
- AudioWorklet Karplus–Strong-style voice

Implement only after profiling and listening approval.

Gate:

- fallback retained
- production path verified
- voice cap stable

## UPGRADE PHASE 8: drop transition

Implement:

- visible launch
- deliberate gate
- anticipation
- drop
- string cascade
- final landing
- overlay reveal
- input transfer
- exit

Gate:

- not accidental
- accessible
- interruptible
- reduced motion works

## UPGRADE PHASE 9: game foundation

Implement:

- game state
- input
- root physics
- landing
- normal string platforms
- camera
- score
- retry
- exit

Gate:

- playable without audio
- desktop and touch
- no impossible static test route

## UPGRADE PHASE 10: procedural levels

Implement:

- reachability
- deterministic generation
- platform types
- sectors
- persistence

Gate:

- automated reachability passes
- mobile route works
- bounded entities

## UPGRADE PHASE 11: musical game

Implement:

- landing notes
- phrase grammar
- combo layers
- chord platforms
- sector harmony
- muted visual equivalents

Gate:

- music remains coherent
- audio does not overwhelm play

## UPGRADE PHASE 12: polish

Implement selectively:

- particles
- powers
- hazards
- section motifs
- call and response
- costume shifts

Do not exceed budgets.

## UPGRADE PHASE 13: complete validation

Run:

- format
- lint
- typecheck
- unit tests
- appearance browser tests
- audio tests
- transition tests
- game tests
- production build
- performance measurement
- manual listening review
- motion review

Fix introduced failures.

## UPGRADE PHASE 14: final report

Write:

```text
docs/mascot/UPGRADE_FINAL_REPORT.md
```

State exactly what is complete and deferred.


---

# HOOK AND VALIDATION UPDATES

Inspect existing `.claude/settings.json`.

Merge safely.

Do not overwrite existing hooks.

## Post-edit checks

After appearance files change:

- format changed file
- run focused appearance typecheck or unit tests where fast

After music files change:

- typecheck
- run music unit tests
- validate worklet source syntax when applicable

After game files change:

- run game unit tests
- run reachability tests

Do not run a full build after every edit.

## Stop validation

Before stopping when upgrade-related files changed, verify:

- current phase status updated
- focused tests pass
- TypeScript check passes
- lint passes for changed areas
- production build has been run after integration changes
- no known introduced browser error remains
- audio activation is opt-in
- muted gameplay works
- game exit works

The Stop hook must not loop endlessly.

---

# VERIFY SCRIPT EXTENSION

Extend or create:

```text
scripts/mascot/verify-upgrade.mjs
```

Responsibilities:

1. detect package manager
2. inspect available scripts
3. run appearance tests
4. run music tests
5. run game tests
6. run typecheck
7. run lint
8. run focused E2E
9. run production build in full mode
10. emit clear summary
11. exit non-zero on failure
12. support `--fast`
13. never modify source

Suggested package script:

```json
{
  "scripts": {
    "verify:mascot-upgrade": "node scripts/mascot/verify-upgrade.mjs"
  }
}
```

Adapt to current tooling.

---

# DEVELOPMENT DEBUG API

Extend development-only API:

```ts
window.__MASCOT_DEBUG__ = {
  ...existingDebugApi,

  appearance: {
    setPreset,
    setPattern,
    setExpression,
    setLayerVisible,
    captureSilhouette,
  },

  music: {
    activate,
    mute,
    pluckString,
    strum,
    setMode,
    getVoiceCount,
    failWorkletForTest,
  },

  game: {
    launch,
    exit,
    pause,
    resume,
    setSeed,
    teleportToSector,
    spawnPlatformType,
    getReachabilitySnapshot,
  },
};
```

Do not expose this in production.

---

# TELEMETRY AND DEBUGGING

Use local development telemetry only unless the site already has an approved analytics system.

Track:

- current appearance preset
- dot and pattern count
- string contact count
- ignored contact count
- active voices
- stolen voices
- scheduler queue
- game state
- platform count
- current seed
- camera position
- frame timings
- quality tier
- automatic downgrade reason

Do not collect personal data.

Do not send raw pointer paths to analytics.

---

# MANUAL ART REVIEW CHECKLIST

Before accepting the character:

```text
[ ] It looks like a creature, not a brush stroke.
[ ] The head is obvious.
[ ] The face is obvious.
[ ] The body has a clear front and back.
[ ] The tail supports rather than dominates.
[ ] The print is attached to the body.
[ ] One colour dominates.
[ ] Dots are accents.
[ ] Fall pose is readable.
[ ] Landing pose is readable.
[ ] Rest pose is readable.
[ ] The character looks original.
[ ] It remains recognisable when muted and reduced.
```

---

# MANUAL AUDIO REVIEW CHECKLIST

Use headphones and a normal device speaker.

```text
[ ] First sound requires explicit activation.
[ ] Default volume is gentle.
[ ] One pluck has a clear attack.
[ ] Decay is not excessively long.
[ ] Bass does not overpower.
[ ] Treble is not painful.
[ ] Six-string strum does not clip.
[ ] Repeated contact does not machine-gun.
[ ] Muted contact sounds intentionally muted.
[ ] Tail articulation differs from core landing.
[ ] Chord completion feels rewarding.
[ ] Game combo adds richness without mud.
[ ] Pause and hidden tab stop unnecessary sound.
[ ] Worklet fallback sounds acceptable.
```

---

# MANUAL GAME REVIEW CHECKLIST

```text
[ ] Launch is discoverable.
[ ] Launch is not accidental.
[ ] Drop transition has anticipation.
[ ] Tumble remains readable.
[ ] String cascade feels musical.
[ ] Landing has impact.
[ ] Horizontal control is responsive.
[ ] Bounce is predictable.
[ ] Camera is smooth.
[ ] Platforms are readable.
[ ] Early route is forgiving.
[ ] Difficult routes remain fair.
[ ] Music supports rather than distracts.
[ ] Muted game remains satisfying.
[ ] Pause and exit are obvious.
[ ] Retry is quick.
[ ] Return to homepage is clean.
```

---

# FINAL DEFINITION OF DONE

The upgrade is complete only when all applicable items are true.

## Character

- [ ] Stable compact silhouette.
- [ ] Clear head and face.
- [ ] Original design.
- [ ] Balanced tail.
- [ ] Local-space print.
- [ ] At least three pattern recipes.
- [ ] Clear colour hierarchy.
- [ ] Sparse structural dots.
- [ ] Expressions tied to states.
- [ ] Fall, landing, bounce, and rest poses.
- [ ] Readable at 96 pixels.
- [ ] Reduced mode preserves identity.

## Strings

- [ ] Guitar strings are registered entities.
- [ ] Geometry is cached.
- [ ] String visual deformation works.
- [ ] Contact detection is swept.
- [ ] Overlap does not retrigger.
- [ ] Core, tail, and fin articulation can differ.
- [ ] Strum grouping works.
- [ ] Muted visual interaction still works.

## Audio

- [ ] Explicit activation.
- [ ] Mute.
- [ ] Volume control or safe fixed level.
- [ ] Audio clock scheduling.
- [ ] Voice pool.
- [ ] Voice cap.
- [ ] Safe master output.
- [ ] Musical quantization.
- [ ] Guitar or harmony mode.
- [ ] Fallback pluck voice.
- [ ] Worklet only when gate is met.
- [ ] Worklet production path verified when included.
- [ ] Hidden-tab and teardown behavior.
- [ ] No audible autoplay.

## Transition

- [ ] Visible game launch.
- [ ] Deliberate drop gate.
- [ ] No accidental scroll launch.
- [ ] Anticipation.
- [ ] Drop.
- [ ] Tumble.
- [ ] String cascade.
- [ ] Landing.
- [ ] Overlay reveal.
- [ ] Input transfer.
- [ ] Exit and restoration.
- [ ] Reduced-motion transition.

## Game

- [ ] Separate game state.
- [ ] Separate root physics.
- [ ] Keyboard controls.
- [ ] Touch controls.
- [ ] Automatic bounce.
- [ ] Swept landing.
- [ ] Camera.
- [ ] Reachable generation.
- [ ] At least three string-platform types.
- [ ] At least three sectors or a clearly documented smaller MVP.
- [ ] Landing music.
- [ ] Score and combo.
- [ ] Pause.
- [ ] Retry.
- [ ] Exit.
- [ ] Local best.
- [ ] Muted gameplay.
- [ ] Reduced-motion gameplay.
- [ ] No page reload.

## Performance

- [ ] Appearance layers are quality-gated.
- [ ] Strings are bounded.
- [ ] Audio voices are bounded.
- [ ] Platforms are bounded.
- [ ] Particles are pooled and bounded.
- [ ] No DOM reads in RAF.
- [ ] No React per-frame state.
- [ ] No optional heavy library in initial bundle.
- [ ] Homepage systems pause during game.
- [ ] Combined performance measured.
- [ ] Low mode works.

## Testing

- [ ] Appearance tests.
- [ ] String contact tests.
- [ ] Audio activation tests.
- [ ] Scheduler tests.
- [ ] Voice-cap tests.
- [ ] Game physics tests.
- [ ] Reachability tests.
- [ ] Transition E2E.
- [ ] Game E2E.
- [ ] Mobile.
- [ ] Muted.
- [ ] Reduced motion.
- [ ] Worklet failure fallback.
- [ ] Production build.
- [ ] No introduced console errors.

## Documentation

- [ ] Appearance review.
- [ ] Audio architecture.
- [ ] Musical mapping.
- [ ] Strumrise design.
- [ ] Playtest.
- [ ] Performance results.
- [ ] Upgrade status.
- [ ] Final report.

---

# AUTONOMOUS IMPLEMENTATION CHECKLIST

The coordinator should use this sequence.

```text
[ ] Read both master specifications.
[ ] Inspect git state.
[ ] Inspect current mascot result.
[ ] Open motion lab.
[ ] Capture silhouette-only baseline.
[ ] Inspect guitar string implementation.
[ ] Inspect current audio dependencies.
[ ] Create upgrade status.
[ ] Add new skills.
[ ] Add new subagents.
[ ] Update coordinator instructions.
[ ] Create appearance lab.
[ ] Build compact body contour.
[ ] Build face frame.
[ ] Build expressions.
[ ] Build local skin coordinates.
[ ] Build first print recipe.
[ ] Build second print recipe.
[ ] Build third print recipe.
[ ] Add rim hierarchy.
[ ] Reduce noisy dots.
[ ] Add 96-pixel preview.
[ ] Tune fall.
[ ] Tune tumble.
[ ] Tune landing.
[ ] Tune recovery.
[ ] Add string registry.
[ ] Add visual string simulation.
[ ] Add swept contact detector.
[ ] Add semantic pluck events.
[ ] Add explicit sound activation.
[ ] Add mute.
[ ] Add basic pluck voice.
[ ] Add voice pool.
[ ] Add safe audio graph.
[ ] Add musical director.
[ ] Add harmony mode.
[ ] Add strum recognition.
[ ] Add visual/audio event queue.
[ ] Review musical interaction.
[ ] Decide whether worklet gate is met.
[ ] Add fallback procedural buffers.
[ ] Add worklet only when justified.
[ ] Add visible game launch.
[ ] Add deliberate drop gate.
[ ] Add transition anticipation.
[ ] Add string cascade.
[ ] Add landing and overlay reveal.
[ ] Add game state.
[ ] Add game input.
[ ] Add root physics.
[ ] Add swept landing.
[ ] Add normal string platforms.
[ ] Add camera.
[ ] Add static test route.
[ ] Add reachability generator.
[ ] Add platform types.
[ ] Add sectors.
[ ] Add musical level director.
[ ] Add score and combo.
[ ] Add pause, retry, exit.
[ ] Add persistence.
[ ] Add mobile layout.
[ ] Add reduced motion.
[ ] Add muted visual feedback.
[ ] Run unit tests.
[ ] Run browser tests.
[ ] Run production build.
[ ] Profile homepage.
[ ] Profile game.
[ ] Run character art review.
[ ] Run manual listening review.
[ ] Fix highest-impact visual issue.
[ ] Fix highest-impact audio issue.
[ ] Fix highest-impact gameplay issue.
[ ] Update documentation.
[ ] Write final report.
```

---

# COMPLETION RESPONSE FORMAT

At completion, Claude must respond with:

## Result

State:

- complete
- substantially complete with limitations
- blocked by a specific issue

## Character upgrade

Describe:

- silhouette
- face
- pattern
- palette
- expressions
- motion poses

## Musical strings

Describe:

- registration
- visual physics
- contact types
- note mapping
- strum recognition

## Audio

Describe:

- activation
- graph
- scheduler
- voice pool
- fallback
- worklet when used
- mute
- measured voice count

## Game

Describe:

- launch
- transition
- controls
- physics
- platforms
- generation
- sectors
- scoring
- persistence
- exit

## Files

List important added and modified files.

## Validation

List exact commands and outcomes.

## Performance

Report measured results.

Do not invent unmeasured frame times or audio quality claims.

## Limitations

Be explicit.

## How to test

Provide exact routes, controls, debug commands, sound activation steps, game launch steps, and reduced-motion steps.

## Next three improvements

Only list deliberately deferred improvements.

---

# FINAL CLAUDE CODE PROMPT

Use this exact prompt:

```text
Read @PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md and
@PROCEDURAL_MASCOT_MUSICAL_ASCENT_UPGRADE_MASTER_SPEC.md in full.

The current implementation has strong procedural engineering but the visible
character still reads as a cyan/magenta particle ribbon with no stable cute
silhouette or face. It also does not yet turn the homepage guitar strings into
a musical instrument and does not implement the drop-to-vertical-ascent game.

Treat the first specification as the architecture, lifecycle, testing, and
performance foundation. Treat the upgrade specification as the required
character-art, Web Audio, guitar-string, transition, and Strumrise game work.

Inspect the current repository, git state, source code, motion lab, existing
reports, and actual guitar-string implementation before editing. Preserve
unrelated work. Do not trust prior completion summaries without verifying code.

Work through the upgrade phases in order:

1. make the mascot a compact, original, cute, readable character
2. add a stable face and local-space procedural print
3. add performed fall, tumble, landing, bounce, and rest motion
4. turn homepage guitar strings into visually deforming musical entities
5. add explicit audio activation, mute, safe scheduling, voice pooling, and
   musically coherent note mapping
6. add an AudioWorklet plucked-string model only if the prototype and profiling
   gates are met, while retaining a fallback
7. implement a deliberate accessible drop-to-play transition
8. build the original Strumrise vertical auto-bounce musical ascent game
9. add deterministic reachable generation, musical sectors, scoring, pause,
   retry, exit, mobile controls, mute support, and reduced motion
10. test, profile, document, and fix introduced failures

Do not generate image assets. Build the visual identity procedurally through
Canvas silhouettes, local-space patterns, stable facial anchors, rim hierarchy,
and restrained dots.

Do not autoplay audio. Use AudioContext.currentTime for musical scheduling.
Keep all voices, particles, strings, and platforms bounded. Keep gameplay fully
functional while muted.

Do not stop after planning. Delegate to the defined project subagents where
useful, review their diffs, run the available unit, browser, type, lint, build,
and performance checks, and write docs/mascot/UPGRADE_FINAL_REPORT.md.

At the end, respond using the completion response format in the upgrade spec.
```

---

# RESEARCH REFERENCES

The agent may revisit these sources during implementation.

1. Next.js lazy loading:
   https://nextjs.org/docs/app/guides/lazy-loading

2. Web Audio best practices and autoplay:
   https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
   https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay

3. Audio clock and scheduling:
   https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime
   https://web.dev/articles/audio-scheduling
   https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques

4. AudioWorklet:
   https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor
   https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet

5. Audio automation and effects:
   https://developer.mozilla.org/en-US/docs/Web/API/AudioParam
   https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
   https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode
   https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode
   https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode

6. Offline audio rendering:
   https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext/startRendering

7. Karplus–Strong explanation:
   https://crypto.stanford.edu/~blynn/sound/karplusstrong.html

8. Canvas paths, patterns, and compositing:
   https://developer.mozilla.org/en-US/docs/Web/API/Path2D
   https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createPattern
   https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation

---

# END OF UPGRADE SPECIFICATION
