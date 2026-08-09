# Visual rescue report

Response to `MASCOT_VISUAL_RESCUE_AND_GENERATED_ASSET_SPRINT.md`.

> **Update, later in the same session**: a Gemini API key was provided
> mid-session, resolving the image-generation blocker described below.
> All six planned assets were generated, keyed to real transparency,
> segmented, and packed into runtime atlases; the body-print decals
> (terrazzo + constellation) are now actually wired into
> `ProceduralPrint.ts`'s render loop via body-local `(u, v)` placement —
> full detail in `docs/mascot/GENERATED_ASSET_MANIFEST.md`, which
> supersedes this file's "image-generation phase is blocked" framing
> below. The rest of this report (proportions, fins, face invariant,
> string contact glow, and the still-unverified visual-quality-gate
> checklist) is unchanged and still accurate.

## Result: substantially complete, verification blocked

The procedural/silhouette/rig work this sprint asks for is implemented and
passes automated checks (typecheck, lint, 332/332 unit tests, production
build). **The still-frame visual quality gate itself was not verified** —
no browser-automation tool was available this session (same constraint
documented throughout this repo's `docs/mascot/PLAYTEST.md` and
`STRUMRISE_PLAYTEST.md`), so none of the eight required still-frame
captures (neutral, curious, hard turn, falling, landing squash, bounce
launch, sleeping/resting, 96px) were actually taken. **Do not treat the
"REQUIRED VISUAL QUALITY GATE" checklist in the spec as passed** — it
requires a human or a rendered screenshot to answer, and neither was
available. See "What was NOT verified" below for the honest list.

The image-generation phase is **blocked** — see
`docs/mascot/GENERATED_ASSET_BLOCKER.md`. No image-generation tool exists
in this environment. Nothing in this pass fakes a generated asset with
procedural noise labeled as if it were authored artwork; every surface
drawn below is openly still procedural Canvas 2D.

## Diagnosis: what was already fixed before this sprint started

Before touching anything, I inspected the current rig/appearance code
(built during this session's earlier upgrade-spec pass, before this visual-
rescue spec existed) against the spec's complaints, since a prior clip may
have predated that work:

- **"White core/head visually detached from body"** — the mechanism this
  bug required (a separate `drawCore()` circle positioned at
  `pose.getRoot()`, independent of the dot skin) is no longer called from
  `MascotEngine.render()` at all; it's kept only as a `@deprecated`
  fallback method. The current pipeline (`appearance/SilhouetteRenderer.ts`)
  derives the face's luminous core, eyes, mouth, and cheeks all from one
  `FaceFrame` (`appearance/FaceRig.ts`), itself a centroid of the
  head-region ribs computed fresh every frame — architecturally, the face
  cannot separate from the silhouette, because they're both derived from
  the same rib array in the same frame. This is exactly the spec's own
  suggested fix ("embed it into the head, treat it as a chest/core light,
  add separate eyes, never let it float away from the silhouette").
  I added an automated regression test for this specific invariant (see
  below) rather than trusting that the architecture stays this way forever.
- **"No stable face"** — already built: nine expressions, eyelids, gaze,
  mouth, cheek marks, all face-frame-relative (`FaceRig.ts`,
  `ExpressionController.ts`).
- **Head/torso/tail proportions** — the existing `BodyContour.ts` already
  implemented a three-zone width-shaping system (not present in the base
  spec, added during the earlier upgrade pass) with zones close to but not
  matching the new spec's exact 30/42/28 target (it was 30/36/34). Retuned
  to match exactly — see below.

## What this pass actually changed

### 1. Silhouette proportions retuned to the spec's exact target

`lib/mascot/appearance/BodyContour.ts`: `zones.torsoEnd` changed from
`0.66` to `0.72`, making the width-shaping zones exactly
head 30% / torso 42% / tail 28% (was 30/36/34 — the tail zone was 6 points
too wide before). One-line, low-risk config change; no existing test
hardcoded the old value.

### 2. Fin/ear appendages added (new — previously did not render)

The rig already simulated two "antennae" as 4-segment Verlet chains near
the head (`MascotRuntime.antennaeLeft`/`antennaeRight`), but **nothing
ever drew them** — confirmed via `grep` across every renderer file before
writing new code. They existed only as invisible physics.

- `lib/mascot/appearance/SilhouetteRenderer.ts`: added `drawFin()`, a
  tapered-teardrop fill from each chain's root to tip (quadratic curve,
  `palette.base` fill, `palette.rim` outline) — no new solver, no FABRIK,
  per the spec's explicit "Use 1-2 procedural joints each. Do not add
  complex FABRIK." Gated on the existing `layers.silhouette` toggle (no new
  `AppearanceLayerName` was added — kept the change additive and narrow).
