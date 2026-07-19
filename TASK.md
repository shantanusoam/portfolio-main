# Tasks

## Active
- [x] 2026-07-19: Fix home page post-load lag and scroll jank (Home container / main)
- [x] 2026-07-19: Redesign Intro/About — concise copy + scroll-triggered corner stickers (flowers/paintbrush), performance-safe
- [x] 2026-07-19: Wire generated About stickers from public/stickers/aboutus/ (renamed + resized to 256px)
- [x] 2026-07-19: Delight pass on MakeAndBreak + Intro — scrapbook layout, fix mid-word reveal, fill dead space with larger stickers
- [x] 2026-07-19: Fix jaggy scroll through Hero → MakeAndBreak → Intro (initial load + scroll lag)
- [x] 2026-07-19: Fix Socials/Navbar/Projects broken forwardRef patterns (TS errors + React warning)

## Discovered During Work
- ComboTrail was painting a ~14k-px-tall SVG with `mix-blend-screen` (primary scroll jank source)
- CSS `scroll-behavior: smooth` was stacking with Lenis
- Film-grain `mix-blend-mode: overlay` forced a full-viewport composite every frame
- StickyCursor used `left`/`top` + unthrottled `getBoundingClientRect` on every mousemove
- TextCarousel ran animated `blur()` on 6 looping headlines (constant Hero GPU cost)
- Dead `@splinetool/react-spline` import in Hero still pulled the heavy Spline bundle
- Intro stickers: 4 scroll transforms × 6 + `drop-shadow` filter; ~1.6MB of 512px PNGs for ~128px display
- ComboTrail deferred via `next/dynamic` so first three sections hydrate sooner
- Socials stuffed `{ref1, ref2}` into React `ref` (invalid); Projects `forwardRef` omitted the `ref` param

## Follow-ups
- [ ] Re-export About stickers at 256px (or WebP) — files are still 512px / ~1.6MB total
