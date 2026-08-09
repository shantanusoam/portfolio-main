---
name: testing-audio-visual-interactions
description: Tests synchronized mascot visuals, guitar-string contacts, Web Audio activation and scheduling, voice limits, game transitions, vertical gameplay, mute behavior, mobile controls, reduced motion, and cleanup. Use when validating character appearance, musical interactions, AudioWorklet paths, Strumrise gameplay, or release readiness.
---

# Workflow

1. Test appearance separately from audio (toggle each independently in
   the appearance/debug panels).
2. Test audio activation and mute.
3. Test one string contact and contact cooldown (no retrigger on overlap).
4. Test strum recognition.
5. Test voice cap and output safety (no clipping with max simultaneous
   voices).
6. Test transition in and out.
7. Test game physics and generation.
8. Test muted and reduced-motion play.
9. Test mobile and lost focus.
10. Capture console and worklet errors.
11. Record frame and voice counts.
12. Block completion when introduced failures remain — see
    `.claude/skills/testing-mascot-performance/SKILL.md` for how this repo
    handles "no browser automation available" (document the gap in
    `docs/mascot/STRUMRISE_PLAYTEST.md`, do not invent results).

Read `references/audio-test-matrix.md` and `references/game-test-matrix.md`
before final validation.
