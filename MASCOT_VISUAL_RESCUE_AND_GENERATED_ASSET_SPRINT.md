# MASCOT VISUAL RESCUE + GENERATED ASSET SPRINT

> Use this AFTER the two existing mascot master specifications.
> This is not a new architecture plan. It is a focused art-direction correction.

# CURRENT RESULT DIAGNOSIS

The current mascot is technically smooth but visually still reads as:

- a crescent/ribbon/leaf
- a long tapered procedural strip
- a cyan/magenta marble texture
- a detached or weakly attached white orb/core
- no stable face
- no obvious head/body anatomy
- no cute resting pose
- no readable hands/fins/ears
- no strong squash/landing performance
- insufficient connection between the character and the guitar strings

The clip demonstrates movement across the homepage, but it does NOT yet demonstrate the target feeling of a cute mascot living in the interface.

The next sprint must prioritize CHARACTER READABILITY over procedural complexity.

Do not add more random particles.

Do not make the body longer.

Do not increase texture density.

Do not declare the visual sprint complete until the character reads clearly in a single still frame.

---

# CRITICAL VISUAL BUG TO FIX FIRST

The white core/head currently appears visually detached from the body during motion.

Fix this before texture work.

The face/head must be rigidly derived from the first 2–4 head joints.

There must be no visible gap between:

- head silhouette
- face frame
- torso silhouette

Add an automated/debug invariant:

```text
distance(faceCenter, expectedHeadCenter) < allowedHeadOffset
```

In development, render the head frame and attachment points.

If the head can visually separate from the body, the character phase fails.

---

# REQUIRED NEW VISUAL DIRECTION

Transform the current ribbon into a compact creature with this hierarchy:

```text
HEAD
  large rounded head
  stable face
  two expressive side fins/ears

TORSO
  soft compact bean/manta body
  broadest near shoulders

TAIL
  shorter expressive taper
  secondary motion
  never visually dominates the body
```

Target proportion:

```text
head: 30%
torso: 42%
tail: 28%
```

The tail may stretch during sprint, but its neutral length should not make the character look like a ribbon.

---

# THE CHARACTER MUST PASS THESE STILL-FRAME TESTS

Capture all of these before proceeding:

1. neutral
2. curious
3. hard turn
4. falling
5. landing squash
6. bounce launch
7. sleeping/resting
8. 96px version

Every screenshot must clearly communicate:

- which end is the head
- where the eyes are
- where the body mass is
- where the tail starts
- what emotion/state is happening

If any screenshot looks like a coloured brush stroke, do not proceed.

---

# HYBRID ART STRATEGY

Do NOT create a pre-rendered animated mascot sprite sheet.

The rig and motion should remain procedural.

Use generated assets for SURFACE ART and FX.

Architecture:

```text
procedural rig
    ↓
stable vector/canvas body silhouette
    ↓
generated texture/decal layer clipped into body
    ↓
procedural face
    ↓
generated micro-detail / decals
    ↓
procedural rim/highlight
    ↓
generated FX sprites for rare events
```

This keeps motion fluid while making the surface feel authored.

---

# IMAGE GENERATION IS REQUIRED IN THIS SPRINT

First inspect available Claude Code/MCP/image tools.

If an image-generation tool is available:

- USE IT.
- Generate the assets listed below.
- Save them under the repository.
- Optimize and integrate them.
- Show actual file paths in the final report.

If NO image-generation tool is available:

DO NOT silently replace this requirement with procedural Canvas noise.

Instead:

1. Create:

```text
docs/mascot/GENERATED_ASSET_BLOCKER.md
```

2. Put every required generation prompt from this document into it.
3. Mark the image-generation phase BLOCKED.
4. Continue only with silhouette/face/rig work that does not depend on generated assets.
5. Do not claim the generated-asset sprint is complete.

---

# ASSET PACK TO GENERATE

Generate INDIVIDUAL source assets first.

Then pack them into atlases with a deterministic script.

Do not ask an image model to create a precise labelled sprite atlas with text.

## Asset A — Plush Terrazzo Decals

Output:

```text
public/mascot/generated/source/terrazzo-decals.png
```

