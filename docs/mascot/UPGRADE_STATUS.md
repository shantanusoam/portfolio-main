# Current upgrade phase

Complete (all ten upgrade phases) — substantially complete with
limitations, see `docs/mascot/UPGRADE_FINAL_REPORT.md` for the full
completion report. This file is kept as the Phase-0 baseline record below;
it is not updated further per-section.

# Baseline findings (Phase 0)

- Working tree was clean before this upgrade except for the two spec files
  the user added at the repo root
  (`PROCEDURAL_MASCOT_MUSICAL_ASCENT_UPGRADE_MASTER_SPEC.md` and an
  accidental `-1` duplicate, both untracked, left untouched).
- Last commit (`ddc39b1`) is the full base mascot subsystem from the first
  master spec — see `docs/mascot/FINAL_REPORT.md` for what it contains.
  131 unit tests, production build passing, no real browser session was
  used for that pass either.
- **The homepage guitar strings already exist and are already a real,
  working, well-tuned instrument** — this changes the scope of Phase
  4/5/6/7 significantly from a from-scratch build to an integration:
  - `components/IntrectiveComponents/StringInstrument.tsx` (450 lines):
    6 SVG `<path>` strings inside a `viewBox="0 0 1000 240"`, spring-damped
    bend animation, pointer pull/strum + keyboard (keys 1-6), 4-chord
    system (`CHORDS` in `stringSynth.ts`), reduced-motion aware, accessible
    (`aria-live` status, labelled group).
  - `components/IntrectiveComponents/stringSynth.ts` (132 lines): an
    **already-working Karplus-Strong-style pre-rendered `AudioBuffer`**
    pluck voice (`createKarplusStrongBuffer` + `playPhysicalString`,
    exported and reusable), lowpass filter envelope, per-note gain
    envelope, stereo pan by contact X, proper node cleanup on `ended`.
    This is materially equivalent to the upgrade spec's own "Prototype 2:
    pre-rendered procedural pluck buffers" — already done, already tuned
    (see `TASK.md`'s "Discovered During Work" notes on this component's
    history), and **must not be modified** (it's a delicate, already-shipped
    interaction other users already rely on).
  - Mounted inside `components/Hero.tsx:201`, so it lives in the hero
    section — reachable by the mascot on initial page load.
  - **Decision**: do not build a parallel `AudioDirector`/pluck-voice system
    that duplicates this. Reuse `CHORDS` (frequencies) read-only for note
    identity so mascot-triggered notes stay in tune with whatever chord the
    user is currently playing by hand. Give the mascot's contact-triggered
    plucks their own small Karplus-Strong-style buffer voice (same
    technique, independently owned, connected to the mascot's own master
    bus) rather than sharing `stringSynth.ts`'s internals — avoids any risk
    to the existing, tuned component. `StringInstrument.tsx` gets one
    additive, low-risk change: `data-mascot-string-index` markup on each
    path (read-only discovery, mirrors the existing
    `DomObstacleRegistry` pattern) plus a `forwardRef` imperative handle so
    a mascot contact can also visually bend the _real_ string instead of a
    separate mascot-only visual.
- Current mascot appearance (`lib/mascot/character/{BodyProfile,CreatureRig,
DotSkin,Expressions,CreatureRecipe}.ts`, rendered via
  `MascotEngine.render()`) is exactly what the upgrade spec diagnoses:
  dot-only rendering (no filled silhouette), a single white core circle
  with no face structure, uniform-brightness dot groups, no local-space
  print, no squash/stretch/tumble deformation beyond `stateStretch` in
  `DotSkin.getDotDeformation()`. This is the target of Phases 1-3.
- 7 mascot agents and their skills already exist from the base build
  (`mascot-coordinator`, `rig-engineer`, `render-engineer`,
  `interaction-engineer`, `motion-director`, `performance-verifier`,
  `playtest-agent`). Adding the 6 new upgrade-spec agents and 5 new skills
  alongside them, not replacing them.
- No Web Audio, game, or appearance code exists yet in `lib/mascot/` beyond
  what's described above (verified via `find`/`grep`, not assumed).

# Character appearance

Not started (in progress — delegated to character-art-engineer).

# Musical strings

Not started (string registry/contact detection — coordinator, after
appearance/audio land).

# Audio

Not started (in progress — delegated to audio-dsp-engineer). Prototype 1/2
scope only; AudioWorklet (Phase 7) explicitly deferred — no browser
listening session is available to gate it on.

# Transition

Not started.

# Strumrise

Not started. Planned scope: **one sector ("Open Strings"), three platform
types (normal/bass/treble)** — a documented smaller MVP per the spec's own
allowance ("at least three sectors or a clearly documented smaller MVP"),
not the full three-sector game. Sectors 2-3, hazards, and powers are
explicitly deferred.

# Validation

Not run yet this pass.

# Performance

Not measured yet this pass.

# Known issues

Carried over from the base build (see `docs/mascot/IMPLEMENTATION_STATUS.md`):
no browser automation available, `MascotEngine` lifecycle has no direct
automated test, pre-existing repo-wide lint/type issues outside mascot
paths are untouched.

# Deferred gates

- AudioWorklet/Karplus-Strong-in-worklet (Phase 7): gate requires listening
  approval of the Prototype 1/2 interaction first — no browser session
  available this pass.
- Strumrise sectors 2-3, hazards, powers, remaining platform types
  (Phase 12 polish): explicitly deferred per spec's smaller-MVP allowance.
- PixiJS/GPU rendering: unchanged from the base build's gate — not met.

# Next action

Delegate character appearance (Phases 1-3) and the audio prototype
(Phase 5 core) to their respective subagents in parallel (disjoint file
sets: `lib/mascot/appearance/*` vs `lib/mascot/music/*`), review both
diffs, then build the string registry/contact detection myself since it
touches the existing `StringInstrument.tsx`.
