# Cuteness and hierarchy

Prioritize, in this order:

1. readable silhouette
2. stable face
3. large head relative to torso
4. rounded transitions
5. clear eyes at small size
6. delayed fin and tail response
7. sparse accents

Render layer order (`lib/mascot/appearance/SilhouetteRenderer.ts` +
`RimRenderer.ts` + `DotSkin.ts`, orchestrated from `MascotEngine.render()`):

```text
1. soft shadow or grounding aura
2. base silhouette
3. internal base gradient
4. clipped procedural print
5. clipped secondary spots or marks
6. sparse structural dots
7. edge rim
8. face
9. highlights
10. temporary particles
11. debug overlays
```

Quality-gate which layers run:

```text
reduced: silhouette + face
low:     silhouette + one flat print + face + simple rim
medium:  full print + sparse dots + rim + restrained particles
high:    denser print + secondary highlights + richer particles
```

Avoid:

- equally bright colours everywhere (this repo's base build's
  cyan/magenta dot groups at equal opacity is exactly the failure mode to
  fix)
- tiny facial details
- constant blinking
- tail longer than the readable body by several times
- high-frequency noise on the outer edge
- a floating white circle without facial structure (the base build's
  `CanvasMascotRenderer.drawCore` is exactly this — it becomes the eye/face
  anchor, not the whole face, once `FaceRig` exists)