Requirements:

- transparent background
- isolated irregular rounded patches
- small chips, blobs, crescents, dots
- premium toy/plush graphic language
- dominant muted lavender and deep violet
- accent cyan
- small hot-pink accents
- NO character
- NO text
- NO logos
- NO rectangular background
- high contrast only on a minority of marks
- usable as clipped body decals

Image-generation prompt:

```text
Create a transparent-background 2D decal sheet of original abstract terrazzo
and confetti shapes for a cute futuristic mascot. Isolated rounded organic
patches, small chips, dots, crescents and soft geometric fragments. Premium
designer-toy surface graphics, tactile and playful, not childish. Palette:
deep violet and muted lavender dominant, electric cyan secondary, sparse hot
pink accents, a few warm cream highlights. No character, no face, no text,
no logo, no background, no border, no shadows outside the individual decals.
Clean high-resolution flat graphic shapes suitable for clipping onto a moving
2D character body.
```

## Asset B — Constellation Freckle Decals

Output:

```text
public/mascot/generated/source/constellation-decals.png
```

Requirements:

- transparent
- tiny stars
- points
- short line clusters
- diamonds
- tiny spark crosses
- sparse composition
- no full constellation copied from a known logo

Prompt:

```text
Create a transparent-background decal collection for an original cute
constellation creature. Sparse tiny star points, four-point glints, small
diamonds, microscopic connected dot clusters, short elegant constellation
lines and a few tiny crescent motifs. Refined sci-fi editorial style, not
cartoon clip art. Warm cream, pale cyan and subtle lavender. Isolated elements
only. No character, no text, no zodiac symbols, no logos, no background.
```

## Asset C — Circuit Garden Decals

Output:

```text
public/mascot/generated/source/circuit-garden-decals.png
```

Prompt:

```text
Create a transparent-background collection of organic futuristic circuit
decals for a small procedural mascot. Rounded circuit traces, tiny junction
nodes, leaf-like branching paths, miniature signal bars, soft tech glyphs and
short curved routes. The feeling should blend botanical growth and electronic
schematics. Cyan, lavender, cream and sparse pink. Isolated decals, no text,
no letters, no logos, no full character, no background.
```

## Asset D — Soft Fabric / Velvet Microtexture

Output:

```text
public/mascot/generated/source/velvet-microtexture.webp
```

Requirements:

- seamless or visually tileable
- subtle
- mostly monochrome
- no obvious lighting direction
- no large features

Prompt:

```text
Generate a subtle seamless microtexture for a premium soft designer-toy
surface. Extremely fine velvet/felt grain with tiny fibres and soft mottling,
dark violet-gray base, very low contrast, no obvious directional lighting,
no seams, no objects, no text, no logos. Designed to be overlaid very subtly
inside a small 2D mascot silhouette.
```

## Asset E — Music / Resonance FX Decals

Output:

```text
public/mascot/generated/source/resonance-fx.png
```

Prompt:

```text
Create a transparent-background FX sprite collection for an original musical
sci-fi mascot. Isolated soft resonance rings, tiny spectral starbursts,
crescent pulses, short waveform arcs, delicate harmonic spark clusters and
small glowing impact petals. Cyan, cream, lavender and sparse magenta.
No literal music-note emoji, no text, no logo, no character, no background.
Effects must read cleanly at 16 to 64 pixels.
```

## Asset F — Strumrise Platform Ornament Decals

Output:

```text
public/mascot/generated/source/string-platform-ornaments.png
```

Prompt:

```text
Create a transparent-background ornament sheet for a futuristic musical
vertical platform game. Small tuning beads, glowing harmonic nodes, muted
string wraps, tiny fret markers, soft amplifier-like caps, constellation
charms and compact resonance emitters. Original abstract design, no real
guitar brand parts, no text, no logo, no character, no background. Dark
violet, warm cream, cyan and controlled magenta accents.
```

---

# OPTIONAL GENERATED FACE REFERENCE — DO NOT DIRECTLY ANIMATE IT

If image generation is available, optionally generate ONE visual concept sheet
only for art direction.

Do not use it as the production face sprite.

