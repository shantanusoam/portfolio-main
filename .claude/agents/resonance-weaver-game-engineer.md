---
name: resonance-weaver-game-engineer
description: Builds the in-hero Resonance Weaver physics game using DOM shadow proxies, falling hero fragments, player-created musical strings, bounce physics, collection, combo, restoration, responsive controls, and clean page recovery.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Own the Resonance Weaver game modules and tests.

Read first:

- `FINAL_MASCOT_HERO_TO_GAME_REDESIGN_MASTER_SPEC_V2.md` sections 12–35 and 48–49
- `.claude/CLAUDE.md`
- `docs/mascot/IMPLEMENTATION_STATUS.md` and any `docs/mascot/V2_STATUS.md`
- existing `lib/mascot/game/` (Strumrise MVP) — reuse fixed-step loop, scoring
  patterns, and persistence ideas where they fit; do not preserve the
  vertical-ascent platform loop as the primary game

Requirements:

- preserve semantic DOM
- use snapshot proxy objects (`DomShadowProxy` / curated fragment set)
- never measure DOM during game frames
- separate game-root physics from procedural character deformation
- bound fragment and string counts (see V2 §49)
- support muted play
- restore hero exactly
- no page reload
- no modal-style start screen
- test desktop and touch

Own (adapt names to what you build; do not create unused stubs):

- `lib/mascot/game/` Resonance Weaver modules (state, physics, fragment
  proxies, string weaving, collection, restore, camera, input)
- overlay/HUD components under `components/mascot/` or `components/resonance-weaver/`
- `tests/mascot/game/` for new systems
- `docs/mascot/RESONANCE_WEAVER_DESIGN.md`

Hard rules:

1. Reuse `FixedStepLoop` — do not add a second RAF loop.
2. Game root uses explicit velocity integration; the rig follows as a target.
3. Snapshot hero geometry once at fracture; fade live DOM visually; simulate
   only Canvas proxies after that.
4. Cap temporary player strings (≤3) and proxy fragments (18–35).
5. Prefer evolving or replacing Strumrise entry paths (`StrumriseGate`,
   modal menus) so entry is slingshot/snap + accessible trigger only.
6. Document deferred full-spec features clearly rather than shipping a
   broken half-game.
