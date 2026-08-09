---
name: building-musical-ascent-games
description: Builds and tunes an original vertical auto-bounce musical platform game using string platforms, deterministic reachable generation, swept landing collision, camera ascent, musical scoring, sectors, pause, retry, and mobile controls. Use when editing Strumrise game physics, platforms, generation, camera, score, musical progression, HUD, or game-state lifecycle.
---

# Workflow

1. Keep game root physics (`lib/mascot/game/AscentPhysics.ts`) separate
   from the mascot's procedural rig (`PoseController`) — the game root
   uses explicit fixed-step velocity integration; the rig follows the game
   root as a target, it is never the game's physics authority. This
   mirrors the base build's own rule (never let simulation and rendering
   share authority) applied to game vs. rig.
2. Use fixed-step velocity integration (reuse `lib/mascot/core/FixedStepLoop.ts`
   — do not build a second RAF loop for the game).
3. Use swept landing collision — a landing is only valid when the player
   was above the platform top last step and crosses it this step, moving
   downward, with horizontal footprint overlap. Never resolve an upward
   crossing as a landing.
4. Generate only reachable platforms (`PlatformReachability.ts`) — verify
   vertical intercept time and horizontal reachable interval under the
   player's actual movement envelope before accepting a candidate.
5. Assign notes through the musical director
   (`lib/mascot/music/MusicalDirector.ts`), not ad hoc in the generator.
6. Keep camera in separate coordinates: world, camera, screen — do not
   mutate a platform's world Y because the camera scrolled.
7. Add one platform type at a time; ship a smaller MVP (this repo's build
   targets one sector, three platform types) rather than a broken large
   one — an explicitly documented smaller scope is spec-compliant here.
8. Test keyboard, pointer, and touch input.
9. Keep mute gameplay-complete — no audio-only hazard or cue.
10. Cap platforms, particles, and voices per the performance budgets in
    `docs/mascot/PERFORMANCE.md`.
11. Test pause, exit, retry, and route cleanup — reuse the lifecycle
    checklist from `.claude/skills/integrating-next-canvas/references/lifecycle-checklist.md`.
12. Record playtest results in `docs/mascot/STRUMRISE_PLAYTEST.md`.

# Invariants

- No impossible generated route.
- No landing tunnelling at high fall speed.
- No page reload for retry.
- No audio-only hazard.
- No accidental game launch.
- No hidden exit.
- Muted play remains complete.

Read `references/reachability.md`, `references/musical-levels.md`, and
`references/game-feel.md` before tuning generation or feel.