- `lib/mascot/MascotRuntime.ts` (`updateSecondaryMotion`): the fin chains'
  root pin is now biased by two _existing_ computed signals instead of a
  fixed perpendicular offset: forward speed (sweeps the fins back during
  sprint) and `BodyDeformation.finSpread` (already computed per-behavior in
  `BodyDeformation.ts` — spread wide during avoid/scatter, folded close
  during rest/dormant — but previously never wired to anything). This
  reuses the chain's own gravity/drag Verlet physics for all the actual
  settling motion; no new state machinery.
- `lib/mascot/MascotEngine.ts`: passes the two chains' point arrays into
  `drawAppearance()`.

This covers the spec's fin/ear state table (neutral/relaxed, sprint/swept-
back, avoid-scatter/spread, rest/folded) through two real signals rather
than a hand-authored per-state table — "happy/quick flap" and "curious/one
slightly raised" (asymmetric single-fin states) are **not** implemented;
see Limitations.

### 3. Automated head-attachment invariant (spec-required)

Added to `tests/mascot/appearance/FaceRig.test.ts`, implementing the
spec's literal requirement — `distance(faceCenter, expectedHeadCenter) <
allowedHeadOffset` — as two real tests:

- a still-pose case, and
- a hard-turn case (three conflicting spine targets in sequence, matching
  the spec's specific worry that the face could separate "during motion").

`expectedHeadCenter` is computed independently in the test (a plain,
unbiased centroid of the head-region ribs), not by calling into
`computeFaceFrame`'s own logic, so the test is a real regression guard
rather than a tautology. Both pass with the face frame within 24px of the
head centroid (`allowedHeadOffset`), comfortably inside the frame's
intentional forward nose-bias and comfortably below what the old
pose-root-anchored core would have produced.

### 4. String contact glow (new — the spec's "temporary contact glow")

`components/IntrectiveComponents/StringInstrument.tsx`: added a `glow`
field to each string's existing ref-driven motion state (not React state —
same imperative-per-frame pattern the component already uses for `bend`),
set to `1` at the exact moment a note actually plays (`strumString`,
`releaseString` with sound) and decayed each animation frame
(`Math.pow(0.88, elapsed)`, ~a few hundred ms visible pulse), rendered as a
small blurred `<circle>` riding the string's own current bend point. Zeroed
under `prefers-reduced-motion`, matching the component's existing reduced-
motion handling for `bend`/`velocity`. This is the one new visual layer
from the spec's "MUSICAL CONTACT POSE" list that didn't already exist in
some form (the string's spring-damped bend, real Karplus-Strong pluck
audio, and mascot-to-string contact routing were all already built during
the earlier upgrade-spec pass — see `docs/mascot/MUSICAL_MAPPING.md` and
`AUDIO_ARCHITECTURE.md`). Traveling-wave-to-both-ends and a resonance-
sprite overlay are backlog — see Limitations.

## What was NOT changed (already adequate or out of scope this pass)

- **String bend magnitude**: inspected `StringInstrument.tsx`'s existing
  `strumString`/`exciteString` bend formula (`direction * min(9 + force*8,
18)`, out of `MAX_BEND=26`) and the mascot-contact intensity curve
  (`StringContactDetector.ts`, `(|velocityY|/900)^0.6`). Both already
  produce a moderate-to-strong bend for a typical mascot contact — this
  reads as adequately tuned by inspection, not as the "static line" the
  spec complains about. Not retuned further without a way to actually see
  it move.
- **Local displacement / traveling wave to both string ends**: the
  existing string model is a single quadratic-bezier control point (one
  bend value per string), not a multi-segment string — a genuine
  travelling-wave visual would need a real segmented/modal string model
  (the spec's own "Option A: damped control points" or "Option B: modal
  string approximation"), which is a materially bigger change than this
  pass's scope. Documented as backlog, not attempted partially.
- **Resonance FX sprite at contact**: blocked on generated assets (a
  procedural substitute could be built, but the spec explicitly says "USE
  IT" / "DO NOT silently replace this requirement with procedural Canvas
  noise" for the _decal/FX asset_ requirement specifically — the contact
  glow above is a distinct, already-procedural interaction cue, not a
  substitute for the FX sprite).
- **Generated decal/texture assets** (terrazzo, constellation, circuit,
  velvet microtexture, platform ornaments): blocked, see
  `GENERATED_ASSET_BLOCKER.md`.

## Files changed

- `lib/mascot/appearance/BodyContour.ts` — zone retune (1 line + comment).
- `lib/mascot/appearance/SilhouetteRenderer.ts` — `fins` field on
  `AppearanceRenderInput`, `drawFin()`, call site.
- `lib/mascot/MascotRuntime.ts` — fin root pin bias in
  `updateSecondaryMotion`.
- `lib/mascot/MascotEngine.ts` — passes `fins` into `drawAppearance()`.
- `components/IntrectiveComponents/StringInstrument.tsx` — `glow` field,
  `drawGlow()`, trigger points, glow `<circle>` elements.
- `components/IntrectiveComponents/stringInstrument.module.css` —
  `.stringGlow`.
- `tests/mascot/appearance/FaceRig.test.ts` — 2 new invariant tests.
- New: `docs/mascot/GENERATED_ASSET_BLOCKER.md`,
  `docs/mascot/GENERATED_ASSET_MANIFEST.md`, this file.

## Validation

```
npm run test:mascot        → 332/332 passing (was 330; +2 invariant tests)
npx tsc --noEmit -p tsconfig.json
                            → clean on every file touched this pass
                              (pre-existing unrelated errors elsewhere untouched)
