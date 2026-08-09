# Generated asset blocker

**RESOLVED — see `docs/mascot/GENERATED_ASSET_MANIFEST.md`.** A Gemini API
key was provided mid-session, unblocking this phase. All six assets below
were generated, processed, and packed into runtime atlases; the manifest
documents exactly which ones made it into actual rendering versus which
are packed-but-not-yet-wired. This file is kept as a historical record of
the original blocker and the exact prompts used — the "To unblock" section
below no longer applies.

---

`MASCOT_VISUAL_RESCUE_AND_GENERATED_ASSET_SPRINT.md` has a hard requirement
to use an available image-generation tool for a specific set of decal/FX
source assets, and explicitly forbids silently substituting procedural
Canvas noise if no such tool exists.

**This phase was BLOCKED at the time of the original visual-rescue pass.**
No image-generation tool (text-to-image synthesis) was available in that
session — only Bash/Read/Write/Edit, a Figma MCP server (design-file
manipulation, not text-to-image generation), and an Atlassian/Jira MCP
server. None of those generate a raster image from a text prompt.

Per the spec's own instructions, the character-silhouette/face/rig work
that does **not** depend on generated assets proceeded anyway at the time
(see `docs/mascot/VISUAL_RESCUE_REPORT.md`'s earlier sections). That
constraint no longer holds — see the RESOLVED note above.

## Exact prompts to use once an image-generation tool is available

### Asset A — Plush Terrazzo Decals

Output: `public/mascot/generated/source/terrazzo-decals.png`

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

### Asset B — Constellation Freckle Decals

Output: `public/mascot/generated/source/constellation-decals.png`

```text
Create a transparent-background decal collection for an original cute
constellation creature. Sparse tiny star points, four-point glints, small
diamonds, microscopic connected dot clusters, short elegant constellation
lines and a few tiny crescent motifs. Refined sci-fi editorial style, not
cartoon clip art. Warm cream, pale cyan and subtle lavender. Isolated elements
only. No character, no text, no zodiac symbols, no logos, no background.
```

### Asset C — Circuit Garden Decals

Output: `public/mascot/generated/source/circuit-garden-decals.png`

```text
Create a transparent-background collection of organic futuristic circuit
decals for a small procedural mascot. Rounded circuit traces, tiny junction
nodes, leaf-like branching paths, miniature signal bars, soft tech glyphs and
short curved routes. The feeling should blend botanical growth and electronic
schematics. Cyan, lavender, cream and sparse pink. Isolated decals, no text,
no letters, no logos, no full character, no background.
```

### Asset D — Soft Fabric / Velvet Microtexture

Output: `public/mascot/generated/source/velvet-microtexture.webp`

```text
Generate a subtle seamless microtexture for a premium soft designer-toy
surface. Extremely fine velvet/felt grain with tiny fibres and soft mottling,
dark violet-gray base, very low contrast, no obvious directional lighting,
no seams, no objects, no text, no logos. Designed to be overlaid very subtly
inside a small 2D mascot silhouette.
```

### Asset E — Music / Resonance FX Decals

Output: `public/mascot/generated/source/resonance-fx.png`

```text
Create a transparent-background FX sprite collection for an original musical
sci-fi mascot. Isolated soft resonance rings, tiny spectral starbursts,
crescent pulses, short waveform arcs, delicate harmonic spark clusters and
small glowing impact petals. Cyan, cream, lavender and sparse magenta.
No literal music-note emoji, no text, no logo, no character, no background.
Effects must read cleanly at 16 to 64 pixels.
```

### Asset F — Strumrise Platform Ornament Decals

Output: `public/mascot/generated/source/string-platform-ornaments.png`

```text
Create a transparent-background ornament sheet for a futuristic musical
vertical platform game. Small tuning beads, glowing harmonic nodes, muted
string wraps, tiny fret markers, soft amplifier-like caps, constellation
charms and compact resonance emitters. Original abstract design, no real
guitar brand parts, no text, no logo, no character, no background. Dark
violet, warm cream, cyan and controlled magenta accents.
```

### Optional — face concept reference (art direction only, never animated)

```text
Character design reference sheet for a tiny original futuristic musical
creature, compact manta-bean body with short tapering tail, oversized soft
head, two expressive side fins like ears, simple wide-set eyes, tiny mouth,
designer-toy proportions, cute but sophisticated, dark violet body with cyan
and magenta terrazzo accents, constellation freckles, warm cream face details.
Show neutral, curious, falling, squashed landing and sleepy poses. Clean
concept-art background, no text, no existing mascot resemblance, no logo.
```

## To unblock

1. Confirm an image-generation tool/MCP server is connected and available
   to Claude Code in this environment.
2. Re-run the generation step with the prompts above, one asset at a time.
3. Inspect every result for watermarks, accidental text, logos, or
   malformed shapes before accepting it — reject and regenerate if found.
4. Follow the processing pipeline in
   `MASCOT_VISUAL_RESCUE_AND_GENERATED_ASSET_SPRINT.md` ("ASSET PROCESSING
   PIPELINE" and "HOW TO APPLY GENERATED TEXTURES") to crop, resize,
   convert, atlas, and map each asset into body-local `u`/`v` decal
   coordinates — never world-space placement.
5. Update `docs/mascot/GENERATED_ASSET_MANIFEST.md` with real source/atlas
   paths, dimensions, and file sizes once assets exist, and remove this
   blocker note.
