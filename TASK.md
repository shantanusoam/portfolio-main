# Tasks

## Active

- [x] 2026-08-04: Open CareerDiagnostics frame — drop outer border/black fill; keep only column side rules
- [x] 2026-08-04: Restyle System Status card to match archive — corner ticks, target-ring badge, stronger type
- [x] 2026-08-04: Rebuild Current Focus process rail — glowing line + REPEAT lens-flare node to match archive reference
- [x] 2026-08-04: Tighten CareerDiagnostics panel side padding and bump body/label font sizes slightly
- [x] 2026-08-04: Close remaining Experience gaps vs the archive mockup — map-pin checkpoint icons, mockup timeline copy/dates/tech chips, logo rack order, left-anchored quote glyph with right-aligned text, current-focus copy; fixed the broken `--font-mono` alias that was collapsing every Experience `font:` shorthand to Inter 16px
- [x] 2026-08-06: Align diagonal enemy projectile artwork with top-down bullet trajectories
- [x] 2026-08-06: Increase Cluckstorm enemy, projectile, and pickup visual sizes without changing hitboxes
- [x] 2026-08-06: Add Cluckstorm juice pass — neon projectile trails, boss damage numbers, stronger warning entry, CRT scanlines
- [x] 2026-08-06: Preserve previous enemy prints as a selectable Classic Flock skin
- [x] 2026-08-06: Preserve the original courier print as a selectable ship skin and add Circuit, Ghost, and Solar variants
- [x] 2026-08-06: Continue Cluckstorm — strict top-down Gemini sprites, nova bombs, smart enemy formations, and Easy/Hard modes
- [x] 2026-08-05: Fix SecretArcade courier ship orientation — sprite faced bottom-left; rotate to nose-up for vertical shmup
- [x] 2026-08-04: Restyle Experience to match the first archive mockup — glass logo rack, // CHECKPOINT labels, diagnostics footer polish
- [x] 2026-08-03: Match About + Experience to the archive reference art — real tech brand icons, yarn patch assets, live career counter, logo tiles, IBM Plex Mono typography
- [x] 2026-08-03: Add the Make/Break interactive word transition to the About studio panel
- [x] 2026-08-03: Unify About and Experience under the Crafted Systems Archive visual system
- [x] 2026-08-03: Add seamless black-linen page background for the dark theme
- [x] 2026-08-03: Use ChatGPT linen texture as Hero section background
- [x] 2026-08-03: Replace procedural black-linen with ChatGPT weave (12_12_16) site-wide
- [x] 2026-07-25: Fix `/testing` prerender crash from Spline SSR
- [x] 2026-07-25: Remove Hero glow/light-leak overlays and tighten vertical composition
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
- [x] 2026-07-25: Improve Hero instrument desktop playability, physical synthesis, feedback, and chord-based musicality
- [x] 2026-07-25: Fix silent Hero instrument and unstable Web Audio filter state
- [x] 2026-07-25: Fix StickyCursor top-left lock, transform contention, and Navbar target wiring
- [x] 2026-07-25: Fix cursor angle glitch (transform order + atan2 seam), add elastic escape strain and wobbly magnetic release

## Discovered During Work

- `--font-mono: var(--font-data)` was declared on `:root` (html), but next/font sets `--font-data` via a class on `<body>` — the alias resolved to nothing, so every `font: ... var(--font-mono)` shorthand was invalid at computed-value time and silently fell back to inherited Inter 16px/400. Moved the alias onto `body`; IBM Plex Mono sizes/weights now actually apply across Experience (and everywhere else using `--font-mono`).
- The stock `quote-marks.svg` bakes in `fill-opacity: .22`; added `quote-marks-solid.svg` for the left-anchored quote glyph that reads at full strength beside (not behind) the text.

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
- Hero pull gesture switched strings after half a row gap, before reaching its allowed bend; slow pulls now lock while fast sweeps trigger every crossed string
- Karplus–Strong feedback read `samples[-1]` on its first iteration, propagating NaN through every BiquadFilterNode and silencing the instrument
- StickyCursor's custom `transformTemplate` omitted x/y, replacing Framer Motion's translate transform and pinning the cursor at the viewport origin
- Cursor's centering `translate(-50%,-50%)` sat after rotate/scale in the transform list, so the offset itself got rotated — on a wrapped ~300px field a few degrees of angle swung the box around the pointer; lerping raw atan2 also spun 358° across the ±180° seam
- Sticky cursor stretch/rotate kept running while the field wrapped a target — that angle glitch made capture feel broken; held state now suppresses deformation
- `.MagneticHead` still carried Olivier Larose header CSS (`position: fixed`, `mix-blend-mode`) which fought magnetic transforms

## Follow-ups

- [ ] Re-export About stickers at 256px (or WebP) — files are still 512px / ~1.6MB total
- [x] 2026-07-25: Rebuild sticky cursor + magnetic physics — soft capture field, held-wrap without stretch glitch, fluid free motion
