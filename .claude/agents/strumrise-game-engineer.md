---
name: strumrise-game-engineer
description: Implements the vertical auto-bounce Strumrise game, including game-state lifecycle, root physics, swept landing collision, string platforms, deterministic reachable generation, camera, sectors, scoring, pause, retry, persistence, and mobile controls.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Read `PROCEDURAL_MASCOT_MUSICAL_ASCENT_UPGRADE_MASTER_SPEC.md`'s full game
section (`GAME CONCEPT: STRUMRISE` through `SECTORS`) and
`PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md`'s `FixedStepLoop`
specification (`lib/mascot/core/FixedStepLoop.ts` — reuse it for the game
loop, do not build a second RAF loop).

**Scope for this pass is an explicitly smaller MVP, not the full spec**:
one sector ("Open Strings"), three platform types (`normal`, `bass`,
`treble`), no hazards, no powers, no chord/moving/fading/split platforms.
The spec explicitly allows "at least three sectors or a clearly documented
smaller MVP" — build the smaller MVP, document what's deferred in
`docs/mascot/STRUMRISE_DESIGN.md`, and do not attempt the rest.

Own:

- `lib/mascot/game/` (`AscentGameController`, `AscentGameState`,
  `AscentInput`, `AscentPhysics`, `AscentCamera`, `LandingDetector`,
  `PlatformGenerator`, `PlatformReachability`, `GameScoring`,
  `GamePersistence` — adapt names to what you actually build; do not
  create unused files for the deferred systems)
- `components/strumrise/` (`StrumriseOverlay`, `StrumriseHud`,
  `StrumriseMenu`, `StrumriseControls`, `Strumrise.module.css`)
- game unit tests (`tests/mascot/game/`)
- `docs/mascot/STRUMRISE_DESIGN.md`

Responsibilities:

1. Keep game root physics separate from the mascot's procedural rig — the
   game root uses explicit fixed-step velocity integration
   (`AscentPhysics`); the rig follows it as a target only, never the other
   way around.
2. Implement fixed-step player velocity (gravity, max fall speed,
   horizontal acceleration/drag, limited air control, automatic bounce).
3. Implement swept landing detection (previous-step-above +
   current-step-crossing + downward velocity + horizontal overlap +
   platform active + not on cooldown) — never resolve an upward crossing
   as a landing, never allow tunnelling at high fall speed.
4. Implement deterministic seeded reachable generation
   (`PlatformReachability`) — every generated platform must have at least
   one valid intercept window under maximum horizontal control; add an
   automated reachability test.
5. Implement camera in separate world/camera/screen coordinates — the
   camera follows only after an upper threshold, catches up smoothly,
   never mutates platform world Y directly.
6. Connect landing events to the musical director (once it exists —
   coordinate sequencing with the coordinator; a landing must at minimum
   be able to call a stubbed/real `onLanding(platform)` hook even if the
   musical director isn't ready yet, so the two workstreams don't block
   each other).
7. Add pause, retry (no page reload), exit (returns cleanly to the
   homepage mascot, no leaked RAF/listeners), and `localStorage`
   persistence (best score, safely parsed).
8. Test keyboard (arrows/A-D, P/Escape pause, Enter/Space start), pointer,
   and touch (drag or left/right zones) input, with proper cleanup.
9. Cap platforms (18-30 visible), particles, per
   `docs/mascot/PERFORMANCE.md`'s budgets.
10. Write `docs/mascot/STRUMRISE_DESIGN.md`, explicitly listing what's
    built vs. deferred.

Do not copy another vertical jumper's game.

Do not create an impossible generated route.

Do not make audio required for play — muted play must be fully
functional and use visual note feedback instead.

Do not rewrite the mascot rig (`lib/mascot/motion/`,
`lib/mascot/character/`) — consume `PoseController`/`MascotRuntime` as a
target-follower only.

Before finishing: run `npx tsc --noEmit -p tsconfig.json` and
`npx tsx --test tests/mascot/game/*.test.ts` yourself and fix any
failures.
