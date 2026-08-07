# Upgrade final report

Response to `PROCEDURAL_MASCOT_MUSICAL_ASCENT_UPGRADE_MASTER_SPEC.md`,
written in the spec's own "COMPLETION RESPONSE FORMAT".

## Result

**Substantially complete with limitations.** All ten upgrade phases have
working, tested code: character appearance, musical guitar-string
integration, gesture-gated Web Audio, a deliberate drop-to-game transition,
and a playable Strumrise MVP (one sector, three platform kinds — a
documented smaller scope, not the full three-sector game). The main
limitation is that no real interactive browser session was available this
pass (same constraint as the base build) — everything below is verified by
unit tests, static analysis, and server-rendered smoke tests, not by
actually playing the game in a browser. See "Limitations."

## Character upgrade

- **Silhouette**: `appearance/SilhouetteRenderer.ts` draws a layered
  pipeline — filled body silhouette from `BodyContour.ts`'s three-zone
  (head/body/tail) contour widths, an internal gradient, a clipped
  procedural print, a rim stroke, then face features — replacing the base
  build's dot-only rendering with no filled shape.
- **Face**: `FaceRig.ts` computes a stable head-local coordinate frame
  (immune to spine jitter) that eyes/other features anchor to;
  `ExpressionController.ts` drives blink timing, pupil offset (toward
  pointer/interest target, clamped), and eye openness.
- **Pattern**: `PatternRecipes.ts` — three recipes (`terrazzo-confetti`,
  `constellation-freckles`, `soft-stripes`), local-space (u,v) marks bound
  to the rib rig via `LocalSkinCoordinates.ts` so they don't swim during
  deformation; rendered through `ProceduralPrint.ts`.
- **Palette**: `AppearancePresets.ts` — three presets (`cute-bean` / Night
  Candy, `signal-manta` / Signal Plush, `velvet-comet` / Deep Sea Toy),
  each one dominant colour + one support + a print accent pair, replacing
  the base build's equal-brightness cyan/magenta dot noise. Switchable live
  in `/motion-lab` via the new `MascotAppearancePanel.tsx`.
- **Expressions**: nine (`neutral`, `curious`, `happy`, `focused`,
  `surprised`, `squint`, `sleepy`, `dizzy`, `determined`), mapped from
  behavior (`mapBehaviorToExpression`) with smooth transitions (never an
  instant snap) and impact-wave-suppressed blinking.
- **Motion poses**: `BodyDeformation.ts`'s `BodyDeformationController`
  computes squash/stretch/tumble (`longitudinalScale`, `lateralScale`,
  `headSquash`, `tailStretch`, `finSpread`, `impactWave`,
  `tumbleRotation`) each frame from existing behavior/velocity signals —
  sprint stretches, avoid/scatter squash + tumble (bounded, never a
  constant spin), rest curls the tail inward.

## Musical strings

- **Registration**: `StringRegistry.ts` discovers homepage strings via
  `data-mascot-string-index`/`data-mascot-string-role` attributes on
  `StringInstrument.tsx`'s SVG paths (same DOM-discovery pattern as
  `DomObstacleRegistry`), refreshed on resize/mutation.
- **Visual physics**: contacts dispatch `STRING_CONTACT_EVENT`, a
  `CustomEvent` `StringInstrument.tsx` listens for and forwards straight
  into its own existing spring-damped bend + `strumString()` — the mascot
  gets real visual bend and real (already-tuned) audio "for free" without
  touching that delicate, already-shipped component's internals.
- **Contact types**: `core`, `tail`, `fin`, `landing`, `drag` — `landing`
  was reserved from the start for Strumrise's own use (see "Game" below).
- **Note mapping**: two modes. "Guitar mode" (`HarmonyMap.resolveGuitarModeNote`)
  reads the hero instrument's own `CHORDS` table read-only so mascot plucks
  stay in tune with whatever chord is currently played by hand. "Portfolio
  mode" (`resolvePortfolioModeNote`) is a robust minor-pentatonic scale for
  contexts with no literal string (Strumrise platforms).
- **Strum recognition**: `MusicalDirector.ts` groups 3+ distinct strings
  crossed in the same direction within a window into a recognized strum,
  with a decaying combo count.

## Audio

