---
name: choreographing-page-to-game-transitions
description: Designs and implements seamless transitions between the portfolio mascot and the full-screen Strumrise game, including deliberate activation, falling, tumbling, string cascades, landing, camera reframing, cleanup, and return to the page. Use when changing game gates, overlay transitions, drop gestures, intro choreography, exit flows, or page/game lifecycle.
---

# Workflow

1. Verify the game trigger is deliberate and accessible — a visible
   button/control, never inferred from ordinary scroll or a navigation
   click.
2. Preserve current page state (scroll position, mute setting, quality
   tier).
3. Choreograph anticipation, drop, string cascade, landing, and reveal —
   see `references/transition-beats.md`.
4. Keep input ownership explicit during the transition (the mascot engine
   owns it, not two systems fighting over pointer/keyboard events).
5. Pause homepage-only systems in game mode (`DomObstacleRegistry`,
   homepage wander/behavior) rather than running both simultaneously.
6. Preserve mute and quality settings across the transition in both
   directions.
7. Provide a visible exit at all times once the game is entered.
8. Restore the homepage engine safely on exit — same lifecycle guarantees
   as `MascotEngine.destroy()`/`.pause()`/`.resume()`, not a fresh reload.
9. Test interruption, resize, route change, and reduced motion.
10. Keep the intro skippable after the first play (a retry should not
    replay a long choreographed sequence).

Read `references/transition-beats.md` and `references/input-safety.md`
before editing.
