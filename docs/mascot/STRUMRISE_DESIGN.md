# Strumrise design

Original vertical auto-bounce musical platformer, launched from the
homepage mascot. See `PROCEDURAL_MASCOT_MUSICAL_ASCENT_UPGRADE_MASTER_SPEC.md`
("GAME CONCEPT: STRUMRISE" onward) for the full spec this implements a
documented smaller MVP of.

## Scope reductions (documented smaller MVP)

The spec explicitly permits "at least three sectors or a clearly documented
smaller MVP." This build is the smaller MVP:

- **One sector** ("Open Strings" — wide, generous, tutorial-safe platforms,
  no hazards). Sectors 2-3 (Neon Fretboard, Resonance Sky) are backlog.
- **Three platform kinds** (`normal`, `bass`, `treble`) out of the spec's
  twelve. `harmonic`, `muted`, `slide`, `moving`, `fading`, `split`,
  `chord`, `boost`, `rest` are backlog — `GeneratedPlatform`/
  `StringPlatformKind` (`lib/mascot/game/GameTypes.ts`) are shaped so adding
  a kind later is additive, not a rewrite.
- **No powers, no hazards.** The spec says "Implement only a small stable
  set" for powers; this MVP implements none, keeping the reachability
  guarantees simple to prove. Resonance Shield / Double Bounce / Chord
  Burst etc. are backlog.