- **Activation**: `AudioGestureGate.ts` — the mascot's independent
  `AudioContext` is only ever created/resumed from inside a real
  user-gesture handler (`MascotSoundControl`'s click, or `StrumriseGate`'s
  launch click / `StrumriseOverlay`'s in-game mute button); never
  autoplayed.
- **Graph**: `AudioDirector.ts` owns the context; voices route through a
  `DynamicsCompressorNode`, with an optional lightweight delay-network send
  (`EffectsBus.ts`) gated off below "medium" quality.
- **Scheduler**: `AudioScheduler.ts`, `AudioContext.currentTime`-based,
  25ms lookahead, 0.1s schedule-ahead window, bounded queue.
- **Voice pool**: `MascotPluckVoicePool` over a generic `VoicePool.ts`
  (fills free slots first, then steals the oldest quiet-released voice,
  falling back to the oldest voice overall) — capacity 4 (reduced/low), 8
  (medium), 12 (high) per `MASCOT_CONFIG.audio.voicePoolCapacity`.
- **Fallback**: none needed — this is Prototype 2 (pre-rendered
  Karplus-Strong buffers), the same technique as the already-shipped hero
  instrument, reimplemented independently rather than sharing its graph.
- **Worklet**: **not used.** Phase 6 (AudioWorklet) is explicitly gated on
  "the prototype and profiling gates" per the spec, which require a
  listening/approval session — unavailable this pass. Prototype 2 remains
  the shipped implementation.
- **Mute**: `MascotEngine.setSoundEnabled`/`setMasterVolume`, persisted via
  `localStorage` (`mascot-sound-enabled`) independently of Strumrise's own
  `muted` preference (`strumrise:save`).
- **Measured voice count**: not measured — no real audio/browser session
  was available this pass to observe live voice-pool occupancy. Only the
  configured capacity ceiling above is known; do not treat it as a
  measured runtime value.

## Game

- **Launch**: `StrumriseGate.tsx` renders a small fixed "Play Strumrise"
  button (bottom-right, mirrors the sound control's bottom-left placement)
  inside `ProceduralMascotLoader`, disabled until the homepage mascot
  engine is ready.
- **Transition**: the click pauses the homepage `MascotEngine`, plays a
  ~650ms CSS tumble/fade on the button itself, then mounts
  `StrumriseOverlay` — a documented smaller version of the spec's fall-
  through-the-strings cascade (task "Phase 8, small explicit version").
  Instant (no animation) under `prefers-reduced-motion`.
- **Controls**: keyboard (arrow keys, A/D, P/Escape for pause, Enter/Space
  for start/resume/retry) and touch (two large left/right pointer zones,
  `StrumriseControls.tsx`); `document.body` scroll is locked while the
  overlay is mounted.
- **Physics**: explicit velocity integration (`AscentPhysics.ts`) — gravity
  1400 px/s², max fall speed 900, horizontal acceleration 2200 with drag,
  upward bounce impulses (640 normal/bass, 690 treble) — deliberately
  separate from the homepage mascot's second-order pointer-follow dynamics
  per the spec's explicit "This separation is mandatory."
- **Platforms**: three kinds this MVP (`normal`, `bass`, `treble`) of the
  spec's twelve — see `docs/mascot/STRUMRISE_DESIGN.md` "Scope reductions"
  for the full list of deferred kinds and why the type shapes still
  support adding them additively.
- **Generation**: deterministic, seeded (`SeededRandom`, never
  `Math.random()`), reachability-proven — `PlatformGenerator.ts` computes
  each gap's flight time and horizontal reach from the _previous_
  platform's actual bounce speed and position before sampling a position
  within a safety-shrunk bound. A real bug (reach math anchored to an
  unclamped estimate instead of the ground platform's true position,
  allowing gaps up to ~3x the true reach) was found and fixed via this
  property test during this pass.
- **Sectors**: one ("Open Strings") of the spec's three — see design doc.
- **Scoring**: height + landing + platform-kind bonuses, combo multiplier
  (capped at 12, decays after 2.2s of silence).
- **Persistence**: best score, best height, and mute preference in
  `localStorage` (`strumrise:save`), safely parsed (corrupt/wrong-shaped
  data falls back to defaults instead of throwing — unit-tested).
- **Exit**: HUD/menu exit button stops the runtime, saves best
  score/height, and resumes the homepage mascot engine.

## Files

**New — game logic** (`lib/mascot/game/`): `GameTypes.ts`,
`StrumriseConfig.ts`, `AscentGameState.ts`, `AscentPhysics.ts`,
`LandingDetector.ts`, `PlatformGenerator.ts`, `AscentCamera.ts`,
`ScoreDirector.ts`, `StrumrisePersistence.ts`, `StrumriseRuntime.ts`,
`GameMascotRenderer.ts`, `GamePlatformRenderer.ts`.

**New — game UI** (`components/strumrise/`): `StrumriseOverlay.tsx`,
`StrumriseHud.tsx`, `StrumriseMenu.tsx`, `StrumriseControls.tsx`,
`Strumrise.module.css`. Plus `components/mascot/StrumriseGate.tsx` +
`.module.css` (launch/transition).

**New — appearance** (`lib/mascot/appearance/`): `AppearanceConfig.ts`,
`BodyContour.ts`, `FaceRig.ts`, `LocalSkinCoordinates.ts`,
`PatternRecipes.ts`, `AppearancePresets.ts`, `ProceduralPrint.ts`,
`RimRenderer.ts`, `ExpressionController.ts`, `BodyDeformation.ts`,
`SilhouetteRenderer.ts`. Plus `components/mascot/MascotAppearancePanel.tsx`
(motion-lab appearance controls).

**New — music/audio** (`lib/mascot/music/`): `StringRegistry.ts`,
`StringContactDetector.ts`, `HarmonyMap.ts`, `NoteQuantizer.ts`,
`MusicalDirector.ts`, `AudioDirector.ts`, `AudioGestureGate.ts`,
`AudioScheduler.ts`, `DefaultNoteMapping.ts`, `EffectsBus.ts`,
`MascotPluckVoice.ts`, `VoicePool.ts`. Plus
`components/mascot/MascotSoundControl.tsx`.

**Modified**: `lib/mascot/types.ts` (appearance types, `MusicalEvent`,
`StringPluckEvent`, `triggerMusicalEvent`/appearance methods on the
`MascotEngine` interface), `MascotConfig.ts` (`appearance`/`audio`/
`strings` blocks), `MascotEngine.ts` (audio + appearance + game-music
wiring), `MascotRuntime.ts` (string-contact detection, appearance state,
squash/stretch/tumble), `rendering/CanvasMascotRenderer.ts`
(`drawAppearance` forwarder), `components/IntrectiveComponents/
StringInstrument.tsx` (additive `data-mascot-string-*` + contact-event
listener only — no changes to its existing bend/audio logic),
`components/mascot/ProceduralMascotLoader.tsx` (mounts
`StrumriseGate`/sound control), `app/motion-lab/page.tsx` (appearance
panel + sound control wired in).

**Tests**: 28 new test files this pass — `tests/mascot/appearance/*` (10
files), `tests/mascot/music/*` (11 files), `tests/mascot/game/*` (7 files,
60 test cases) — bringing the suite to 47 files / 330 test cases total, all
passing.

**Docs**: this file, `MUSICAL_MAPPING.md`, `AUDIO_ARCHITECTURE.md`,
`STRUMRISE_DESIGN.md`, `STRUMRISE_PLAYTEST.md`, `UPGRADE_STATUS.md`.

## Validation

```
npm run test:mascot
→ 330/330 passing (0 fail)

npx tsc --noEmit -p tsconfig.json
→ clean on all lib/mascot, components/mascot, components/strumrise,
  app/motion-lab, tests/mascot paths. Remaining errors are pre-existing,
  unrelated to this work (bladeshift/*, components/ScrollingText.tsx,
  components/ShiftingCountDown.tsx — none touched this pass).

npx eslint lib/mascot components/mascot components/strumrise tests/mascot app/motion-lab --ext .ts,.tsx
→ 0 errors, 0 warnings

npm run verify:mascot-upgrade
→ typecheck ✔  lint ✔  format ✔  test:mascot ✔  build ✔

npm run build
→ Compiled successfully. / route: 259 kB First Load JS (unchanged from
  before this work — confirms Strumrise/appearance/audio code is
  code-split, not bundled into the homepage's initial load).
  /motion-lab route: 109 kB (own size, separate from /).

npm run perf:mascot
→ No PixiJS/Three.js markers found in the client bundle.

npm run dev + curl (server-rendered smoke test)
→ GET / → 200, GET /motion-lab → 200. One pre-existing dev-mode
  React warning present (confirmed pre-existing in docs/mascot/PLAYTEST.md,
  not introduced by this work). No new errors.
```

## Performance

Measured: bundle sizes above (via `next build`'s own per-route report and
`scripts/mascot/perf-budget.mjs`). Config-declared, **not** live-measured:
voice-pool capacity ceilings, particle caps, max active platform count (24).

**Not measured** — no browser/profiler session available this pass:
real frame times (average/p95/worst), actual FPS during gameplay, live
audio voice occupancy, memory over a long game session. Do not treat any
of these as verified; see "Limitations" and
`docs/mascot/STRUMRISE_PLAYTEST.md`'s "Not verified" table.

## Limitations

- **No real interactive browser session this pass** — the single largest
  gap. Every claim about visual appearance, audio audibility, input feel,
  and game-flow correctness is based on unit tests, type/lint checks, code
  review, and a server-rendered HTTP smoke test, not on actually playing
  the game. See `docs/mascot/STRUMRISE_PLAYTEST.md`'s full "Not verified"
  table.
- **Strumrise is a documented smaller MVP**: one of three sectors, three
  of twelve platform kinds, no powers, no hazards, a simplified phrase
  grammar (bounded random walk over scale degrees instead of the full
  chord-tone/step/answer/tension/resolve grammar). See
  `docs/mascot/STRUMRISE_DESIGN.md` "Scope reductions" for the complete
  list and the reasoning for each.
- **AudioWorklet (Phase 6) was not built** — its gate (prototype
  listening approval) could not be met without a browser session; the
  shipped audio remains Prototype 2 (pre-rendered buffers).
- **`DomObstacleRegistry` is not fully suspended** while Strumrise is
  active; only the homepage `MascotEngine`'s own loop is paused. This is
  believed low-cost (registry updates are already throttled/event-driven,
  not per-frame) but not measured.
- **Measured audio voice count** and all runtime performance numbers are
  unavailable, as stated above — do not infer them from the configured
  caps.
- The game mascot's visual is a bespoke deformable ellipse, not the
  homepage's full silhouette/print/rim/face pipeline (a deliberate
  architectural decision, not an oversight — see design doc).

## How to test

1. `npm run dev`, open `/`.
2. Wait for the mascot to appear, click **Play Strumrise** (bottom-right).
3. Click **Start**, steer with arrow keys / A-D / touch drag; land on
   strings to hear notes (unmute via the in-game **Mute** button first if
   needed — this is the real user gesture that activates game audio).
4. **P** or **Escape** pauses; **Enter**/**Space** resumes or retries
   depending on the current screen.
5. Miss platforms to test life loss/respawn and eventual Game Over →
   Retry; climb to the height target to see the victory screen (lower
   `STRUMRISE_CONFIG.sector.heightTarget` in
   `lib/mascot/game/StrumriseConfig.ts` locally for a faster manual test).
6. **Exit to portfolio** returns to the homepage; the mascot should resume
   moving and the launch button should reappear.
7. Toggle OS-level "reduce motion" and repeat step 2 — the tumble
   transition should be skipped entirely.
8. `/motion-lab` — new **appearance** panel (top-right) live-switches
   palette presets, per-layer toggles, tuning sliders, and an expression
   override; the existing debug panel (bottom-right) is unchanged.
9. `npm run test:mascot` / `npm run verify:mascot-upgrade` / `npm run
perf:mascot` for the automated checks above.

## Next three improvements

1. **A real interactive/Playwright browser playtest pass** against the
   full acceptance-test list in the spec's "GAME ACCEPTANCE TESTS" and the
   "Not verified" table in `docs/mascot/STRUMRISE_PLAYTEST.md` — this is
   the highest-value next step given how much of this pass had to rely on
   static verification alone.
2. **Sectors 2-3 (Neon Fretboard, Resonance Sky) and the remaining
   platform kinds** (harmonic, muted, slide, moving, fading, split, chord,
   boost, rest), building on the already-additive `StringPlatformKind`
   shape.
3. **AudioWorklet (Phase 6) and a rhythm-accuracy scoring layer**, both
   explicitly gated in the spec on listening/profiling approval this pass
   couldn't obtain — worth revisiting once a browser session is available.
