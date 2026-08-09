# Portfolio Micro-Assets Pack

A reusable asset kit based on the two supplied portfolio sections. Everything was recreated as original procedural/vector artwork rather than cropped from the references.

## What was identified

### Surface depth
- dark woven/linen base
- transparent fiber weave
- micro-noise and film grain
- scanlines, dust and scratches
- crosshatch, vignette and orange glow strip

### Technical decoration
- registration plus, crosshair and target rings
- 24 px grid, dot grid and coordinate ticks
- corner/crop brackets
- short rules, bullets, section slashes and quote marks
- diagonal hatch bar
- dashed, dotted and stitched Bezier routes
- timeline nodes and glowing progress line

### Hardware and panels
- Phillips, slotted, hex and flat bolts
- glowing bolt variant
- scalable glass sign panel with four integrated bolts
- micro status card
- topographic map panel

### Blueprint line art
- house, shield, wallet, tree, circuit and compass

## Best layering recipe

1. `dark-linen-base-2048.png` as the base.
2. `linen-fibers-overlay-1024.png` at 20-45% opacity.
3. `micro-noise-overlay-1024.png` using `soft-light` at 15-30%.
4. `scanlines-overlay-512.png` at 10-20%.
5. Optional dust/scratches at 10-25%.
6. Finish with `vignette-overlay-1600x1000.png`.

The visual depth comes from several quiet, imperfect layers. Avoid raising any one texture above roughly 45% opacity.

## Procedural natural-line formula

`procedural/procedural-backgrounds.js` includes dependency-free seeded value noise, fractal Brownian motion (fBm), marching-squares contours, linen fibers and organic Bezier routes. The seed makes the result repeatable.

```js
import { drawContours, drawFibers } from './procedural/procedural-backgrounds.js';
drawContours(document.querySelector('#topo'), { seed: 42, levels: 13 });
drawFibers(document.querySelector('#fibers'), { seed: 11 });
```

## CSS

Import `css/micro-assets.css`, then use:

```html
<section class="fx-linen fx-surface-depth fx-technical-grid">...</section>
<div class="fx-glass-sign">I make stuff on the internet</div>
<div class="fx-topography"></div>
```

## Notes

- SVG files are the preferred production assets because they remain sharp at any size.
- PNG versions are included for drag-and-drop use in Figma, Framer and image editors.
- All raster overlays use transparency except the dark linen base.
- Suggested accent: `#ff5a1f`.