- **Phrase grammar simplified.** The spec's full grammar ("start on chord
  tone, move by scale step, repeat or answer, approach tension, resolve at
  rest platform") needs a `rest` platform kind this MVP doesn't have.
  `PlatformGenerator` instead does a bounded random walk over pentatonic
  scale degrees (±1/±2 steps, occasional repeats) — still musically
  coherent because the pentatonic scale (`HarmonyMap.PENTATONIC_DEGREES`)
  is robust to any ordering by construction (spec: "must still sound
  acceptable when only some platforms are hit").
- **Game mascot visual is a bespoke deformable ellipse**
  (`lib/mascot/game/GameMascotRenderer.ts`), not the homepage's full
  silhouette/print/rim/face pipeline (`appearance/SilhouetteRenderer.ts`).
  That pipeline's ribs/contour/face-frame are derived from
  `CreatureRig`/`PoseController`'s spine, which the game's dedicated
  physics root deliberately does not drive (spec: "Do not use the mascot's
  second-order pointer target as the game physics root... This separation
  is mandatory"). The game renderer reuses the same `AppearancePalette` and
  `BodyDeformation` shapes/values so the two still read as the same
  character.

## Architecture

All game logic lives in `lib/mascot/game/`, zero React, mirroring
`lib/mascot`'s existing simulation/rendering separation:

- `GameTypes.ts` — shared types (`AscentGameState`, `StringPlatformKind`,
  `AscentPlayerState`, `GeneratedPlatform`, `LandingFeedbackEvent`). Central
  type home for this subsystem, same role `types.ts` plays for the
  homepage mascot.
- `StrumriseConfig.ts` — every tuning constant (physics, generation, camera,
  score, lives, sector target, particle/voice caps), mirroring
  `MascotConfig.ts`'s role.
- `AscentGameState.ts` — `AscentGameController`, a dedicated finite-state
  machine (`inactive → transitioningIn → ready → playing ⇄ paused →
fallingOut → gameOver → ready`, `playing → sectorComplete → victory`).
  Deliberately **not** `BehaviorMachine` (spec: "Game mode must not reuse
  homepage behavior conditions in an uncontrolled way. Create a dedicated
  controller.").
- `AscentPhysics.ts` — explicit velocity integration (`integratePlayer`,
  `applyBounce`) plus the reachability math (`computeMaxJumpHeight`,
  `computeTimeToHeight`, `computeHorizontalReach`, `isReachable`). Pure
  functions, no class state, directly unit-tested.
- `LandingDetector.ts` — swept vertical collision
  (`detectLanding(previousY, currentY, velocityY, playerX, ...)`), the same
  "sign-change of position relative to a threshold between two samples"
  technique as `StringContactDetector.ts`, applied to a horizontal platform
  top instead of a string line. Never resolves an upward collision as a
  landing; a platform on cooldown or inactive is skipped.
- `PlatformGenerator.ts` — deterministic seeded generation
  (`SeededRandom`, never `Math.random()`). Reachability is computed from
  the **previous** platform's bounce speed (what actually launches the
  player toward the next one) — a documented, previously-present bug fixed
  during this pass had the reach math anchored to the constructor's
  unclamped center estimate instead of the ground platform's real clamped
  x, which let generated gaps be up to ~3x the true reach; see
  `tests/mascot/game/PlatformGenerator.test.ts`'s reachability property
  test, which now passes across 25 seeds × 60 platforms.
- `AscentCamera.ts` — soft, upward-only camera
  (`cameraY = min(cameraY, playerY - viewportHeight * followFraction)`,
  lerped). World Y decreases going up; the camera never scrolls back down
  even during a temporary dip, satisfying "platforms move downward in view
  while world coordinates remain stable."
- `ScoreDirector.ts` — height + landing + kind bonuses, combo multiplier
  (capped, decays after `comboResetSeconds` of silence). Chord completion,
  rhythm accuracy, collected glyphs, risky-edge bonuses are backlog.
- `StrumrisePersistence.ts` — safe `localStorage` read/write for best
  score, best height, and mute, with an injectable `StorageLike` so the
  parsing/fallback logic is unit-tested under plain Node (no `window`)
  without mocking globals.
- `StrumriseRuntime.ts` — the dedicated orchestrator, owning its own
  `FixedStepLoop` exactly like `MascotEngine` owns one for the homepage
  mascot. Emits two bounded, per-frame-cleared arrays the React layer
  drains: `musicalEvents` (`MusicalEvent[]`) and `landingEvents`
  (`LandingFeedbackEvent[]`).
- `GameMascotRenderer.ts` / `GamePlatformRenderer.ts` — pure canvas draw
  functions, no state.

## Physics and reachability

Player physics (`AscentPlayerState`) matches the spec's field list exactly.
Bounce is an instantaneous upward velocity impulse
(`STRUMRISE_CONFIG.physics.bounce.{normal,bass,treble}` — normal/bass share
640 px/s, treble is 690 px/s per spec's "treble: slightly higher bounce").
Horizontal movement uses real acceleration + drag, not direct velocity
control, so `computeHorizontalReach` needs a genuine kinematic bound
(constant acceleration to `maxHorizontalSpeed`, then constant speed) rather
than the over-claiming `maxSpeed * time`.

`PlatformGenerator.generateNext` computes, for each new platform: the
previous platform's max jump height, picks a gap `dy` within
`[minGapY, maxHeight * maxGapYFactor]`, computes the flight time to that
height, computes the horizontal reach for that time, and finally shrinks
that reach by `reachSafetyFactor` (0.82) before sampling `dx` uniformly
within it. `tests/mascot/game/PlatformGenerator.test.ts` verifies every
generated `(dx, dy)` pair against the **unshrunk** `isReachable` bound
(so the safety margin is proven, not assumed) across 25 seeds.

Safety rules implemented: first three platforms are always the generous
`normal` kind (spec: "no blind leaps"); no more than two consecutive
`treble` platforms (spec: "no long sequence of narrow platforms"); platform
x is always clamped within the viewport (spec: "mobile width affects
generation"). Recovery-platform-after-difficult-sequence and full
difficulty curves beyond the treble-streak cap are backlog.

## Musical mapping

Landings resolve a pentatonic note via
`resolvePortfolioModeNote(harmonyRootMidi, degreeIndex, octaveOffset)`
(`lib/mascot/music/HarmonyMap.ts`, already built for this upgrade — see
`docs/mascot/MUSICAL_MAPPING.md`), with `octaveOffset` -1 for bass, +1 for
treble. This produces a `MusicalEvent` directly (pan from contact position,
velocity from combo, brightness/damping/articulation from platform kind).

`MascotEngine` gained one new method for this,
`triggerMusicalEvent(event: MusicalEvent)`, which plays an
already-resolved event straight through the existing voice pool
(`MascotPluckVoicePool`), bypassing `DefaultNoteMapping`'s guitar-chord
lookup (`triggerStringPluck`'s path, correct for homepage string contacts
but wrong for the game's own pentatonic phrase). Both paths share the same
voice-capped audio engine — Strumrise does not duplicate an audio system.

## Camera, scoring, lives

Camera starts positioned so the player appears near the bottom of the
viewport (`cameraY0 = playerY - viewportHeight + startBottomMargin`) and
only ever moves up. A miss (falling `missMarginBelowCamera` past the
camera's bottom edge) costs a life and respawns the player at their last
grounded platform with a brief invulnerability window; at zero lives the
game transitions to `fallingOut` (a short timed free-fall, no swept
landings resolve during it) then `gameOver`. Reaching
`STRUMRISE_CONFIG.sector.heightTarget` transitions
`playing → sectorComplete → victory` (immediate, since this MVP has one
sector).

## React layer

- `components/strumrise/StrumriseOverlay.tsx` — owns the canvas and the
  `StrumriseRuntime` instance, keyboard (arrows/A-D/P/Escape/Enter/Space)
  and pointer-based touch input (`StrumriseControls.tsx`), drains
  `musicalEvents` into `engine.triggerMusicalEvent` each frame, locks
  `document.body.style.overflow` while mounted (spec: "no page scroll
  while interacting with game canvas"), and calls `engine.setSoundEnabled`
  from its mount effect — safe because that mount only ever happens as a
  direct result of the launch button's click (a real user gesture).
- `StrumriseHud.tsx` — score, combo, height %, lives, mute, pause. Never
  covers the playfield (fixed top bar only).
- `StrumriseMenu.tsx` — ready/paused/gameOver/sectorComplete/victory
  screens, always with an exit button.
- `StrumriseControls.tsx` — two large pointer zones for touch steering.

## Transition (Phase 8, small explicit version)

`components/mascot/StrumriseGate.tsx` renders the "Play Strumrise" launch
button (spec: "click a small 'Play Strumrise' control") and owns the
transition: on click it pauses the homepage `MascotEngine`, plays a brief
(~650ms) CSS tumble/fade on the button itself, then mounts
`StrumriseOverlay`. This is the documented smaller version named in task
"Phase 8, small explicit version" — a deliberate, non-instant, reduced-
motion-aware transition, not the spec's full simulated fall-through-the-
strings cascade. On exit, the overlay unmounts and the homepage engine
resumes.

## Performance budget adherence

- Visible platforms capped at `STRUMRISE_CONFIG.generation.maxActivePlatforms`
  (24, within spec's 18-30).
- No particle system added in this MVP (deferred along with hazards/powers
  that would use one) — spec's particle caps are a ceiling, not a
  requirement to spend.
- Audio voices flow through the existing `MascotPluckVoicePool`, already
  capped per quality tier (`MASCOT_CONFIG.audio.voicePoolCapacity`, 4-12).
- Strumrise's own code (`lib/mascot/game/*`, `components/strumrise/*`) is
  only reachable via `next/dynamic(..., { ssr: false })` from
  `StrumriseGate.tsx`, itself only rendered from `ProceduralMascotLoader`
  — confirmed code-split: `next build`'s `/` route size is unchanged from
  before this work (259 kB First Load JS).
- Homepage obstacle scanning is not explicitly paused during Strumrise
  (`DomObstacleRegistry` keeps running underneath); the homepage
  `MascotEngine` itself IS paused (`engine.pause("strumrise")`), which
  stops its own fixed-step loop and rendering — the dominant per-frame
  cost. Fully suspending `DomObstacleRegistry`'s scroll/resize listeners
  during game mode is backlog.

## Backlog (deliberately deferred)

- Sectors 2-3 (Neon Fretboard, Resonance Sky).
- Remaining platform kinds: harmonic, muted, slide, moving, fading, split,
  chord, boost, rest.
- Powers (Resonance Shield, Double Bounce, Magnet Note, Time Rubato,
  Harmony Wings, Chord Burst) and hazards (Dead String, Feedback Knot,
  Mute Cloud, Broken Fret, Tempo Pulse).
- Full phrase grammar (chord-tone start / step / answer / tension /
  resolve-at-rest).
- Rhythm-accuracy scoring layer (pulse ring, beat-timing bonus).
- Recovery-platform-after-difficult-sequence generation rule.
- Fully suspending `DomObstacleRegistry` while the game is active.