Prompt:

```text
Character design reference sheet for a tiny original futuristic musical
creature, compact manta-bean body with short tapering tail, oversized soft
head, two expressive side fins like ears, simple wide-set eyes, tiny mouth,
designer-toy proportions, cute but sophisticated, dark violet body with cyan
and magenta terrazzo accents, constellation freckles, warm cream face details.
Show neutral, curious, falling, squashed landing and sleepy poses. Clean
concept-art background, no text, no existing mascot resemblance, no logo.
```

Use this only as visual reference.

Production face remains vector/procedural so it deforms correctly.

---

# ASSET PROCESSING PIPELINE

After generation:

1. inspect every source image
2. reject watermarks, accidental text, logos, malformed shapes
3. crop transparent padding
4. resize to sensible maximum dimensions
5. convert opaque textures to WebP
6. retain PNG for transparency when appropriate
7. create atlas with a local script
8. create JSON metadata
9. measure final byte size
10. lazy-load with mascot/game chunk

Target:

```text
individual transparent decal source: <= 1024x1024
microtexture: 512x512 or 1024x1024
runtime atlas: one or two atlases, not many HTTP requests
```

Create:

```text
scripts/mascot/build-visual-atlas.mjs
```

Runtime outputs:

```text
public/mascot/generated/runtime/mascot-decal-atlas.webp
public/mascot/generated/runtime/mascot-decal-atlas.json
public/mascot/generated/runtime/resonance-fx-atlas.webp
public/mascot/generated/runtime/resonance-fx-atlas.json
```

Use PNG rather than WebP if alpha quality or tooling requires it.

Do not sacrifice correct transparency just to force one format.

---

# HOW TO APPLY GENERATED TEXTURES

Generated images MUST NOT be pasted onto the character in world coordinates.

Map decals to body-local coordinates.

Every decal instance:

```ts
interface BodyDecal {
  atlasId: string;
  u: number;
  v: number;
  scale: number;
  rotation: number;
  opacity: number;
  mirror: boolean;
  layer: number;
}
```

Where:

```text
u = head-to-tail position, 0..1
v = left-to-right position, -1..1
```

At runtime:

- evaluate spine at `u`
- calculate local tangent
- calculate normal
- calculate local half-width
- place decal at `normal * v * halfWidth`
- rotate with body frame
- scale with squash/stretch
- clip against body silhouette

This is the central requirement.

If the texture slides through the body during motion, it fails.

---

# TEXTURE HIERARCHY

Do not use all generated assets simultaneously.

Default appearance:

```text
base body: deep violet
microtexture: 8–15% opacity
terrazzo decals: 15–25 sparse instances
constellation freckles: 8–18 tiny instances
circuit accents: 2–5 routes only
structural procedural dots: sparse
resonance FX: events only
```

The current cyan/magenta coverage is too high.

Reduce saturated accent coverage substantially.

---

# FACE IMPLEMENTATION

The character needs a proper face before final texture review.

Required:

- two eyes OR one intentionally designed expressive core
- eyelids
- gaze
- small mouth
- optional cheek marks
- blink system

Recommended initial design:

```text
2 warm-cream eye whites / soft luminous eyes
small dark pupils
tiny cream mouth
very subtle pink cheek marks when happy
```

Do not use the current detached white sphere as the face.

If keeping the luminous orb motif:

- embed it into the head
- treat it as a chest/core light
- add separate eyes
- never let it float away from the silhouette

---

# FIN / EAR DESIGN

Add two side appendages attached near the head/shoulders.

Purpose:

- instantly makes the shape read as a creature
- creates emotion
- makes landing and sprint poses clearer
- provides a musical “harmonic touch” contact point

States:

```text
neutral -> relaxed outward
curious -> one slightly raised
sprint -> swept backward
fall -> raised
landing -> flattened outward
sleep -> folded inward
happy -> quick small flap
```

Use 1–2 procedural joints each.

Do not add complex FABRIK.

---

# TAIL CORRECTION

The current tail/body shape is too long and visually uniform.

Required:

- shorten neutral length
- create a clear tail-base transition
- taper faster
- use stronger delayed motion at tip
- reduce saturated texture toward tail
- use fewer decals near tip

