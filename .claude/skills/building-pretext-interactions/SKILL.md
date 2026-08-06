---
name: building-pretext-interactions
description: Prototypes text-layout interactions between Pretext-generated geometry and the procedural mascot. Use when creating text paths, line surfaces, exclusion zones, text-to-dot transitions, or word-feeding experiments after the core mascot is stable.
---

# Pretext interaction workflow

1. Inspect the installed `@chenglou/pretext` API (already used by the
   existing, unrelated `components/PretextCopyLab.tsx` experiment — read
   that file first for how this repo already calls into Pretext) and
   current project usage before writing new code.
2. Keep the experiment isolated from normal semantic text — do not let a
   mascot/Pretext interaction replace or hide accessible page copy.
3. Prepare unchanged text and font data once, not per frame.
4. Recalculate layout only when width or exclusion geometry changes.
5. Limit update frequency — never reflow the entire portfolio at
   animation-frame frequency (60fps text reflow is explicitly listed as a
   performance anti-pattern to reject).
6. Keep original accessible text present in the DOM at all times.
7. Cap sampled text particles the same way `ParticlePool` caps every other
   category — reuse `ParticlePool`, don't build a second unbounded system.
8. Provide a failure-safe restoration path: if the effect breaks or throws,
   the underlying text must still be readable and unaffected.
9. Test resize and font loading (FOUT/FOIT can shift line geometry after
   the effect has already measured it).
10. Keep the feature behind a flag until approved — this is explicitly
    Phase 13 in `PROCEDURAL_MASCOT_CLAUDE_CODE_MASTER_PLAN.md`, gated on
    core mascot completion, and has not been built yet in this repo (see
    `docs/mascot/BASELINE_AUDIT.md` and `docs/mascot/FINAL_REPORT.md` for
    why it's deferred).

Read `references/experiments.md` before selecting an interaction.
