---
name: designing-procedural-character-skins
description: Designs and implements readable, cute, original procedural mascot silhouettes, face rigs, local-space skin patterns, rim lighting, and layered Canvas rendering. Use when the mascot looks noisy, shapeless, unreadable, overly particle-based, or needs new expressions, textures, prints, palettes, and appearance presets.
---

# Workflow

1. Review the mascot as a silhouette before reviewing dots — toggle dots
   off in the appearance panel and judge the filled body shape alone.
2. Capture 96-pixel, light-background, and dark-background previews.
3. Identify the head, torso, tail, and face frame from the existing spine
   (`lib/mascot/motion/SpineSolver.ts`'s joints, `CreatureRecipe.regions`).
4. Stabilize the base contour (`lib/mascot/appearance/BodyContour.ts`)
   before adding texture.
5. Place face features in a local head frame
   (`lib/mascot/appearance/FaceRig.ts`'s `FaceFrame`), never world-space
   offsets.
6. Create print coordinates in body-local `u`/`v`
   (`lib/mascot/appearance/LocalSkinCoordinates.ts`), resolved from the
   current rib set each frame, generated once per recipe/quality change.
7. Add one dominant colour, one support colour, and one accent — see
   `references/cuteness-and-hierarchy.md`.
8. Add dots only after the solid body reads clearly — they're an accent
   layer (`lib/mascot/character/DotSkin.ts`), not the primary silhouette.
9. Test fall, landing, hard turn, and rest poses using `/motion-lab`'s
   deterministic scenarios.
10. Run the appearance review checklist and check render-time cost before
    and after each new layer.

# Invariants

- The head is recognisable.
- The face remains attached (derived from `FaceFrame`, never independent
  world-space coordinates).
- Texture does not swim through the body — every mark keeps its `u`/`v`
  and seed; only the resolved world position changes with the rig.
- Pattern seeds do not change every frame (`SeededRandom`, generated once).
- Reduced mode remains the same character (silhouette + face only, still
  legible).
- No copied mascot silhouette.
- Dots support the form rather than replace it.

Read `references/cuteness-and-hierarchy.md` before changing proportions.
Read `references/local-space-patterns.md` before changing pattern systems.
Read `references/appearance-review.md` before declaring a phase complete.
