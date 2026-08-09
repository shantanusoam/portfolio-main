# Generated asset manifest

**Status: UNBLOCKED.** A Gemini API key was provided mid-session (a
Google Cloud / AI Studio key with access to `gemini-2.5-flash-image` and
the Imagen 4 family). All six planned assets were generated, keyed to real
alpha transparency, segmented into individual sprites, and packed into
runtime atlases. See `docs/mascot/VISUAL_RESCUE_REPORT.md` for how they're
actually wired into the render pipeline.

**Security note**: the key was pasted directly in chat. It was stored only
in `.env.local` (gitignored via the existing `.env*.local` pattern),
printed nowhere after that, and is not referenced by any bundled
application code (only by the one-off Python generation scripts below) —
but it should still be rotated in Google Cloud / AI Studio, since it now
exists in this conversation's history regardless of what this repo does
with it.

## Generation pipeline

1. **Generation** — `scripts/mascot/generate-asset.py <prompt-file> <output.png>`,
   calling `gemini-2.5-flash-image` via `generateContent`. The model does
   **not** reliably emit a real alpha channel when asked for a
   "transparent background" (it draws a literal checkerboard pattern as
   RGB pixels instead). Prompts instead request a single flat solid
   chroma-key colour background.
2. **Keying** — `scripts/mascot/key_and_crop.py`: samples the background
   colour from the image's own corners (not a hardcoded value), builds a
   distance-based soft alpha matte (clean anti-aliased edges, not a hard
   cutout), and crops to the opaque content's bounding box.
3. **Segmentation + packing** — `scripts/mascot/build_visual_atlas.py`:
   pure-Python (no numpy/scipy) flood-fill over a morphologically-closed
   copy of each sheet's alpha mask (bridges 1-3px gaps between a mark and
   its own drop shadow, or between touching petals, so one visual mark
   becomes one sprite instead of fragmenting — see the script's own
   comments for the concrete before/after counts this fixed), crops each
   component to its own sprite, then shelf-packs all sprites from a group
   of sheets into one atlas + JSON manifest, saved as lossless WebP.

Deviation from the spec: it names the packer `build-visual-atlas.mjs`
(Node). This repo stays deliberately dependency-light (see
`.claude/CLAUDE.md`'s testing section for the same principle applied to
test frameworks); adding an npm image-processing dependency (sharp/jimp)
for a one-time build script wasn't worth it when Python + Pillow — already
in use for generation/keying — does the job with zero new dependencies of
either kind. The script is `scripts/mascot/build_visual_atlas.py`.

## Source assets (`public/mascot/generated/source/`)

| Asset                           | Dimensions | Size    | Purpose                                                                              |
| ------------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------ |
| `terrazzo-decals.png`           | 941×942    | 1257 KB | Body surface print — terrazzo-confetti recipe                                        |
| `constellation-decals.png`      | 780×778    | 595 KB  | Body surface print — constellation-freckles recipe                                   |
| `circuit-garden-decals.png`     | 749×796    | 711 KB  | Body surface print — generated, **not yet wired to a preset** (see Limitations)      |
| `velvet-microtexture.png`       | 1024×1024  | 1135 KB | Full-frame subtle overlay texture — **not yet wired to rendering** (see Limitations) |
| `resonance-fx.png`              | 851×863    | 805 KB  | String/musical-contact FX sprites — **not yet wired to rendering** (see Limitations) |
| `string-platform-ornaments.png` | 300×855    | 370 KB  | Strumrise platform decoration — **not yet wired to rendering** (see Limitations)     |

Generation prompts: `scripts/mascot/prompts/*.txt` (one file per asset,
the exact text sent to the model, each derived from
`docs/mascot/GENERATED_ASSET_BLOCKER.md`'s original prompts plus the
chroma-key background instruction).

## Runtime atlases (`public/mascot/generated/runtime/`)

| Atlas                                     | Dimensions | Size   | Sprites                                                | Wired?                                                                                                               |
| ----------------------------------------- | ---------- | ------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `mascot-decal-atlas.webp` + `.json`       | 1024×1362  | 878 KB | 112 (terrazzo 37, constellation 57, circuit-garden 18) | **Yes** — `lib/mascot/appearance/GeneratedDecalAtlas.ts`, loaded by `MascotEngine`, consumed by `ProceduralPrint.ts` |
| `resonance-fx-atlas.webp` + `.json`       | 1024×346   | 152 KB | 64                                                     | No — packed and ready, no draw call yet                                                                              |
| `strumrise-ornament-atlas.webp` + `.json` | 1024×300   | 150 KB | 23                                                     | No — packed and ready, no draw call yet                                                                              |
| `velvet-microtexture.webp`                | 1024×1024  | 13 KB  | n/a (single texture)                                   | No — packed and ready, no draw call yet                                                                              |

