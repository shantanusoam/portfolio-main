---
name: directing-character-motion
description: Reviews procedural mascot animation for silhouette clarity, anticipation, follow-through, personality, repetition, and interaction readability. Use after motion changes, when comparing deterministic recordings, or when deciding whether parameter tuning is better than solver rewrites.
---

# Motion direction review

Review deterministic recordings before implementation details — run the
relevant scenario from `lib/mascot/debug/DeterministicScenarios.ts` via the
`/motion-lab` debug panel's scenario player, or `getDebugSnapshot()` polling,
rather than judging from a code diff alone.

Score:

- silhouette clarity
- anticipation
- acceleration
- hard-turn response
- stopping and settling
- tail follow-through
- state transition continuity
- interaction readability
- originality
- reduced-motion behavior
- frame stability

Return:

1. strongest quality
2. highest-impact weakness
3. exact scenario and time
4. likely parameter or system responsible (name the file: `MotionRecipes.ts`
   value, `MASCOT_CONFIG` value, or a specific solver in `lib/mascot/motion`)
5. smallest recommended change
6. regression risk

Do not edit code unless explicitly delegated — this review is read-only.

Read `references/review-rubric.md` for scoring anchors.
