# Tasks

## Active
- [x] 2026-07-19: Fix home page post-load lag and scroll jank (Home container / main)
- [x] 2026-07-19: Redesign Intro/About — concise copy + scroll-triggered corner stickers (flowers/paintbrush), performance-safe
- [x] 2026-07-19: Wire generated About stickers from public/stickers/aboutus/ (renamed + resized to 256px)
- [x] 2026-07-19: Delight pass on MakeAndBreak + Intro — scrapbook layout, fix mid-word reveal, fill dead space with larger stickers
- [x] 2026-07-19: Fix jaggy scroll through Hero → MakeAndBreak → Intro (initial load + scroll lag)
- [x] 2026-07-19: Fix Socials/Navbar/Projects broken forwardRef patterns (TS errors + React warning)
- [x] 2026-07-19: Fix Hero visual bugs — greeting carousel ghosting/desync, String lines cutting through the name, over-eager scroll exit fade
- [x] 2026-07-19: Fix ComboMeter skill chips invisible (all label copies were absolutely positioned → chips collapsed to ~0px behind overflow-hidden); expanded combos.ts with more resume skills (React Native, shadcn/ui, Micro Frontends, Nginx, CI/CD, Vector DBs, Edge AI, etc.)
- [x] 2026-07-21: Compact ComboMeter layout — denser rows, smaller chips, tighter section padding for a sleeker read
- [x] 2026-07-21: Rebuild Hero strings as a responsive, physics-driven playable guitar instrument
- [x] 2026-07-21: Recompose Hero layout around the playable strings across short desktop and mobile viewports

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
- TextCarousel's 6 infinite loops had mismatched keyframes/`times` (4 vs 5) and a loop period (11.2s) that never matched the stagger total (10.8s) — words ghosted and drifted out of sync; rebuilt as single-element AnimatePresence `mode="wait"` rotator
- String.tsx drew its curve at `window.innerWidth * 0.7` regardless of its 60vw/71vw container; now measures its own svg
- ComboMeter chips: lit orange text/bars were also illegible against the row's orange hover sweep — now flip to white via the row-level `group-hover`
- Removed the dead Spline import + commented JSX from Hero (was still pulling the Spline bundle)
- Hero strings previously depended on one rubber-band sample and mouse-leave; replaced with tuned Web Audio synthesis and unified pointer/keyboard input

## Follow-ups
- [ ] Re-export About stickers at 256px (or WebP) — files are still 512px / ~1.6MB total
