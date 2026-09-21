# Solarpunk evolution — validation

## Full application checks

- Full repository TypeScript check passed (`tsc --noEmit`), independently of Next's existing `ignoreBuildErrors` setting.
- Six tests passed: four existing semantic-tree tests plus time-of-day input bounds and continuity at chapter boundaries.
- Full app in Chromium 133 / Playwright: homepage HTTP 200 and no page errors.
- No horizontal overflow at 320, 390, 768 and 1440 CSS pixels.
- Browser assertions passed for scroll-driven lighting/progress, visible WebGL rendering, mesh toggle, persistent motion control, canvas fallback in quiet mode, music start/pause/volume visibility, existing tree loading, and live OS reduced-motion changes.
- Production-browser checks also passed for homepage interactions and HTTP 200 responses from `/projects/niva-bupa`, `/systems`, and `/blog`.
- Desktop and phone screenshots were inspected. The typography, meadow crop, green palette and reading hierarchy retain the requested calm atmosphere.

The image is a still photograph-like generated asset; the light response is a real shader. The soundtrack is an original generative Web Audio score. No animated birds, horse simulation, generated video, real-device frame-rate or field Core Web Vitals are claimed.

## Production build

Production compilation and generation of all 61 pages passed on the first run; Next then encountered an ENOTEMPTY error cleaning its temporary export directory. A clean retry passed completely: production compilation, all 61 generated pages, trace collection and build output. Next reports 119 kB first-load JavaScript for the homepage; dynamically loaded motion and shader chunks are additional, so this is not a total interaction-transfer budget.

## Preview

This work continues on `design/tomorrows-workshop` and draft PR #21. The default branch is unchanged.

![Desktop](./workshop-desktop.webp)

![Phone](./workshop-mobile.webp)