Total runtime payload actually fetched by the homepage today: **~917 KB**
(`mascot-decal-atlas.webp` + `.json` only — the other three atlases exist
on disk but nothing references their URL yet, so browsers never request
them). Loaded via `fetch`/`Image`, not bundled JS — confirmed via
`next build`'s route sizes staying unchanged at 259 kB First Load JS for
`/`.

## How it's actually used

`GeneratedDecalAtlas` (browser-only, fire-and-forget `fetch` + `Image`
load, `isReady()` gates everything) is instantiated once in
`MascotEngine`'s constructor and passed into `drawAppearance()`. Inside
`ProceduralPrint.ts`'s existing mark-drawing loop — the same loop that
already resolves each `PatternMark`'s body-local `(u, v)` into a world
position/rotation via `resolveLocalPoint` every frame — each mark now
deterministically (via its own stable `seed`, never re-rolled) either
draws a generated sprite from the atlas in place of the procedural
ellipse, or falls back to the procedural ellipse if the atlas isn't ready
yet, failed to load, or the active preset's recipe has no generated
sheet. This satisfies the spec's central requirement directly: the
generated art is drawn through the _exact same_ body-local resolution
pipeline the procedural print already used, so it inherits the same
turn/stretch/squash/tumble attachment for free — nothing new to get wrong
there.

## Limitations (be honest about what's not done)

- **Only the body-print decals are wired to rendering.** `resonance-fx`,
  `velvet-microtexture`, and `string-platform-ornaments` were generated,
  keyed, and packed into ready-to-use atlases, but no draw call reads them
  yet:
  - `resonance-fx` needs wiring into the string contact-glow moment added
    in `docs/mascot/VISUAL_RESCUE_REPORT.md` (currently a procedural blurred
    circle, not a generated sprite) and/or the mascot's own landing/impact
    events.
  - `velvet-microtexture` needs a new low-opacity full-body overlay draw
    step (the spec's "8-15% opacity" guidance) — not added this pass.
  - `string-platform-ornaments` needs Strumrise's platform renderer
    (`lib/mascot/game/GamePlatformRenderer.ts`) to draw a sprite per
    platform kind instead of a plain line — not added this pass, and
    depends on resolving the Strumrise game-engineer agent's parallel,
    currently-unmerged work first (see the coordinator's own note on that
    in the main conversation).
- **`circuit-garden-decals` is generated and packed but not mapped to any
  appearance preset** — `RECIPE_TO_GENERATED_SHEET` in `ProceduralPrint.ts`
  only maps `terrazzo-confetti` and `constellation-freckles`;
  `soft-stripes` has no generated equivalent by design. Wiring
  circuit-garden would mean either adding a fourth preset or picking one
  of the existing three to combine it with.
- **Segmentation is good but not pixel-perfect.** A few sprites (visible
  on manual inspection of the packed atlas) are minor artifacts — one
  stray blurred-shadow-only fragment in the platform-ornament sheet with
  no real content, and a few of `circuit-garden-decals`'s leaf shapes have
  small circular dot patterns that could read as eyes at a glance (the
  spec says "No character" for these decals — this is a judgment call, not
  a clear violation, flagged here rather than silently accepted or
  unilaterally regenerated).
- **No real visual verification.** Same standing limitation as the rest of
  this session — no browser available, so "does this actually look good
  scattered across the mascot's body at runtime" was not checked, only
  "does the packed atlas contain what it should" (which was checked, by
  viewing the composited atlas images directly).

## Cost/quota note

Six successful generations + one failed (safety-blocked, explicitly not
charged per the API's own response) + one retry = **7 billed generation
calls** to `gemini-2.5-flash-image` on the provided key. No Imagen calls
were made (Imagen was available but not needed once
`gemini-2.5-flash-image` proved sufficient). Actual dollar cost was not
retrieved from Google Cloud Billing — check the project's billing console
for the real number if that matters.
