# V2 Redesign Status

Tracks `FINAL_MASCOT_HERO_TO_GAME_REDESIGN_MASTER_SPEC_V2.md`.
Supersedes Strumrise-as-primary-game and ribbon polish where they conflict.

## Current phase

Phases 0–11 substantially complete; Phase 12 polish partial; Phase 13
validation recorded in `FINAL_V2_REPORT.md`.

## Phase checklist

| Phase | Name                              | Status                         |
| ----: | --------------------------------- | ------------------------------ |
|     0 | Baseline                          | done                           |
|     1 | Character rescue                  | done                           |
|     2 | Facial matrix                     | done                           |
|     3 | Surface                           | done                           |
|     4 | Hero physical interactions        | done                           |
|     5 | String tension system             | done                           |
|     6 | Slingshot transition              | done                           |
|     7 | DOM shadow proxy fracture         | done                           |
|     8 | Resonance Weaver MVP              | done                           |
|     9 | Music and combo                   | done                           |
|    10 | Restore flow                      | done                           |
|    11 | Mobile / accessibility            | done (MVP)                    |
|    12 | Polish                            | partial — see deferred         |
|    13 | Validation + `FINAL_V2_REPORT.md` | done                           |

## Phase notes

### 1–3 Character / face / surface

- `musical-signal-familiar` compact recipe; Soft Signal Plush default
- `FacialMotionMatrix` velocity/drag/fall/string/collision driven face
- Embedded resonance core; muted print hierarchy

### 4–5 Hero life + string tension

- `HeroInteractionDirector` perch / slide / drag resistance
- `StringTensionGate` + `consumeSlingshotTrigger()`
- Hero markup: `data-mascot-perch`, `data-mascot-proxy`, interest hooks

### 6–7 Fracture

- `HeroFractureTransition` + `DomShadowProxyWorld` + Enter Resonance control
- No Start modal; semantic DOM preserved

### 8–11 Resonance Weaver

- `ResonanceWeaverRuntime`: steer, weave ≤3 strings, bounce, collect, combo
- Win → `beginRestore()`; Escape/Exit always restores; muted play OK
- Mobile: fewer proxies, pointer steer; reduced-motion soft fracture

## Deferred / known issues

- `MascotRuntime.ts` exceeds soft 500-line limit (~1330) — split later
- Motion-lab `?panel=resonance-weaver` dedicated debug panel not built
- Touch-first weave anchors UI minimal (shift-drag / secondary button)
- No interactive browser playtest session this pass (unit + verify only)
- Strumrise kept on disk, unwired from loader
- Generated texture atlas optional path unchanged

## Validation

- `npm run test:mascot`: 384 passing
- `node scripts/mascot/verify.mjs --fast`: typecheck/lint/format/test ✔
- Full `verify:mascot` (incl. build): see FINAL_V2_REPORT

## Next action

Optional polish + real browser playtest; split `MascotRuntime` if editing further.

## Decisions log

- V2 supersedes Strumrise as primary in-hero game
- npm + `test:mascot` / `verify:mascot` remain gates
- Preset id `cute-bean` kept; label Soft Signal Plush
- Loader wires `EnterResonanceControl` only