npx eslint lib/mascot/appearance lib/mascot/MascotRuntime.ts \
  lib/mascot/MascotEngine.ts components/IntrectiveComponents/StringInstrument.tsx \
  tests/mascot/appearance --ext .ts,.tsx
                            → 0 errors, 0 warnings
npm run build               → succeeds; / route unchanged at 259 kB First
                              Load JS (no new bundled weight — everything
                              added this pass is procedural code, not assets)
npm run dev + curl           → GET / → 200, GET /motion-lab → 200, no new
                              console/compile errors beyond the pre-existing
                              documented forwardRef dev warning
```

## Performance

No new render layers were added to the hot per-frame allocation path: `drawFin`
reuses the already-simulated Verlet node arrays (zero new allocations), the
string glow reuses the string's own existing per-frame `requestAnimationFrame`
loop (already running whenever a string is moving), and the bundle-size
evidence above confirms no new asset weight. No frame-time profiling was
performed (no browser session) — do not treat this as a measured performance
claim, only as evidence nothing structural changed.

## What was NOT verified (honest gap — do not treat as passing)

Every item in the spec's "REQUIRED VISUAL QUALITY GATE" and "CHARACTER MUST
PASS THESE STILL-FRAME TESTS" sections requires visually inspecting a
rendered frame. None of the following were checked:

| Requirement                                                                                    | Status                                                                  |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Neutral/curious/hard-turn/falling/landing/bounce/sleeping/96px still frames actually captured  | Not verified — no browser                                               |
| "Is it clearly a creature?"                                                                    | Not verified                                                            |
| "Can I find the face in under 0.5 seconds?"                                                    | Not verified                                                            |
| Fins visually read as ears/fins rather than stray lines at the chosen `FIN_BASE_WIDTH` (3.4px) | Not verified — this specific constant is an estimate, not a tuned value |
| Tail no longer visually dominates after the 30/42/28 retune                                    | Not verified                                                            |
| String bend is "obviously" visible at actual rendered SVG size                                 | Not verified                                                            |
| Contact glow reads as intentional rather than a stray dot                                      | Not verified                                                            |
| Reduced-motion mode still looks like the same character                                        | Not verified                                                            |

## How to test manually

1. `npm run dev`, open `/motion-lab` — use the appearance panel (top-right)
   to inspect the silhouette with dots/print/rim toggled off to judge the
   retuned proportions and new fins in isolation.
2. Trigger `sprint`/`avoid`/`scatter`/`rest` behaviors via the debug panel's
   scenario player to see the fin sweep-back/spread/fold behavior.
3. On `/`, interact with the hero guitar strings (or let the mascot cross
   one) and look for a brief warm glow pulse at the pluck point, in
   addition to the existing string bend and audio.
4. Run the automated checks listed under Validation above.

## Next three improvements

1. **A real interactive/screenshot-capable session** to actually perform
   the spec's still-frame tests and quality-gate checklist — everything in
   this report is verified by code/tests, not by looking at it, which is
   the sprint's actual stated bar.
2. **A segmented/modal string model** so string contact produces a real
   travelling wave to both ends instead of a single bend point — the
   biggest remaining gap between the current string visual and the spec's
   "MUSICAL CONTACT POSE" description.
3. **Generated decal/texture/FX assets**, once an image-generation tool is
   available — see `GENERATED_ASSET_BLOCKER.md` for the exact prompts,
   already staged and ready to run.