The tail may extend visually during sprint through stretch and trails.

Neutral shape must remain compact.

---

# GUITAR STRING VISUAL FEEDBACK STILL NEEDED

From the current clip, crossing the homepage strings does not create a strong
readable physical response.

Required visual response:

1. local string displacement
2. wave travelling left/right
3. temporary contact glow
4. tiny resonance sprite from generated FX atlas
5. body reaction to string resistance
6. tail/fin follow-through
7. optional note label only in debug mode

The string should visibly bend by enough pixels to be obvious.

Do not make it look like a static line behind the character.

---

# MUSICAL CONTACT POSE

When touching a string:

```text
approach
-> body compresses slightly
-> string bends
-> face focuses
-> contact node glows
-> string releases
-> body rebounds
-> resonance FX appears
```

This 150–350ms micro-performance is more important than adding extra particles.

---

# GAME VISUAL ART STILL NEEDED

When Strumrise exists, do not reuse plain horizontal lines for every platform.

Use generated platform ornament decals selectively:

- harmonic node
- muted wrap
- boost bead
- checkpoint charm
- broken/dead-string mark

Platforms still remain primarily procedural strings for performance.

Generated art identifies FUNCTION.

---

# REQUIRED VISUAL QUALITY GATE

Do not proceed to final polish until a reviewer can answer YES to all:

```text
Is it clearly a creature?
Can I find the face in under 0.5 seconds?
Does it look cute in a still frame?
Does it still look cute with particles turned off?
Does texture remain attached while turning?
Is the tail secondary rather than dominant?
Does the string visibly react on contact?
Can I distinguish at least three expressions?
Does landing look like impact rather than path following?
Does it look authored rather than like raw procedural noise?
```

---

# REQUIRED DELIVERABLES

Create:

```text
docs/mascot/VISUAL_RESCUE_REPORT.md
docs/mascot/GENERATED_ASSET_MANIFEST.md
```

Asset manifest must include for every generated asset:

- source path
- runtime atlas path
- dimensions
- file size
- generation prompt
- purpose
- where it is used
- whether it is loaded on homepage or only in game

Visual report must include:

- before screenshot
- silhouette screenshot
- neutral
- curious
- fall
- landing
- rest
- 96px
- string contact
- performance delta

---

# FINAL CLAUDE CODE COMMAND

Use:

```text
Read @PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md,
@PROCEDURAL_MASCOT_MUSICAL_ASCENT_UPGRADE_MASTER_SPEC.md, and
@MASCOT_VISUAL_RESCUE_AND_GENERATED_ASSET_SPRINT.md in full.

The current implementation is technically smooth but still looks like a
cyan/magenta procedural ribbon rather than a cute character. The white
core/head can visually separate from the body and the long tail/body dominates
the silhouette. Fix character readability before adding more simulation.

This sprint has a hard requirement to use an available image-generation tool
for the specified texture/decal/FX source assets. Inspect available tools
first. If image generation is available, actually generate, optimize, pack,
and integrate the assets. Do not silently replace this requirement with more
procedural noise. If image generation is unavailable, create
docs/mascot/GENERATED_ASSET_BLOCKER.md containing the exact prompts and mark
that phase blocked instead of claiming it was completed.

Preserve the procedural rig. Do not create a pre-rendered animation sheet.
Build a compact body silhouette and stable procedural face, then use generated
assets as body-local decals and event FX. All generated body textures must be
mapped in local u/v coordinates so they remain attached during turns, squash,
stretch and game animation.

Shorten and rebalance the tail. Add two expressive fins/ears. Embed or replace
the current detached white orb so the head/face can never separate visually
from the body.

Make homepage guitar-string contact visually obvious with local deformation,
travelling waves, contact glow, body resistance and resonance FX.

Do not stop after code changes. Open the appearance/motion lab, capture the
required still states, run tests and production build, measure performance,
and write VISUAL_RESCUE_REPORT.md plus GENERATED_ASSET_MANIFEST.md.

Do not declare this sprint complete until the visual quality gate in the
document passes.
```
